<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SocialiteController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->withErrors(['google' => 'Google authentication failed. Please try again.']);
        }

        if (!$googleUser->email) {
            return redirect()->route('login')->withErrors(['google' => 'Google account must have an email address.']);
        }

        $user = User::where('email', $googleUser->email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $googleUser->name ?? 'Google User',
                'email' => $googleUser->email,
                'display_name' => $googleUser->name,
                'provider' => 'google',
                'password' => bcrypt(\Illuminate\Support\Str::random(32)),
            ]);
        }

        Auth::login($user);

        return redirect()->intended('/dashboard');
    }
}
