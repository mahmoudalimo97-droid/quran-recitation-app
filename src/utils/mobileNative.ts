import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export async function initMobileNative() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Configure status bar so it doesn't overlay content
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (e) {
    console.warn('StatusBar init warning:', e);
  }

  try {
    // Hide splash screen smoothly with slight fade
    await SplashScreen.hide({
      fadeOutDuration: 400,
    });
  } catch (e) {
    console.warn('SplashScreen hide warning:', e);
  }
}

export async function updateStatusBarTheme(isDarkMode: boolean) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (isDarkMode) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#121212' });
    } else {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#faf9f5' });
    }
  } catch (e) {
    console.warn('StatusBar theme update warning:', e);
  }
}
