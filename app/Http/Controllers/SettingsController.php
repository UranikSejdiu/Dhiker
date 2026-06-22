<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SettingsController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'theme' => 'nullable|string|in:dark-gold,pure-light,emerald,midnight,amoled',
            'language' => 'nullable|string|in:en,de,fr,sq',
        ]);

        $user = Auth::user();

        if (array_key_exists('theme', $validated)) {
            $user->theme = $validated['theme'];
        }
        if (array_key_exists('language', $validated)) {
            $user->language = $validated['language'];
        }

        $user->save();

        return redirect()->back();
    }
}
