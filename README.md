# Campus1Cloud Android app

Native Android app (Capacitor 8, target SDK 36) for https://www.campus1cloud.com. Parents, teachers and principals sign in with the same account as the website; the backend (Render) and frontend (Vercel) are unchanged.

| | |
|---|---|
| App id | `com.campus1cloud.app` |
| Opens | `https://www.campus1cloud.com` (change in `capacitor.config.ts`) |
| Offline | friendly "You are offline" screen with Try again (`www/offline.html`) |
| Look | launcher icon + splash from the Campus1Cloud logo, status bar in brand blue, safe-area aware (notches, gesture bar) |
| Build | GitHub Actions (`.github/workflows/android.yml`): test APK on every push, signed `.aab` on a `v*` tag |

**Publishing steps are in [docs/PLAY_STORE.md](docs/PLAY_STORE.md).**

```
npm install
npx cap sync android
npx cap open android
```

Layout: `android/` native project · `www/` offline and loading screens · `frontend/` web app source (reference copy) · `tools/make_icons.py` icon generator · `docs/store/` Play Store graphics.
