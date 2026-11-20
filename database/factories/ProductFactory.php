<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        $products = [
            ['name' => 'Wireless Mouse', 'description' => 'Ergonomic wireless mouse with smooth tracking and USB receiver.'],
            ['name' => 'Mechanical Keyboard', 'description' => 'RGB backlit mechanical gaming keyboard with tactile switches.'],
            ['name' => 'USB-C Hub', 'description' => '7-in-1 multi-port adapter with 4K HDMI, USB 3.0, and SD card reader.'],
            ['name' => 'Bluetooth Headphones', 'description' => 'Over-ear active noise-canceling wireless headphones with deep bass.'],
            ['name' => 'Laptop Stand', 'description' => 'Adjustable aluminum ergonomic laptop stand for better posture.'],
            ['name' => 'HD Webcam', 'description' => '1080p streaming webcam with built-in microphone and privacy cover.'],
            ['name' => 'Portable SSD 1TB', 'description' => 'High-speed external solid-state drive for fast file transfers.'],
            ['name' => 'Smart Desk Lamp', 'description' => 'Dimmable LED desk lamp with adjustable color temperatures and USB charging port.'],
            ['name' => 'Gaming Mouse Pad', 'description' => 'Extended waterproof non-slip rubber base desk mat for smooth gliding.'],
            ['name' => 'Type-C Fast Charger', 'description' => '65W wall charger adapter compatible with laptops and smartphones.'],
        ];

        $product = $this->faker->randomElement($products);

        return [
            'category_id' => $this->faker->numberBetween(1, 3), // Adjust based on your categories
            'name' => $product['name'],
            'description' => $product['description'],
            'price' => $this->faker->randomFloat(2, 10, 500),
        ];
    }
}