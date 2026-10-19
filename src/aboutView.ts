import type { Scores } from './scoreStorage.ts';

const NO_GAME_YET = 'טרם שוחק משחק';

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element;
}

export function createAboutView(): { renderScores(scores: Scores): void } {
  const best = requireElement('best-score');
  const last = requireElement('last-score');
  // null means "no game yet"; 0 is a real result and is shown as a number.
  const format = (value: number | null): string => (value === null ? NO_GAME_YET : String(value));

  return {
    renderScores(scores) {
      best.textContent = format(scores.bestScore);
      last.textContent = format(scores.lastScore);
    },
  };
}
