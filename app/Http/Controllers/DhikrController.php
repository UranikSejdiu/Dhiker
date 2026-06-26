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
        $today = now()->toDateString();
        Auth::user()->dhikrs()
            ->where('last_reset_date', '<', $today)
            ->where('daily_count', '>', 0)
            ->update([
                'daily_count' => 0,
                'last_reset_date' => $today,
            ]);

        $dhikrs = Auth::user()->dhikrs()->orderBy('sort_order')->orderBy('created_at', 'desc')->get();
        return inertia('Dashboard', ['dhikrs' => $dhikrs]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'daily_limit' => 'nullable|integer|min:1',
        ]);

        $maxOrder = Auth::user()->dhikrs()->max('sort_order') ?? 0;

        Auth::user()->dhikrs()->create([
            'name' => $validated['name'],
            'daily_limit' => $validated['daily_limit'],
            'last_reset_date' => now()->toDateString(),
            'sort_order' => $maxOrder + 1,
        ]);

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

    public function reorder(Request $request)
    {
        $data = $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|integer|exists:dhikrs,id',
        ]);

        $userIds = Auth::user()->dhikrs()->pluck('id')->flip();

        DB::transaction(function () use ($data, $userIds) {
            foreach ($data['order'] as $i => $id) {
                if (!$userIds->has($id)) {
                    abort(403);
                }
                Dhikr::where('id', $id)->update(['sort_order' => $i]);
            }
        });

        return response()->json(['success' => true]);
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
        $today = now()->toDateString();

        DB::transaction(function () use ($data, $userIds, $today) {
            foreach ($data['dhikrs'] as $item) {
                if (!$userIds->has($item['id'])) {
                    abort(403);
                }
                $dhikr = Dhikr::where('id', $item['id'])->first();
                if ($dhikr && $dhikr->last_reset_date->toDateString() < $today) {
                    $dhikr->update([
                        'total_count' => $item['total_count'],
                        'daily_count' => $item['daily_count'],
                        'last_reset_date' => $today,
                    ]);
                } else {
                    $dhikr->update([
                        'total_count' => $item['total_count'],
                        'daily_count' => $item['daily_count'],
                    ]);
                }
            }
        });

        return response()->json(['success' => true]);
    }
}
