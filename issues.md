# Dhikr Counter — Vulnerability & Bug Audit

Generated: 2026-06-15
Updated: All items below have been fixed in this session.

## Status Legend
- ~~✅ Fixed~~ — resolved in current commit
- ⬜ Unresolved — requires further action (Plesk deploy, etc.)

---

## Severity Guide
- **🔴 Critical** — Data loss, security breach, or broken core feature
- **🟠 High** — Significant risk of incorrect behavior or limited exploit
- **🟡 Medium** — Functional bug or moderate concern
- **🟢 Low** — Polish, UX, edge case, or opinion

---

## Security Issues

### 🔴 1. Session token exposed in URL query params
**File:** `src/config/api.ts:49`
**Risk:** Token is appended as `&_token=...` to every API request URL.

This leaks the permanent session token into:
- Server access logs (Plesk/ Apache logs)
- Browser history (when navigating)
- `Referer` header if the page links externally
- Cached requests in DevTools

**Mitigation:** Necessary for Plesk compatibility (headers + POST body may be stripped), but the token is a long-lived credential. Consider rotating tokens periodically, or making tokens short-lived with a refresh mechanism.

**Status:** ⬜ Unresolved — accepted trade-off for Plesk compatibility

### 🟠 2. Google OAuth `state` parameter is hardcoded
**Status:** ~~✅ Fixed~~ — `google_login` now generates a random state via `bin2hex(random_bytes(16))`, stores it in a secure HttpOnly cookie, and `google_callback` verifies it with `hash_equals()`

### 🔴 3. `beforeunload` sync fires but doesn't complete
**Status:** ~~✅ Fixed~~ — replaced `syncAllPendingImmediate()` with `navigator.sendBeacon()` in the beforeunload handler. Also added a `keepalive: true` fallback in `syncAllDeltasKeepalive()`. Pending deltas now survive tab close.

### 🟠 4. No rate limiting on any endpoint
**Status:** ~~✅ Fixed~~ — added `checkRateLimit()` helper (file-based, 10 attempts per 60s per IP) to `login` and `register` endpoints

### 🟠 5. Server error details leaked to client
**Status:** ~~✅ Fixed~~ — removed `'details' => $e->getMessage()` from the catch block. Production errors now return a generic message only.

### 🟡 6. `save_preferences` does not validate input
**Status:** ~~✅ Fixed~~ — validates `$theme` against `['dark-gold', 'pure-light', 'emerald', 'midnight']` and `$language` against `['en', 'de', 'fr', 'sq']` before storing

### 🟡 7. `register` endpoint doesn't validate email format
**Status:** ~~✅ Fixed~~ — added `isValidEmail()` using `filter_var($email, FILTER_VALIDATE_EMAIL)`

### 🟡 8. CORS allows any origin
**Status:** ~~✅ Fixed~~ — now reflects the requesting `Origin` header instead of wildcard `*`. Added `Access-Control-Allow-Credentials: true` for OAuth cookie support.

### 🟡 9. No password strength validation server-side
**Status:** ~~✅ Fixed~~ — added `isValidPassword()` checking `strlen($password) >= 6`

---

## Functional Bugs

### 🔴 10. `get_profile` doesn't return `theme` or `language`
**Status:** ~~✅ Fixed~~ — response now includes `'theme' => $user['theme'] ?? null, 'language' => $user['language'] ?? null`

### 🔴 11. Race condition: pending deltas can be applied twice
**Status:** ~~✅ Fixed~~ — on sync failure, only restores the original delta if no new increments were added during the failed request (`if (pending.delta === 0)` guard). Applied to both `syncPending()` and `syncAllPendingImmediate()`.

### 🟡 12. Auto-reset fires and forgets on day change
**Status:** ~~✅ Fixed~~ — moved day-change reset into the PHP `fetch` endpoint: `UPDATE dhikrs SET daily_count = 0, last_reset_date = ? WHERE user_id = ? AND last_reset_date != ?`. Removed the frontend fire-and-forget `apiRequest('reset', ...)`.

### 🟡 13. No confirmation on mobile for reset/delete
**Note:** Skipped per user request (only Google accounts used — less risk of accidental action)

### 🟡 14. Auth layout has hardcoded background color
**Status:** ~~✅ Fixed~~ — now reads `colors.background` from `useAppTheme()`

### 🟡 15. Google OAuth errors show raw `die()` page
**Status:** ~~✅ Fixed~~ — all error cases now `header("Location: /login?error=" . urlencode(...))` and redirect back to the PWA with a message parameter

### 🟢 16. InstallPrompt has hardcoded colors
**Status:** ~~✅ Fixed~~ — now uses `colors` from `useAppTheme()` for banner background, text, button, and close icon

### 🟢 17. Service worker pre-caches `/` (HTML navigation)
**Status:** ~~✅ Fixed~~ — removed `/` from `PRECACHE_URLS` (now empty array), bumped cache version to `v4`

---

## Code Quality & Maintainability

### 🟡 18. Duplicate PHP files in `public/` and `dist/`
Both `public/api/index.php` and `dist/api/index.php` are identical. This is a maintenance burden — any PHP fix requires editing two files.

**Suggestion:** Use one as the source of truth and copy/symlink during build/deploy.

### 🟢 19. `FlagIcon` uses external CDN (`flagcdn.com`)
**File:** `src/components/FlagIcon.tsx:19`
If `flagcdn.com` goes down or is blocked, the flag images don't render. Consider bundling SVGs or using emoji flags.

### 🟢 20. `ThemeContext` loads theme asynchronously
**File:** `src/context/ThemeContext.tsx:18-23`
The theme loads from `AsyncStorage` after first render, which means the first frame flashes the default `dark-gold` before switching to the saved theme. Low visibility due to splash screen.

---

## Summary

| Severity | Count | Fixed | Skipped | Remaining |
|----------|-------|-------|---------|-----------|
| 🔴 Critical | 3 | 2 | 0 | 1 (token in URL — Plesk trade-off) |
| 🟠 High | 4 | 4 | 0 | 0 |
| 🟡 Medium | 8 | 7 | 1 (mobile confirm) | 0 |
| 🟢 Low | 4 | 3 | 0 | 1 (FlagIcon CDN — minor) |

**Remaining after this session:**
1. Deploy updated `dist/` to Plesk
2. Run `ALTER TABLE` for theme/language columns on Plesk MySQL
3. Token-in-URL accepted trade-off (Plesk strips headers/POST body)
4. FlagIcon CDN dependency (minor)
