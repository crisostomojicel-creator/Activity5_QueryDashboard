<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'type' => 'products',

            'id' => (string) $this->id,

            'attributes' => [
                'name' => $this->name,
                'description' => $this->description,
                'price' => $this->price,
            ],

            'relationships' => [
                'category' => [
                    'data' => [
                        'type' => 'categories',
                        'id' => (string) $this->category_id,
                    ],
                ],
            ],

            'links' => [
                'self' => url('/api/v1/products/' . $this->id),
            ],
        ];
    }
}