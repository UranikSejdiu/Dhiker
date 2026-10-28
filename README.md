# Dhikr Counter

A Laravel + Vue (Inertia) dhikr tracking app with multi-language and theme support.

## Features

- Track dhikr counts with per-dhikr daily limits
- 6 themes: Dark Gold, Warm Sand, Emerald, Saffron, Noor, Tawheed
- 4 languages: English, Deutsch, Français, Shqip
- Drag-reorder dhikrs (touch + mouse)
- Google OAuth login
- PWA support (installable)
- Offline-first sync — counts persist locally, sync to server when online
- Settings (theme, language) synced to your account across devices

## Requirements

- PHP 8.3+
- Composer
- Node.js 20.19+ or 22.12+ (required by Vite 7)
- MySQL or SQLite

## Setup

```bash
# Clone & enter project
git clone https://github.com/UranikSejdiu/Dhiker.git dhikr-counter
cd dhikr-counter

# Install PHP dependencies
composer install

# Install JS dependencies
npm ci

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

- **Framework**: Laravel 11 (PHP 8.3+)
- **Frontend**: Vue 3 (Composition API) + Inertia.js + Vite
- **UI**: shadcn-vue (Reka UI) — Button, Dialog, Sheet, DropdownMenu
- **Drag Reorder**: vue-draggable-plus (SortableJS)
- **CSS**: Tailwind CSS 3 + tailwindcss-animate
- **Auth**: Laravel Breeze + Socialite (Google OAuth)
- **PWA**: Service worker + manifest.json

## Project Structure

```
app/
  Http/Controllers/
    DhikrController.php      # CRUD, increment, reset, reorder, sync
    SettingsController.php   # Theme/language save to user record
    Auth/SocialiteController.php
  Models/
    Dhikr.php                # name, counts, daily_limit, sort_order
    User.php                 # display_name, provider, theme, language
  Policies/
    DhikrPolicy.php
resources/
  js/
    Pages/Dashboard.vue      # Counter UI, shadcn Sheets + Dialogs
    composables/
      useSync.js             # Offline-first sync (2s debounce, sendBeacon)
      useOrder.js            # Drag reorder (localStorage + server sync)
      useTheme.js            # 6 themes, CSS vars, localStorage + DB
      useLanguage.js         # 4 languages, browser detect, localStorage + DB
    Components/
      Fireworks.vue          # Particle burst on daily goal reached
      FlagIcon.vue
    Components/ui/           # shadcn-vue (Button, Dialog, Sheet, DropdownMenu)
routes/
  web.php                    # All app routes
```

## Build behavior and checks

`npm run build` runs `bump-version.js` before Vite. It updates the app version in
`package.json`, `resources/js/constants/version.js`, and `public/manifest.json`.
For a frontend compilation without that version bump, use `npx vite build` after
installing dependencies. PHP tests are available with `composer test` after the
application and test environment are configured.

## License and usage

The author's original work is **free for noncommercial use, learning,
modification, and free noncommercial sharing** under the
[Uranik Noncommercial License 1.0](LICENSE.md). Resale, paid products, paid client
work, and monetized services require prior written permission. Keep author credit
and the applicable license notices.

See [USAGE.md](USAGE.md) for examples and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependency and prior-license
information. Laravel, Vue, and other third-party material retain their own
licenses. Earlier valid MIT permissions are not revoked by this change.

This is the Laravel/Vue web application. The independent Expo/Android Dhikr app
is maintained in [Personal-Hub/apps/dhikr](https://github.com/UranikSejdiu/Personal-Hub/tree/main/apps/dhikr).

Author: [Uranik Sejdiu](https://github.com/UranikSejdiu). Request commercial
permission through this repository's issue tracker or the profile's contact options.
