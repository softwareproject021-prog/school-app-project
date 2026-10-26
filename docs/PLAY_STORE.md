# Publishing Campus1Cloud on the Google Play Store

## 1. One-time setup
1. Create a Google Play developer account at https://play.google.com/console (one-time fee, about US$25).
   If it is a **personal** account created recently, Google requires a **closed test with at least 12 testers for 14 days** before you can publish to production. Organisation accounts do not have this rule.
2. Create the app in Play Console: name **Campus1Cloud**, default language English (India), App, Free.
3. Package name is **com.campus1cloud.app** (set in `capacitor.config.ts` and `android/app/build.gradle`). It cannot be changed after the first upload.

## 2. Create the upload key (once, on your computer)
```
keytool -genkeypair -v -keystore upload.jks -alias campus1cloud -keyalg RSA -keysize 2048 -validity 10000
```
Keep `upload.jks` and its passwords safe (a password manager). Never commit them. Turn on **Play App Signing** when Play Console asks; Google then keeps the real signing key and you only need this upload key.

Add four GitHub secrets (repo → Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | output of `base64 -w0 upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
| `ANDROID_KEY_ALIAS` | `campus1cloud` |
| `ANDROID_KEY_PASSWORD` | the key password |

## 3. Build the file you upload
- Test build: every push to `main` builds `app-debug.apk` (Actions → latest run → Artifacts). Install it on a phone to check.
- Store build: push a tag, e.g. `git tag v1.0.0 && git push origin v1.0.0`, or run the workflow by hand with "release" ticked. Download **campus1cloud-release-aab** (`app-release.aab`).
- Upload the `.aab` in Play Console → Testing → Closed testing (or Production) → Create release.
- Every new upload needs a higher version code; the workflow uses the run number automatically.

## 4. Store listing and forms Play will ask for
- **Privacy policy URL** (required). The app handles students' names, phone numbers, attendance and fees, so the policy must say what is collected, who sees it (the school), how it is protected and how to ask for deletion. Host it on https://www.campus1cloud.com/privacy.
- **Data safety form:** collects personal info (name, email, phone), app activity; data is encrypted in transit; users can request deletion through their school.
- **Content rating:** answer the questionnaire (no violence, no user-to-user chat with strangers).
- **Target audience:** adults (principals, teachers, parents). Do not choose "under 13" as the target; that triggers the Families policy.
- **App access:** Play reviewers need to sign in. Give them a demo principal login in the "App access" section (a real invite-created account on a demo school, not a production school).
- Graphics: 512×512 icon (`docs/store/icon-512.png` is provided), 1024×500 feature graphic, at least 2 phone screenshots.

## 5. How the app works (and a policy warning)
The app is a native Android shell that opens https://www.campus1cloud.com. Website updates reach the app immediately, with no new release, and sign-in cookies work because it is the same address as the website.
Google can reject apps that are only a website in a frame ("minimum functionality" policy). To pass review, keep the native parts (splash, icon, offline screen, status bar) and plan to add native features, for example push notifications for attendance alerts (needs a small backend addition), then mention them in the store description.

## 6. Local development
```
npm install
npx cap sync android
npx cap open android      # opens Android Studio
```
Test against another server: `CAP_SERVER_URL=https://your-preview.vercel.app npx cap sync android`.
Regenerate icons and splash after changing the logo: `python3 tools/make_icons.py`.
`frontend/` is a copy of the web app source, kept here for reference; the app itself loads the live site.
