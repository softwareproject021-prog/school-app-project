import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The app opens the live Campus1Cloud site inside a native Android shell.
 * Same address as the website, so sign-in cookies, the /api proxy and every
 * website update work in the app straight away, with no new Play Store release.
 * Override for testing: CAP_SERVER_URL=https://staging.example.com npx cap sync android
 */
const url = process.env.CAP_SERVER_URL || 'https://www.campus1cloud.com';

const config: CapacitorConfig = {
  appId: 'com.campus1cloud.app',
  appName: 'Campus1Cloud',
  webDir: 'www',
  backgroundColor: '#1e5fc6',
  server: { url, cleartext: false, errorPath: 'offline.html', androidScheme: 'https' },
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, launchAutoHide: true, backgroundColor: '#ffffff', androidScaleType: 'CENTER_INSIDE', showSpinner: false },
    StatusBar: { style: 'DARK', backgroundColor: '#1d3160', overlaysWebView: false },
  },
};
export default config;
