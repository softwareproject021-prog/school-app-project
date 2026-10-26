# Campus1Cloud Android app

Native Android app (Capacitor 8, target SDK 36) with its own phone layout (bottom tab bar, grouped More menu, card lists). The UI in `frontend/` is bundled in the app and talks to the live backend; the website is unaffected. Parents, teachers and principals sign in with the same account as the website; the backend (Render) and frontend (Vercel) are unchanged.

| | |
|---|---|
| App id | `com.campus1cloud.app` |
| Backend | `https://www.campus1cloud.com/api` (`frontend/src/app/core/native.ts`) |
| Offline | red "You are offline" strip in the app |
| Look | launcher icon + splash from the Campus1Cloud logo, status bar in brand blue, safe-area aware (notches, gesture bar) |
| Build | GitHub Actions (`.github/workflows/android.yml`): test APK on every push, signed `.aab` on a `v*` tag |

**Publishing steps are in [docs/PLAY_STORE.md](docs/PLAY_STORE.md).**

```
npm install
cd frontend && npm install && npm run build && cd ..
npx cap sync android
npx cap open android
```

Layout: `android/` native project · `frontend/` Angular app UI (the part you edit for screens) · `tools/make_icons.py` icon generator · `docs/store/` Play Store graphics.
