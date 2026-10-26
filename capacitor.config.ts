import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The app is bundled on the phone (frontend/ is built into the app) and talks to the live backend at
 * https://www.campus1cloud.com/api. Native HTTP is switched on so the secure refresh cookie works
 * from inside the app, which is a different origin from the website.
 */
const config: CapacitorConfig = {
  appId: 'com.campus1cloud.app',
  appName: 'Campus1Cloud',
  webDir: 'frontend/dist/school-project/browser',
  backgroundColor: '#1e5fc6',
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
  plugins: {
    CapacitorHttp: { enabled: true },
    CapacitorCookies: { enabled: true },
    SystemBars: { insetsHandling: 'css' },
    SplashScreen: { launchShowDuration: 1200, launchAutoHide: true, backgroundColor: '#ffffff', androidScaleType: 'CENTER_INSIDE', showSpinner: false },
    StatusBar: { style: 'DARK', backgroundColor: '#1d3160', overlaysWebView: false },
  },
};
export default config;
