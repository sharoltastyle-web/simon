import { COLORS, type Color } from './engine.ts';

export interface HomeView {
  setStage(stage: number): void;
  setScore(score: number): void;
  setMessage(text: string): void;
  setLit(color: Color, lit: boolean): void;
  clearLights(): void;
  setStartEnabled(enabled: boolean): void;
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element as T;
}

export function createHomeView(): HomeView {
  const stage = requireElement('stage-value');
  const score = requireElement('score-value');
  const message = requireElement('message');
  const start = requireElement<HTMLButtonElement>('start-button');
  const pads = new Map<Color, HTMLElement>();
  for (const color of COLORS) {
    const pad = document.querySelector<HTMLElement>(`.pad[data-color="${color}"]`);
    if (!pad) {
      throw new Error(`Missing pad: ${color}`);
    }
    pads.set(color, pad);
  }

  return {
    setStage: (value) => {
      stage.textContent = String(value);
    },
    setScore: (value) => {
      score.textContent = String(value);
    },
    setMessage: (text) => {
      message.textContent = text;
    },
    setLit: (color, lit) => {
      pads.get(color)?.classList.toggle('is-active', lit);
    },
    clearLights: () => {
      for (const pad of pads.values()) {
        pad.classList.remove('is-active');
      }
    },
    setStartEnabled: (enabled) => {
      start.disabled = !enabled;
    },
  };
}

// One click listener per control: covers touch, mouse and keyboard without duplicates.
export function bindHomeInput(onStart: () => void, onPress: (color: Color) => void): void {
  requireElement<HTMLButtonElement>('start-button').addEventListener('click', onStart);
  for (const color of COLORS) {
    document
      .querySelector<HTMLElement>(`.pad[data-color="${color}"]`)
      ?.addEventListener('click', () => onPress(color));
  }
}
