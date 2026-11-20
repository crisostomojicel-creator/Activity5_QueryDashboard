<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\CategoryResource;
use App\Models\Category;
use App\Traits\ApiResponses;

class CategoryController extends Controller
{
    use ApiResponses;

    public function show(Category $category)
    {
        return $this->ok('Category retrieved successfully', new CategoryResource($category));
    }
}