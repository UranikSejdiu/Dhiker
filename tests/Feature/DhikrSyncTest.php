<?php

namespace Tests\Feature;

use App\Models\Dhikr;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DhikrSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_updates_counts()
    {
        $user = User::factory()->create();
        $dhikr = Dhikr::factory()->create([
            'user_id' => $user->id,
            'total_count' => 0,
            'daily_count' => 0,
            'last_reset_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($user)->postJson(route('dhikrs.sync'), [
            'dhikrs' => [
                ['id' => $dhikr->id, 'total_count' => 10, 'daily_count' => 5],
            ],
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        $this->assertDatabaseHas('dhikrs', [
            'id' => $dhikr->id,
            'total_count' => 10,
            'daily_count' => 5,
        ]);
    }

    public function test_sync_rejects_other_users_dhikrs()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $dhikr = Dhikr::factory()->create(['user_id' => $user2->id]);

        $response = $this->actingAs($user1)->postJson(route('dhikrs.sync'), [
            'dhikrs' => [
                ['id' => $dhikr->id, 'total_count' => 99, 'daily_count' => 99],
            ],
        ]);

        $response->assertForbidden();
    }

    public function test_sync_requires_auth()
    {
        $response = $this->postJson(route('dhikrs.sync'), [
            'dhikrs' => [],
        ]);

        $response->assertUnauthorized();
    }

    public function test_sync_validates_input()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('dhikrs.sync'), [
            'dhikrs' => [
                ['id' => 99999, 'total_count' => -1, 'daily_count' => 0],
            ],
        ]);

        $response->assertJsonValidationErrors(['dhikrs.0.id', 'dhikrs.0.total_count']);
    }
}
