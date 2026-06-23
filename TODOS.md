# Dhikr Counter Laravel — Status

## Done
- Laravel 13 + Breeze Vue + Socialite scaffolded
- DB migrations: users (`display_name`, `provider`, `theme`, `language`), dhikrs table
- Models: User, Dhikr; Controller: DhikrController (CRUD + increment + resetDaily)
- Routes: dashboard, dhikrs CRUD, Google auth, logout
- Login.vue: dark gold theme, email/password + Google button, fade-in animations
- Dashboard.vue: one-counter-at-a-time, massive 160px number, nav arrows, toolbar (reset/dhikrs/settings), bottom sheet panels, add/edit modal, confirm dialog, fireworks overlay
- Fireworks.vue: particle burst animation
- **Counter is purely local** — taps update local refs, server POST is fire-and-forget. `loadLocal()` runs only on `selectedId` change.
- **Flaticon Uicons CDN** (regular-rounded + solid-rounded) in `app.blade.php`
- **`composables/useLanguage.js`** — 4 languages (en/de/fr/sq), browser detect, localStorage
- **`composables/useTheme.js`** — 5 themes (dark-gold/pure-light/emerald/midnight/amoled), CSS vars, localStorage
- Login.vue + Dashboard.vue: all strings → `t()`, all unicode icons → `<i class="fi fi-*">`, all colors → theme `colors` reactive
- Builds clean with `npm run build`

## Done (Session 4)
1. Dhikr reordering — drag handles, localStorage offline-first, DB sync

## Remaining
- Run `php artisan migrate` when MySQL is available (adds `sort_order` column)
- Deploy and test on live server

## Key Context
- **New app**: `C:\laragon\www\dhikr-counter-laravel` (all work here)
- **Old app (UI ref)**: `C:\laragon\www\dhikr-counter`
- **DB**: MySQL `dhikr_counter`, already migrated
- **Routes**: `/` → login, `/dashboard` (auth), `/dhikrs` CRUD, `/auth/google` OAuth
- **Layout**: `resources/views/app.blade.php`
- **Theme/lang composables**: `resources/js/composables/useLanguage.js`, `useTheme.js`
- **Counter logic**: local refs (`localTotal`, `localDaily`) — tap updates + fire-and-forget POST. Reset zeros local then POSTs. Dhikr switch triggers `loadLocal()` from server data.
- **Relevant old app files**: `src/lib/translations.ts`, `src/lib/theme.ts`, `src/lib/language-context.tsx`, `src/lib/theme-context.tsx` (all ported)
