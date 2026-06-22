<?php
namespace App\Http\Controllers;

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
        $this->authorize('update', $dhikr);

        DB::transaction(function () use ($dhikr) {
            $today = now()->toDateString();

            if (!$dhikr->last_reset_date || $dhikr->last_reset_date->toDateString() !== $today) {
                $dhikr->daily_count = 0;
                $dhikr->last_reset_date = $today;
            }

            $dhikr->total_count++;
            $dhikr->daily_count++;
            $dhikr->save();
        });

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
        $this->authorize('update', $dhikr);

        $dhikr->update([
            'total_count' => 0,
            'daily_count' => 0,
            'last_reset_date' => now()->toDateString(),
        ]);

        return redirect()->back();
    }

    public function sync(Request $request)
    {
        $data = $request->validate([
            'dhikrs' => 'required|array|min:1',
            'dhikrs.*.id' => 'required|integer|exists:dhikrs,id',
            'dhikrs.*.total_count' => 'required|integer|min:0',
            'dhikrs.*.daily_count' => 'required|integer|min:0',
        ]);

        $userIds = Auth::user()->dhikrs()->pluck('id')->flip();

        DB::transaction(function () use ($data, $userIds) {
            foreach ($data['dhikrs'] as $item) {
                if (!$userIds->has($item['id'])) {
                    abort(403);
                }
                Dhikr::where('id', $item['id'])->update([
                    'total_count' => $item['total_count'],
                    'daily_count' => $item['daily_count'],
                ]);
            }
        });

        $dhikrs = Auth::user()->dhikrs()->orderBy('created_at', 'desc')->get();
        return inertia('Dashboard', ['dhikrs' => $dhikrs]);
    }
}
