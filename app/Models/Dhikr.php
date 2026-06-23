<?php
namespace App\Models;

use Database\Factories\DhikrFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dhikr extends Model
{
    /** @use HasFactory<DhikrFactory> */
    use HasFactory;

    protected $fillable = ['name', 'total_count', 'daily_count', 'daily_limit', 'last_reset_date', 'sort_order'];

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
