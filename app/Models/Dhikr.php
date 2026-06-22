<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dhikr extends Model
{
    protected $fillable = ['user_id', 'name', 'total_count', 'daily_count', 'daily_limit', 'last_reset_date'];

    protected function casts(): array
    {
        return [
            'last_reset_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
