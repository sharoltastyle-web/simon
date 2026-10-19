import type { GameController } from './controller.ts';
import type { Screen } from './navigation.ts';

export const isPageVisible = (): boolean => document.visibilityState === 'visible';

// Lifecycle Adapter: pauses the game whenever it cannot be played and resumes it
// only when the home screen is active and the page is visible.
// Returns a sync function to call whenever the active screen changes.
export function initLifecycle(
  controller: Pick<GameController, 'pause' | 'resumeIfPossible'>,
  getScreen: () => Screen,
): () => void {
  const sync = (): void => {
    if (isPageVisible() && getScreen() === 'home') {
      controller.resumeIfPossible();
    } else {
      controller.pause();
    }
  };
  document.addEventListener('visibilitychange', sync);
  // Timers are already cancelled on pause, so a back/forward cache restore starts a fresh replay.
  window.addEventListener('pagehide', () => controller.pause());
  window.addEventListener('pageshow', sync);
  return sync;
}
