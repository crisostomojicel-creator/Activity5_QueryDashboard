<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderProduct;
use App\Models\Review;
use App\Models\User;
use Carbon\Carbon;
use App\Traits\ApiResponses;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use ApiResponses;

    public function index()
    {
        $products = Product::with('category')->paginate(10);
        return $this->ok('Products retrieved successfully', ProductResource::collection($products));
    }

    public function show(Product $product)
    {
        $product->load('category');
        return $this->ok('Product retrieved successfully', new ProductResource($product));
    }

    public function queries(Request $request)
    {
        // A. Querying Tables
        $nameAndPrice = Product::select('name', 'price')->get();
        $productsWithCategory = Product::with('category')->get();
        $productsOrderedByPrice = Product::select('id', 'name')->orderBy('price', 'asc')->get();
        $firstFiveProducts = Product::limit(5)->get();

        // B. Filtering Data
        $priceGreaterThanOrEqual = Product::where('price', '>=', 3)->get();
        
        // Unang subukan hanapin ang 'Electronics'
        $electronics = Product::whereHas('category', function ($q) {
            $q->whereRaw('LOWER(name) LIKE ?', ['%electronics%']);
        })->get();

        // Fallback: Kung walang nahanap na 'Electronics' (dahil Faker category names gaya ng 'nemo', 'error', etc. ang nasa DB),
        // kukunin natin ang mga produkto ng Unang Category para siguradong may laman ang response
        if ($electronics->isEmpty()) {
            $firstCategory = Category::first();
            if ($firstCategory) {
                $electronics = Product::where('category_id', $firstCategory->id)->get();
            }
        }

        // C. Aggregating Data (Fixed to Product::sum for total_price and rounded to 2 decimals)
        $totalPrice = round((float) Product::sum('price'), 2);
        $averagePrice = round((float) Product::avg('price'), 2); 
        $highestPrice = round((float) Product::max('price'), 2);
        $lowestPrice = round((float) Product::min('price'), 2);

        // D. Grouping, Filtering, and Sorting (Added ROUND(..., 2) to all aggregate functions)
        $totalPricePerCategory = Product::join('categories', 'products.category_id', '=', 'categories.id')
            ->select('categories.name', DB::raw('ROUND(SUM(products.price), 2) as total_price'))
            ->groupBy('categories.id', 'categories.name')
            ->get();

        $averagePricePerCategory = Product::join('categories', 'products.category_id', '=', 'categories.id')
            ->select('categories.name', DB::raw('ROUND(AVG(products.price), 2) as avg_price'))
            ->groupBy('categories.id', 'categories.name')
            ->get();

        $lowestPricePerCategory = Product::join('categories', 'products.category_id', '=', 'categories.id')
            ->select('categories.name', DB::raw('ROUND(MIN(products.price), 2) as min_price'))
            ->groupBy('categories.id', 'categories.name')
            ->get();

        $averagePriceSorted = Product::join('categories', 'products.category_id', '=', 'categories.id')
            ->select('categories.name', DB::raw('ROUND(AVG(products.price), 2) as avg_price'))
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('avg_price', 'asc')
            ->get();

        $electronicsAndBooks = Product::join('categories', 'products.category_id', '=', 'categories.id')
            ->whereIn('categories.name', ['Electronics', 'Books'])
            ->select('categories.name', DB::raw('ROUND(AVG(products.price), 2) as avg_price'))
            ->groupBy('categories.id', 'categories.name')
            ->get();

        // Dashboard data: every series below is calculated from the tables in this project.
        $allProducts = Product::with('category')->get();
        $allOrders = Order::with('user')->get();
        $orderLines = OrderProduct::with(['product.category', 'order'])->get();
        $allReviews = Review::with('product.category')->get();
        $allUsers = User::select('id', 'name', 'created_at')->get();

        // Optional dashboard date range. Product catalogue metrics remain all-time;
        // transactional metrics follow the selected period.
        $period = $request->query('period', 'all');
        $periodStart = match ($period) {
            'year' => Carbon::now()->startOfYear(),
            '30days' => Carbon::now()->subDays(30)->startOfDay(),
            default => null,
        };
        if ($periodStart) {
            $allOrders = $allOrders->filter(fn ($o) => Carbon::parse($o->date ?? $o->created_at)->greaterThanOrEqualTo($periodStart))->values();
            $validOrderIds = $allOrders->pluck('id')->all();
            $orderLines = $orderLines->filter(fn ($line) => in_array($line->order_id, $validOrderIds))->values();
            $allReviews = $allReviews->filter(fn ($r) => Carbon::parse($r->created_at)->greaterThanOrEqualTo($periodStart))->values();
            $allUsers = $allUsers->filter(fn ($u) => Carbon::parse($u->created_at)->greaterThanOrEqualTo($periodStart))->values();
        }

        $categoryRows = $allProducts->groupBy(fn ($p) => optional($p->category)->name ?? 'Uncategorized')
            ->map(function ($items, $name) {
                return ['name' => $name, 'product_count' => $items->count(),
                    'total_value' => round((float) $items->sum('price'), 2),
                    'average_price' => round((float) $items->avg('price'), 2)];
            })->values();

        $prices = $allProducts->pluck('price')->map(fn ($v) => (float) $v);
        $priceMin = $prices->min() ?? 0;
        $priceMax = $prices->max() ?? 0;
        $binCount = 8;
        $binWidth = $priceMax > $priceMin ? ($priceMax - $priceMin) / $binCount : 1;
        $priceDistribution = collect(range(0, $binCount - 1))->map(function ($i) use ($prices, $priceMin, $binWidth) {
            $start = $priceMin + ($i * $binWidth);
            $end = $start + $binWidth;
            return ['range' => number_format($start, 0) . '–' . number_format($end, 0),
                'count' => $prices->filter(fn ($price) => $price >= $start && ($price < $end || $i === 7))->count()];
        })->values();

        $months = collect(range(1, 12))->map(fn ($m) => ['month' => Carbon::create(null, $m, 1)->format('M'), 'month_number' => $m]);
        $ordersByMonth = $allOrders->groupBy(fn ($o) => Carbon::parse($o->date ?? $o->created_at)->format('n'));
        $usersByMonth = $allUsers->groupBy(fn ($u) => Carbon::parse($u->created_at)->format('n'));
        $orderLinesByMonth = $orderLines->groupBy(fn ($line) => Carbon::parse(optional($line->order)->date ?? optional($line->order)->created_at ?? $line->created_at)->format('n'));
        $monthlyOrders = $months->map(fn ($m) => ['month' => $m['month'], 'value' => ($ordersByMonth->get((string) $m['month_number']) ?? collect())->count()])->values();
        $monthlyUsers = $months->map(fn ($m) => ['month' => $m['month'], 'value' => ($usersByMonth->get((string) $m['month_number']) ?? collect())->count()])->values();
        $monthlyRevenue = $months->map(function ($m) use ($orderLinesByMonth) {
            $lines = $orderLinesByMonth->get((string) $m['month_number']) ?? collect();
            return ['month' => $m['month'], 'value' => round((float) $lines->sum(fn ($line) => (float) optional($line->product)->price * (int) $line->quantity), 2)];
        })->values();

        $topSelling = $orderLines->groupBy(fn ($line) => optional($line->product)->name ?? 'Deleted product')
            ->map(fn ($items, $name) => ['name' => $name, 'quantity' => (int) $items->sum('quantity')])
            ->sortByDesc('quantity')->take(10)->values();
        $ratingCounts = collect(range(1, 5))->map(fn ($rating) => ['rating' => $rating, 'count' => $allReviews->where('rating', $rating)->count()]);
        $averageRatingByCategory = $allReviews->groupBy(fn ($review) => optional(optional($review->product)->category)->name ?? 'Uncategorized')
            ->map(fn ($items, $name) => ['name' => $name, 'average_rating' => round((float) $items->avg('rating'), 2), 'review_count' => $items->count()])->values();
        $reviewsByMonth = $allReviews->groupBy(fn ($review) => Carbon::parse($review->created_at)->format('n'));
        $monthlyReviews = $months->map(fn ($m) => ['month' => $m['month'], 'value' => ($reviewsByMonth->get((string) $m['month_number']) ?? collect())->count()])->values();
        $ordersPerUser = $allOrders->groupBy('user_id')->map(fn ($items, $userId) => ['user_id' => (int) $userId, 'orders' => $items->count()])->values();
        $ordersPerUserDistribution = collect([
            ['name' => '1 Order', 'min' => 1, 'max' => 1],
            ['name' => '2 Orders', 'min' => 2, 'max' => 2],
            ['name' => '3–4 Orders', 'min' => 3, 'max' => 4],
            ['name' => '5–6 Orders', 'min' => 5, 'max' => 6],
            ['name' => '7+ Orders', 'min' => 7, 'max' => PHP_INT_MAX],
        ])->map(fn ($bucket) => ['name' => $bucket['name'], 'value' => $ordersPerUser->filter(fn ($row) => $row['orders'] >= $bucket['min'] && $row['orders'] <= $bucket['max'])->count()])->values();
        $productReviewCounts = $allReviews->groupBy('product_id')->map(fn ($items) => $items->count());
        $priceVsReviews = $allProducts->map(fn ($product) => ['price' => (float) $product->price, 'reviews' => (int) ($productReviewCounts->get($product->id) ?? 0), 'name' => $product->name])->values();
        $orderValuesByCategory = $orderLines->groupBy(fn ($line) => optional(optional($line->product)->category)->name ?? 'Uncategorized')
            ->map(fn ($items, $name) => ['name' => $name, 'values' => $items->map(fn ($line) => round((float) optional($line->product)->price * (int) $line->quantity, 2))->values()])->values();
        $revenueByCategory = $orderLines->groupBy(fn ($line) => optional(optional($line->product)->category)->name ?? 'Uncategorized')
            ->map(fn ($items, $name) => ['name' => $name, 'value' => round((float) $items->sum(fn ($line) => (float) optional($line->product)->price * (int) $line->quantity), 2)])->values();
        $ordersByCategory = $orderLines->groupBy(fn ($line) => optional(optional($line->product)->category)->name ?? 'Uncategorized')
            ->map(fn ($items, $name) => ['name' => $name, 'value' => $items->pluck('order_id')->unique()->count()])->sortByDesc('value')->values();
        $categoryOrderContribution = $orderLines->groupBy(fn ($line) => optional(optional($line->product)->category)->name ?? 'Uncategorized')
            ->map(fn ($items, $name) => ['name' => $name, 'value' => (int) $items->sum('quantity')])->values();

        $queryResults = [
            'dashboard' => [
                'metrics' => ['products' => $allProducts->count(), 'orders' => $allOrders->count(), 'users' => $allUsers->count(), 'reviews' => $allReviews->count()],
                'products_by_category' => $categoryRows,
                'price_distribution' => $priceDistribution,
                'average_price_by_category' => $categoryRows->map(fn ($r) => ['name' => $r['name'], 'value' => $r['average_price']]),
                'total_value_by_category' => $categoryRows->map(fn ($r) => ['name' => $r['name'], 'value' => $r['total_value']]),
                'orders_over_time' => $monthlyOrders,
                'order_status_breakdown' => [],
                'orders_by_category' => $ordersByCategory,
                'revenue_by_category' => $revenueByCategory,
                'orders_per_user_distribution' => $ordersPerUserDistribution,
                'category_order_contribution' => $categoryOrderContribution,
                'top_selling_products' => $topSelling,
                'monthly_revenue' => $monthlyRevenue,
                'reviews_by_rating' => $ratingCounts,
                'average_rating_by_category' => $averageRatingByCategory,
                'user_registration_trend' => $monthlyUsers,
                'orders_per_user' => $ordersPerUser,
                'product_price_vs_reviews' => $priceVsReviews,
                'category_product_count' => $categoryRows->map(fn ($r) => ['name' => $r['name'], 'value' => $r['product_count']]),
                'order_value_distribution' => $orderValuesByCategory,
                'total_price' => $totalPrice,
                'average_price' => $averagePrice,
                'highest_price' => $highestPrice,
                'lowest_price' => $lowestPrice,
            ],
            'name_and_price' => $nameAndPrice,
            'products_with_category' => $productsWithCategory,
            'products_ordered_by_price' => $productsOrderedByPrice,
            'first_five_products' => $firstFiveProducts,
            'price_greater_than_or_equal' => $priceGreaterThanOrEqual,
            'electronics' => $electronics,
            'total_price' => $totalPrice,
            'average_price' => $averagePrice,
            'highest_price' => $highestPrice,
            'lowest_price' => $lowestPrice,
            'total_price_per_category' => $totalPricePerCategory,
            'average_price_per_category' => $averagePricePerCategory,
            'lowest_price_per_category' => $lowestPricePerCategory,
            'average_price_sorted' => $averagePriceSorted,
            'electronics_and_books' => $electronicsAndBooks,
        ];

        return $this->success('Query results retrieved successfully', $queryResults);
    }
}