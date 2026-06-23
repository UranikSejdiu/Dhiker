# Dhikr Counter Laravel — Status

## Found Issues
- Fix mojibake / encoding artifacts in localized UI copy and labels so French, German, Albanian, and the Arabic login line render correctly across the app.
- Remove the production `console.log` noise from the service worker registration script in `resources/views/app.blade.php`.
- Audit the remaining theme-aware screens for any hardcoded colors that still bypass the shared theme tokens.

## Done
- shadcn-vue components (Button, Dialog, Sheet, DropdownMenu)
- SortableJS drag reorder via vue-draggable-plus (touch + mouse)
- CSS variable theming for both inline styles and shadcn components
- Dhikr reordering - drag handles, localStorage offline-first, DB sync
- Run `php artisan migrate` when MySQL is available (adds `sort_order` column)
- Deploy and test on live server
- Convert `Login.vue` to use shadcn components
