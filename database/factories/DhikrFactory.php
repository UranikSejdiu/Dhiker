<?php

namespace Database\Factories;

use App\Models\Dhikr;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DhikrFactory extends Factory
{
    protected $model = Dhikr::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->word(),
            'total_count' => 0,
            'daily_count' => 0,
            'daily_limit' => null,
            'last_reset_date' => now()->toDateString(),
        ];
    }
}
