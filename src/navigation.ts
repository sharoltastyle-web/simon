export type Screen = 'home' | 'about';

const SCREEN_TITLES: Record<Screen, string> = {
  home: 'סיימון',
  about: 'אודות — סיימון',
};

// Maps a location hash to a screen; anything unknown falls back to home.
export function parseRoute(hash: string): Screen {
  return hash === '#/about' ? 'about' : 'home';
}

function getScreenElement(screen: Screen): HTMLElement {
  const element = document.getElementById(`screen-${screen}`);
  if (!element) {
    throw new Error(`Missing screen element: ${screen}`);
  }
  return element;
}

export function showScreen(screen: Screen): void {
  const screens: Screen[] = ['home', 'about'];
  for (const candidate of screens) {
    getScreenElement(candidate).hidden = candidate !== screen;
  }
  document.title = SCREEN_TITLES[screen];
  window.scrollTo(0, 0);
}

export function currentScreen(): Screen {
  return parseRoute(window.location.hash);
}

export function initNavigation(onScreenChange?: (screen: Screen) => void): void {
  const render = (): void => {
    const screen = currentScreen();
    showScreen(screen);
    onScreenChange?.(screen);
  };
  window.addEventListener('hashchange', render);
  render();
}
