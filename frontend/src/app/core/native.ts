import { Capacitor } from '@capacitor/core';

/** True inside the installed Android app, false in a normal browser. */
export const isNative = (): boolean => { try { return Capacitor.isNativePlatform(); } catch { return false; } };

/** The app is bundled on the phone, so API calls go to the live server. In a browser they stay relative (/api). */
export const API_BASE = isNative() ? 'https://www.campus1cloud.com' : '';
