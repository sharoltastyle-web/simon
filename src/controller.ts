import type { AudioPort } from './audio.ts';
import { advanceStage, checkInput, newSession, type Color, type RandomSource, type Session } from './engine.ts';
import type { HomeView } from './homeView.ts';

// Presentation timing (ARCHITECTURE §3); tunable constants, not a user setting.
export const LIGHT_MS = 500;
export const GAP_MS = 200;
export const STAGE_PAUSE_MS = 500;
export const RESPONSE_MS = 5000;
export const PRESS_FEEDBACK_MS = 250;

export const MESSAGES = {
  watch: 'צפו ברצף',
  yourTurn: 'תורכם',
  wrong: (score: number) => `טעות! התוצאה: ${score}`,
  timeout: (score: number) => `נגמר הזמן! התוצאה: ${score}`,
  win: 'ניצחתם! השלמתם את כל 10 השלבים',
  audioFailed: 'לא ניתן להשמיע צלילים. אפשר להמשיך לשחק לפי האורות.',
} as const;

export type Phase = 'idle' | 'presenting' | 'awaitingInput' | 'finished';
export type Outcome = 'win' | 'wrongColor' | 'timeout';

type TimerHandle = ReturnType<typeof setTimeout>;

export interface ControllerDeps {
  view: HomeView;
  audio: AudioPort;
  now?: () => number;
  random?: RandomSource;
  setTimer?: (callback: () => void, ms: number) => TimerHandle;
  clearTimer?: (handle: TimerHandle) => void;
}

export interface GameState {
  phase: Phase;
  session: Session | null;
  outcome: Outcome | null;
}

export interface GameController {
  start(): void;
  press(color: Color): void;
  getState(): GameState;
}

export function createController(deps: ControllerDeps): GameController {
  const { view, audio } = deps;
  const now = deps.now ?? (() => performance.now());
  const random = deps.random ?? Math.random;
  const setTimer = deps.setTimer ?? ((callback, ms) => setTimeout(callback, ms));
  const clearTimer = deps.clearTimer ?? ((handle) => clearTimeout(handle));

  let phase: Phase = 'idle';
  let session: Session | null = null;
  let outcome: Outcome | null = null;
  let deadline = Infinity;
  let deadlineTimer: TimerHandle | null = null;
  let runId = 0;
  let audioFailed = false;
  let firstPresentation = true;
  const timers = new Set<TimerHandle>();
  const feedbackTimers = new Map<Color, TimerHandle>();

  // Schedules a callback that is ignored if the run it belongs to was cancelled.
  function schedule(callback: () => void, ms: number): TimerHandle {
    const run = runId;
    const handle = setTimer(() => {
      timers.delete(handle);
      if (run === runId) {
        callback();
      }
    }, ms);
    timers.add(handle);
    return handle;
  }

  function cancelAll(): void {
    for (const handle of timers) {
      clearTimer(handle);
    }
    timers.clear();
    feedbackTimers.clear();
    deadlineTimer = null;
    deadline = Infinity;
    audio.stopAll();
    view.clearLights();
  }

  function cancelDeadline(): void {
    if (deadlineTimer !== null) {
      clearTimer(deadlineTimer);
      timers.delete(deadlineTimer);
      deadlineTimer = null;
    }
    deadline = Infinity;
  }

  function armDeadline(): void {
    cancelDeadline();
    deadline = now() + RESPONSE_MS;
    // The timer only wakes the check; the deadline value is the source of truth.
    deadlineTimer = schedule(() => {
      deadlineTimer = null;
      if (phase === 'awaitingInput') {
        finish('timeout');
      }
    }, RESPONSE_MS);
  }

  function present(): void {
    if (!session) {
      return;
    }
    phase = 'presenting';
    runId += 1;
    view.setMessage(firstPresentation && audioFailed ? MESSAGES.audioFailed : MESSAGES.watch);
    firstPresentation = false;
    const sequence = session.sequence;
    const showAt = (index: number): void => {
      const color = sequence[index];
      view.setLit(color, true);
      audio.playTone(color, LIGHT_MS);
      schedule(() => {
        view.setLit(color, false);
        if (index + 1 < sequence.length) {
          schedule(() => showAt(index + 1), GAP_MS);
        } else {
          phase = 'awaitingInput';
          view.setMessage(MESSAGES.yourTurn);
          armDeadline();
        }
      }, LIGHT_MS);
    };
    showAt(0);
  }

  function finish(result: Outcome, pressed?: Color): void {
    if (phase === 'finished' || phase === 'idle' || !session) {
      return;
    }
    const score = session.completedStages;
    cancelDeadline();
    // Keep the final press feedback visible and audible, then drop every other timer.
    for (const handle of timers) {
      clearTimer(handle);
    }
    timers.clear();
    feedbackTimers.clear();
    view.clearLights();
    phase = 'finished';
    outcome = result;
    if (pressed) {
      view.setLit(pressed, true);
      schedule(() => view.setLit(pressed, false), PRESS_FEEDBACK_MS);
    }
    view.setScore(score);
    view.setMessage(
      result === 'win' ? MESSAGES.win : result === 'wrongColor' ? MESSAGES.wrong(score) : MESSAGES.timeout(score),
    );
    view.setStartEnabled(true);
  }

  function showPressFeedback(color: Color): void {
    const previous = feedbackTimers.get(color);
    if (previous !== undefined) {
      clearTimer(previous);
      timers.delete(previous);
    }
    view.setLit(color, true);
    audio.playTone(color, PRESS_FEEDBACK_MS);
    const handle = schedule(() => {
      feedbackTimers.delete(color);
      view.setLit(color, false);
    }, PRESS_FEEDBACK_MS);
    feedbackTimers.set(color, handle);
  }

  return {
    start(): void {
      if (phase === 'presenting' || phase === 'awaitingInput') {
        return;
      }
      runId += 1;
      cancelAll();
      phase = 'presenting';
      outcome = null;
      firstPresentation = true;
      session = newSession(random);
      view.setStartEnabled(false);
      view.setStage(session.sequence.length);
      view.setScore(0);
      view.setMessage('');
      const run = runId;
      // prepare() starts audio inside this click; presentation waits only briefly for it.
      void audio.prepare().then(
        (ok) => {
          audioFailed = !ok;
          if (run === runId) {
            present();
          }
        },
        () => {
          audioFailed = true;
          if (run === runId) {
            present();
          }
        },
      );
    },

    press(color: Color): void {
      if (phase !== 'awaitingInput' || !session) {
        return;
      }
      // A press at or after the deadline is not a valid answer.
      if (now() >= deadline) {
        finish('timeout');
        return;
      }
      const checked = checkInput(session, color);
      session = checked.session;
      switch (checked.result) {
        case 'correct':
          showPressFeedback(color);
          armDeadline();
          break;
        case 'stageComplete':
          cancelDeadline();
          showPressFeedback(color);
          phase = 'presenting';
          view.setScore(session.completedStages);
          schedule(() => {
            if (!session) {
              return;
            }
            session = advanceStage(session, random);
            view.setStage(session.sequence.length);
            present();
          }, STAGE_PAUSE_MS);
          break;
        case 'win':
          audio.playTone(color, PRESS_FEEDBACK_MS);
          finish('win', color);
          break;
        case 'wrong':
          audio.playTone(color, PRESS_FEEDBACK_MS);
          finish('wrongColor', color);
          break;
      }
    },

    getState(): GameState {
      return { phase, session, outcome };
    },
  };
}
