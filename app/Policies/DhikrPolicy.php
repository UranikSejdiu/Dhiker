<?php
namespace App\Policies;

use App\Models\Dhikr;
use App\Models\User;

class DhikrPolicy
{
    public function view(User $user, Dhikr $dhikr): bool
    {
        return $dhikr->user_id === $user->id;
    }

    public function update(User $user, Dhikr $dhikr): bool
    {
        return $dhikr->user_id === $user->id;
    }

    public function delete(User $user, Dhikr $dhikr): bool
    {
        return $dhikr->user_id === $user->id;
    }
}
