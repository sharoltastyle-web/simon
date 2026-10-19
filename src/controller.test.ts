import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AudioPort } from './audio.ts';
import {
  createController,
  GAP_MS,
  LIGHT_MS,
  MESSAGES,
  RESPONSE_MS,
  STAGE_PAUSE_MS,
  type GameController,
} from './controller.ts';
import type { Color } from './engine.ts';
import type { HomeView } from './homeView.ts';

function fakeView() {
  const state = {
    stage: 0,
    score: 0,
    message: '',
    startEnabled: true,
    lit: new Set<Color>(),
    lightOns: [] as Color[],
  };
  const view: HomeView = {
    setStage: (v) => (state.stage = v),
    setScore: (v) => (state.score = v),
    setMessage: (t) => (state.message = t),
    setLit: (c, lit) => {
      if (lit) {
        state.lit.add(c);
        state.lightOns.push(c);
      } else {
        state.lit.delete(c);
      }
    },
    clearLights: () => state.lit.clear(),
    setStartEnabled: (e) => (state.startEnabled = e),
  };
  return { view, state };
}

function fakeAudio(ok = true) {
  const tones: Color[] = [];
  const audio: AudioPort = {
    prepare: vi.fn(async () => ok),
    playTone: (c) => tones.push(c),
    stopAll: vi.fn(),
  };
  return { audio, tones };
}

const presentationMs = (length: number) => length * LIGHT_MS + (length - 1) * GAP_MS;

async function flush(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

async function advance(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

function setup(options: { random?: () => number; audioOk?: boolean } = {}) {
  const { view, state } = fakeView();
  const { audio, tones } = fakeAudio(options.audioOk ?? true);
  const controller = createController({
    view,
    audio,
    now: () => Date.now(),
    random: options.random ?? (() => 0.1), // always blue unless overridden
  });
  return { controller, state, audio, tones };
}

const sequenceOf = (c: GameController) => [...(c.getState().session?.sequence ?? [])];

// Starts a game and waits until it is the player's turn in stage 1.
async function startAndWait(controller: GameController): Promise<void> {
  controller.start();
  await flush();
  await advance(presentationMs(1));
}

async function playCurrentStage(controller: GameController): Promise<void> {
  for (const color of sequenceOf(controller)) {
    controller.press(color);
  }
}

async function completeStageAndWait(controller: GameController): Promise<void> {
  await playCurrentStage(controller);
  await advance(STAGE_PAUSE_MS);
  await advance(presentationMs(sequenceOf(controller).length));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('controller', () => {
  it('start creates a single game; repeated presses do not restart it', async () => {
    let calls = 0;
    const { controller, state } = setup({ random: () => (calls++ % 4) / 4 + 0.1 });
    controller.start();
    controller.start();
    await flush();
    controller.start();
    expect(calls).toBe(1);
    expect(sequenceOf(controller)).toHaveLength(1);
    expect(state.startEnabled).toBe(false);
    expect(state.stage).toBe(1);
    expect(state.message).toBe(MESSAGES.watch);
  });

  it('presents with light and tone, then hands the turn to the player', async () => {
    const { controller, state, tones } = setup();
    controller.start();
    await flush();
    expect(state.lit.has('blue')).toBe(true);
    expect(tones).toEqual(['blue']);
    await advance(LIGHT_MS);
    expect(state.lit.size).toBe(0);
    expect(controller.getState().phase).toBe('awaitingInput');
    expect(state.message).toBe(MESSAGES.yourTurn);
  });

  it('separates two back-to-back appearances of the same color with an off gap', async () => {
    const { controller, state } = setup(); // always blue
    await startAndWait(controller);
    controller.press('blue');
    await advance(STAGE_PAUSE_MS);
    const onsBefore = state.lightOns.length;
    await advance(LIGHT_MS);
    expect(state.lit.has('blue')).toBe(false); // off between the two blues
    await advance(GAP_MS);
    expect(state.lit.has('blue')).toBe(true);
    expect(state.lightOns.length).toBe(onsBefore + 1);
  });

  it('ignores presses during presentation and does not store them', async () => {
    const { controller } = setup();
    controller.start();
    await flush();
    controller.press('blue');
    controller.press('red');
    expect(controller.getState().phase).toBe('presenting');
    await advance(presentationMs(1));
    expect(controller.getState().session?.inputIndex).toBe(0);
    expect(controller.getState().phase).toBe('awaitingInput');
  });

  it('the response clock starts only after the presentation ends', async () => {
    const { controller } = setup();
    controller.start();
    await flush();
    await advance(presentationMs(1) + RESPONSE_MS - 1);
    expect(controller.getState().phase).toBe('awaitingInput');
    await advance(1);
    expect(controller.getState().phase).toBe('finished');
    expect(controller.getState().outcome).toBe('timeout');
  });

  it('each correct press resets the clock to 5 seconds', async () => {
    const { controller } = setup();
    await startAndWait(controller);
    await completeStageAndWait(controller); // now stage 2 (blue, blue)
    await advance(RESPONSE_MS - 100);
    controller.press('blue');
    await advance(RESPONSE_MS - 100);
    expect(controller.getState().phase).toBe('awaitingInput');
    await advance(100);
    expect(controller.getState().outcome).toBe('timeout');
  });

  it('the clock stops between stages (no timeout during the next presentation)', async () => {
    const { controller } = setup();
    await startAndWait(controller);
    for (let i = 0; i < 5; i++) {
      await completeStageAndWait(controller);
    }
    // Stage 6: presentation is longer than 5 seconds in total across stages; still alive.
    expect(controller.getState().phase).toBe('awaitingInput');
    expect(controller.getState().session?.sequence).toHaveLength(6);
  });

  it('a press exactly at the deadline counts as a timeout', async () => {
    let fakeNow = 0;
    const { view, state } = fakeView();
    const { audio } = fakeAudio();
    const controller = createController({
      view,
      audio,
      now: () => fakeNow,
      random: () => 0.1,
      // Timers never fire here, so only the deadline comparison decides.
      setTimer: (callback, ms) => setTimeout(callback, ms + 60_000),
      clearTimer: (h) => clearTimeout(h),
    });
    controller.start();
    await flush();
    await advance(presentationMs(1) + 60_000);
    expect(controller.getState().phase).toBe('awaitingInput');
    fakeNow += RESPONSE_MS;
    controller.press('blue');
    expect(controller.getState().outcome).toBe('timeout');
    expect(state.message).toBe(MESSAGES.timeout(0));
  });

  it('scores 0 on a mistake in stage 1', async () => {
    const { controller, state } = setup();
    await startAndWait(controller);
    controller.press('red');
    expect(controller.getState().outcome).toBe('wrongColor');
    expect(state.score).toBe(0);
    expect(state.message).toBe(MESSAGES.wrong(0));
    expect(state.startEnabled).toBe(true);
  });

  it('scores 6 on a mistake in stage 7', async () => {
    const { controller, state } = setup();
    await startAndWait(controller);
    for (let i = 0; i < 6; i++) {
      await completeStageAndWait(controller);
    }
    expect(state.stage).toBe(7);
    controller.press('green');
    expect(state.score).toBe(6);
    expect(state.message).toBe(MESSAGES.wrong(6));
  });

  it('wins with 10 after stage 10 and never reaches stage 11', async () => {
    const { controller, state } = setup();
    await startAndWait(controller);
    for (let i = 0; i < 9; i++) {
      await completeStageAndWait(controller);
    }
    expect(state.stage).toBe(10);
    await playCurrentStage(controller);
    expect(controller.getState().outcome).toBe('win');
    expect(state.score).toBe(10);
    expect(state.message).toBe(MESSAGES.win);
    await advance(60_000);
    expect(state.stage).toBe(10);
    expect(controller.getState().phase).toBe('finished');
  });

  it('extra presses after completing a stage are not carried into the next stage', async () => {
    const { controller } = setup();
    await startAndWait(controller);
    controller.press('blue'); // completes stage 1
    controller.press('blue'); // extra
    controller.press('red'); // extra
    await advance(STAGE_PAUSE_MS + presentationMs(2));
    const state = controller.getState();
    expect(state.phase).toBe('awaitingInput');
    expect(state.session?.inputIndex).toBe(0);
    expect(state.session?.completedStages).toBe(1);
  });

  it('a finished game is not changed by old timers; mistake and timeout give one result', async () => {
    const { controller, state } = setup();
    await startAndWait(controller);
    await advance(RESPONSE_MS - 1);
    controller.press('red');
    const message = state.message;
    await advance(RESPONSE_MS * 3);
    expect(controller.getState().outcome).toBe('wrongColor');
    expect(state.message).toBe(message);
    controller.press('blue');
    expect(controller.getState().phase).toBe('finished');
  });

  it('a new game starts from stage 1 and ignores timers of the previous game', async () => {
    let n = 0;
    const { controller, state } = setup({ random: () => ((n++ % 4) + 0.5) / 4 });
    await startAndWait(controller);
    await completeStageAndWait(controller);
    controller.press('green' === sequenceOf(controller)[0] ? 'blue' : 'green');
    expect(controller.getState().phase).toBe('finished');
    controller.start();
    await flush();
    expect(state.stage).toBe(1);
    expect(state.score).toBe(0);
    expect(sequenceOf(controller)).toHaveLength(1);
    await advance(presentationMs(1));
    expect(controller.getState().phase).toBe('awaitingInput');
    await advance(RESPONSE_MS - 1);
    expect(controller.getState().phase).toBe('awaitingInput');
  });

  it('keeps playing with lights when audio fails and shows the message on the first presentation only', async () => {
    const { controller, state } = setup({ audioOk: false });
    controller.start();
    await flush();
    expect(state.message).toBe(MESSAGES.audioFailed);
    expect(state.lit.has('blue')).toBe(true);
    await advance(presentationMs(1));
    expect(state.message).toBe(MESSAGES.yourTurn);
    controller.press('blue');
    await advance(STAGE_PAUSE_MS);
    expect(state.message).toBe(MESSAGES.watch);
  });

  it('gives light and tone feedback on a player press', async () => {
    const { controller, state, tones } = setup();
    await startAndWait(controller);
    await completeStageAndWait(controller);
    const tonesBefore = tones.length;
    controller.press('blue');
    expect(state.lit.has('blue')).toBe(true);
    expect(tones.length).toBe(tonesBefore + 1);
  });
});
