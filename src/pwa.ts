import { Workbox } from 'workbox-window';

declare const __APP_BUILD__: string;

// PWA Registration: kept apart from the game rules.
// Imported statically so the whole app ships in one bundle (no lazy chunks).
// A waiting update is never applied from here (no skipWaiting, no reload), so a game is never
// interrupted; the new version loads after all old pages are closed.
export function initPwa(): void {
  document.documentElement.dataset.build = __APP_BUILD__;
  // The dev server has no service worker; offline is tested on the production build only.
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
    return;
  }
  const base = import.meta.env.BASE_URL;
  // Failure only means no offline support; the online game keeps working.
  new Workbox(`${base}sw.js`, { scope: base }).register().catch(() => {});
}
