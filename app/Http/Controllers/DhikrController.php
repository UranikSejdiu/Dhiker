<?php
namespace App\Http\Controllers;

use App\Events\DhikrCountUpdated;
use App\Models\Dhikr;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DhikrController extends Controller
{
    public function index()
    {
        $dhikrs = Auth::user()->dhikrs()->orderBy('created_at', 'desc')->get();
        return inertia('Dashboard', ['dhikrs' => $dhikrs]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'daily_limit' => 'nullable|integer|min:1',
        ]);

        $dhikr = Auth::user()->dhikrs()->create([
            'name' => $validated['name'],
            'daily_limit' => $validated['daily_limit'],
            'last_reset_date' => now()->toDateString(),
        ]);

        return redirect()->back();
    }

    public function increment(Dhikr $dhikr)
    {
        $this->authorize('view', $dhikr);

        $today = now()->toDateString();

        if (!$dhikr->last_reset_date || $dhikr->last_reset_date->toDateString() !== $today) {
            $dhikr->update([
                'daily_count' => 0,
                'last_reset_date' => $today,
            ]);
        }

        DB::transaction(function () use ($dhikr) {
            $dhikr->increment('total_count');
            $dhikr->increment('daily_count');
        });

        broadcast(new DhikrCountUpdated($dhikr->fresh()));

        return redirect()->back();
    }

    public function update(Request $request, Dhikr $dhikr)
    {
        $this->authorize('update', $dhikr);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'daily_limit' => 'nullable|integer|min:1',
        ]);

        $dhikr->update($validated);

        return redirect()->back();
    }

    public function destroy(Dhikr $dhikr)
    {
        $this->authorize('delete', $dhikr);

        $dhikr->delete();

        return redirect()->back();
    }

    public function resetCounts(Dhikr $dhikr)
    {
        $this->authorize('view', $dhikr);

        $dhikr->update([
            'total_count' => 0,
            'daily_count' => 0,
            'last_reset_date' => now()->toDateString(),
        ]);

        broadcast(new DhikrCountUpdated($dhikr->fresh()));

        return redirect()->back();
    }
}
