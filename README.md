# Dhikr Counter

A Laravel + Vue (Inertia) dhikr tracking app with multi-language and theme support.

## Features

- Track dhikr counts with per-dhikr daily limits
- 5 themes: Dark Gold, Pure Light, Emerald, Midnight, AMOLED
- 4 languages: English, Deutsch, Français, Shqip
- Google OAuth login
- PWA support (installable)
- Settings (theme, language) synced to your account across devices

## Requirements

- PHP 8.3+
- Composer
- Node.js 20+
- MySQL or SQLite

## Setup

```bash
# Clone & enter project
git clone <repo-url> dhikr-counter
cd dhikr-counter

# Install PHP dependencies
composer install

# Install JS dependencies
npm install

# Copy environment file
cp .env.example .env
php artisan key:generate

# Configure .env with your database and Google OAuth credentials

# Run migrations
php artisan migrate

# Build frontend
npm run build

# Start the server
php artisan serve
```

For development:

```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Vite hot-reload
npm run dev
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → OAuth consent screen → Credentials → OAuth client ID (Web application)
3. Add authorized redirect URI: `{APP_URL}/auth/google/callback`
4. Fill `.env`:
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Tech Stack

- **Framework**: Laravel 13
- **Frontend**: Vue 3 + Inertia.js + Vite
- **CSS**: Tailwind CSS 3
- **Auth**: Laravel Breeze + Socialite (Google)
- **PWA**: Service worker + manifest.json

## Project Structure

```
app/
  Http/Controllers/
    DhikrController.php     # Dhikr CRUD + increment/reset
    SettingsController.php  # Theme/language sync
    Auth/
      SocialiteController.php # Google OAuth
  Models/
    Dhikr.php
    User.php
  Policies/
    DhikrPolicy.php
resources/
  js/
    Pages/Dashboard.vue     # Main counter UI
    composables/
      useTheme.js           # Theme state (localStorage + DB sync)
      useLanguage.js        # Language state (localStorage + DB sync)
    Components/
      Fireworks.vue         # Goal reached animation
routes/
  web.php                   # All app routes
```
