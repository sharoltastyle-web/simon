import type { Color } from './engine.ts';

export interface AudioPort {
  // Prepares audio from a user gesture. Resolves to false when sound cannot play.
  prepare(): Promise<boolean>;
  playTone(color: Color, durationMs: number): void;
  stopAll(): void;
}

const FREQUENCIES: Record<Color, number> = {
  blue: 261.63,
  red: 329.63,
  yellow: 392.0,
  green: 523.25,
};

const VOLUME = 0.2;
const RAMP_SECONDS = 0.015;
const RESUME_WAIT_MS = 300;

type AudioContextConstructor = typeof AudioContext;

export function createWebAudio(): AudioPort {
  let context: AudioContext | null = null;
  let available = false;
  const active = new Set<OscillatorNode>();

  const getConstructor = (): AudioContextConstructor | undefined =>
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;

  return {
    async prepare(): Promise<boolean> {
      try {
        if (!context) {
          const Ctor = getConstructor();
          if (!Ctor) {
            available = false;
            return false;
          }
          context = new Ctor();
        }
        if (context.state !== 'running') {
          // resume() must start inside the gesture; do not wait for it forever.
          const resumed = context.resume().catch(() => undefined);
          await Promise.race([resumed, new Promise((resolve) => setTimeout(resolve, RESUME_WAIT_MS))]);
        }
        available = context.state === 'running';
      } catch {
        available = false;
      }
      return available;
    },

    playTone(color: Color, durationMs: number): void {
      if (!context || !available) {
        return;
      }
      try {
        const start = context.currentTime;
        const end = start + durationMs / 1000;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = FREQUENCIES[color];
        // Short attack and release avoid audible clicks.
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(VOLUME, start + RAMP_SECONDS);
        gain.gain.setValueAtTime(VOLUME, Math.max(start + RAMP_SECONDS, end - RAMP_SECONDS));
        gain.gain.linearRampToValueAtTime(0, end);
        oscillator.connect(gain).connect(context.destination);
        oscillator.onended = () => {
          active.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        active.add(oscillator);
        oscillator.start(start);
        oscillator.stop(end);
      } catch {
        // A failed tone must never break the game.
      }
    },

    stopAll(): void {
      for (const oscillator of active) {
        try {
          oscillator.stop();
          oscillator.disconnect();
        } catch {
          // Already stopped.
        }
      }
      active.clear();
    },
  };
}
