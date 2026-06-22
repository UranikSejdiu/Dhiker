<?php

use App\Http\Controllers\DhikrController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\Auth\SocialiteController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return inertia('Auth/Login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DhikrController::class, 'index'])->name('dashboard');
    Route::post('/dhikrs', [DhikrController::class, 'store'])->name('dhikrs.store');
    Route::patch('/dhikrs/{dhikr}', [DhikrController::class, 'update'])->name('dhikrs.update');
    Route::delete('/dhikrs/{dhikr}', [DhikrController::class, 'destroy'])->name('dhikrs.destroy');
    Route::post('/dhikrs/{dhikr}/increment', [DhikrController::class, 'increment'])->name('dhikrs.increment')->middleware('throttle:60,1');
    Route::post('/dhikrs/{dhikr}/reset', [DhikrController::class, 'resetCounts'])->name('dhikrs.reset');
    Route::post('/dhikrs/sync', [DhikrController::class, 'sync'])->name('dhikrs.sync');
    Route::patch('/settings', [SettingsController::class, 'update'])->name('settings.update');
});

Route::get('/auth/google', [SocialiteController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [SocialiteController::class, 'callback'])->name('google.callback');

require __DIR__.'/auth.php';
