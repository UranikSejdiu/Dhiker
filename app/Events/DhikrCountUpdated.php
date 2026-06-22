<?php
namespace App\Events;

use App\Models\Dhikr;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class DhikrCountUpdated implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public Dhikr $dhikr;

    public function __construct(Dhikr $dhikr)
    {
        $this->dhikr = $dhikr;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->dhikr->user_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->dhikr->id,
            'total_count' => $this->dhikr->total_count,
            'daily_count' => $this->dhikr->daily_count,
        ];
    }
}
