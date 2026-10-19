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
import type { Scores, ScoreStore } from './scoreStorage.ts';

function fakeView() {
  const state = {
    stage: 0,
    score: 0,
    message: '',
    startEnabled: true,
    messageTappable: false,
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
    setMessageTappable: (t) => (state.messageTappable = t),
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

function setup(
  options: {
    random?: () => number;
    audioOk?: boolean;
    scores?: ScoreStore;
    onScoresChanged?: (scores: Scores) => void;
    isVisible?: () => boolean;
  } = {},
) {
  const { view, state } = fakeView();
  const { audio, tones } = fakeAudio(options.audioOk ?? true);
  const controller = createController({
    view,
    audio,
    now: () => Date.now(),
    random: options.random ?? (() => 0.1), // always blue unless overridden
    scores: options.scores,
    onScoresChanged: options.onScoresChanged,
    isVisible: options.isVisible,
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

describe('pause and resume', () => {
  // Random source cycling through all colors, so a replay can be compared exactly.
  const cycling = () => {
    let n = 0;
    return () => ((n++ % 4) + 0.5) / 4;
  };

  async function reachStage3(controller: GameController): Promise<void> {
    await startAndWait(controller);
    await completeStageAndWait(controller);
    await completeStageAndWait(controller);
  }

  it('pausing mid-presentation stops lights, sound and the clock', async () => {
    const { controller, state, tones, audio } = setup({ random: cycling() });
    await reachStage3(controller);
    await playCurrentStage(controller); // completes stage 3
    await advance(STAGE_PAUSE_MS + LIGHT_MS / 2); // first light of stage 4 is on
    expect(state.lit.size).toBe(1);
    const tonesBefore = tones.length;
    const onsBefore = state.lightOns.length;
    controller.pause();
    expect(controller.getState().phase).toBe('paused');
    expect(state.lit.size).toBe(0);
    expect(audio.stopAll).toHaveBeenCalled();
    await advance(RESPONSE_MS * 4);
    expect(controller.getState().phase).toBe('paused');
    expect(tones.length).toBe(tonesBefore);
    expect(state.lightOns.length).toBe(onsBefore);
  });

  it('resuming replays the same whole sequence, then gives 5 seconds', async () => {
    const { controller, state } = setup({ random: cycling() });
    await reachStage3(controller);
    const sequence = sequenceOf(controller);
    controller.press(sequence[0]); // partial answer
    controller.pause();
    await advance(RESPONSE_MS * 2);
    expect(controller.getState().phase).toBe('paused');

    const onsBefore = state.lightOns.length;
    controller.resumeIfPossible();
    await flush();
    expect(state.message).toBe(MESSAGES.watch);
    expect(controller.getState().phase).toBe('presenting');
    await advance(presentationMs(sequence.length));
    expect(state.lightOns.slice(onsBefore)).toEqual(sequence);
    expect(sequenceOf(controller)).toEqual(sequence);
    expect(controller.getState().session?.completedStages).toBe(2);
    expect(controller.getState().session?.inputIndex).toBe(0);
    expect(state.score).toBe(2);
    expect(state.stage).toBe(3);
    expect(state.message).toBe(MESSAGES.yourTurn);

    // Partial answer was reset: the whole sequence is needed again.
    await advance(RESPONSE_MS - 1);
    expect(controller.getState().phase).toBe('awaitingInput');
    await playCurrentStage(controller);
    expect(controller.getState().session?.completedStages).toBe(3);
  });

  it('no timeout can happen while paused mid-answer', async () => {
    const { controller } = setup({ random: cycling() });
    await reachStage3(controller);
    controller.press(sequenceOf(controller)[0]);
    await advance(RESPONSE_MS - 10);
    controller.pause();
    await advance(RESPONSE_MS * 10);
    expect(controller.getState().phase).toBe('paused');
    expect(controller.getState().outcome).toBeNull();
  });

  it('pausing in the gap between stages resumes with the next stage, no extra draw', async () => {
    let draws = 0;
    const base = cycling();
    const { controller, state } = setup({
      random: () => {
        draws++;
        return base();
      },
    });
    await startAndWait(controller);
    await playCurrentStage(controller); // completes stage 1, next color drawn now
    const drawsAfterComplete = draws;
    const sequence = sequenceOf(controller);
    expect(sequence).toHaveLength(2);
    controller.pause();
    controller.resumeIfPossible();
    await flush();
    await advance(presentationMs(2));
    expect(draws).toBe(drawsAfterComplete);
    expect(sequenceOf(controller)).toEqual(sequence);
    expect(state.stage).toBe(2);
    expect(state.score).toBe(1);
    expect(controller.getState().phase).toBe('awaitingInput');
  });

  it('presses while paused are ignored', async () => {
    const { controller } = setup();
    await startAndWait(controller);
    controller.pause();
    controller.press('blue');
    controller.press('red');
    expect(controller.getState().phase).toBe('paused');
    expect(controller.getState().session?.inputIndex).toBe(0);
  });

  it('presses are ignored while the page is hidden', async () => {
    let visible = true;
    const { controller } = setup({ isVisible: () => visible });
    await startAndWait(controller);
    visible = false;
    controller.press('red');
    expect(controller.getState().phase).toBe('awaitingInput');
  });

  it('pause and resume do nothing without an active game; start is blocked while paused', async () => {
    const { controller, state } = setup();
    controller.pause();
    controller.resumeIfPossible();
    expect(controller.getState().phase).toBe('idle');
    await startAndWait(controller);
    controller.press('red');
    controller.pause();
    controller.resumeIfPossible();
    expect(controller.getState().phase).toBe('finished');

    controller.start();
    await flush();
    controller.pause();
    const sequence = sequenceOf(controller);
    controller.start();
    expect(controller.getState().phase).toBe('paused');
    expect(sequenceOf(controller)).toEqual(sequence);
    expect(state.startEnabled).toBe(false);
  });

  it('a pause while waiting for audio cancels the pending resume', async () => {
    const { controller } = setup();
    await startAndWait(controller);
    controller.pause();
    controller.resumeIfPossible(); // prepare() pending
    controller.pause();
    await flush();
    await advance(RESPONSE_MS * 2);
    expect(controller.getState().phase).toBe('paused');
  });

  it('stays paused with a tap prompt when audio needs a gesture, and continues on tap', async () => {
    const { controller, state, audio } = setup();
    await startAndWait(controller);
    controller.pause();
    vi.mocked(audio.prepare).mockResolvedValueOnce(false);
    controller.resumeIfPossible();
    await flush();
    expect(controller.getState().phase).toBe('paused');
    expect(state.message).toBe(MESSAGES.tapToContinue);
    expect(state.messageTappable).toBe(true);
    await advance(RESPONSE_MS * 3);
    expect(controller.getState().phase).toBe('paused');

    controller.continueFromTap();
    expect(state.messageTappable).toBe(false);
    await flush();
    expect(controller.getState().phase).toBe('presenting');
    expect(state.message).toBe(MESSAGES.watch);
    await advance(presentationMs(1));
    expect(controller.getState().phase).toBe('awaitingInput');
  });

  it('continues with lights only if audio still fails after the tap', async () => {
    const { controller, state, audio } = setup();
    await startAndWait(controller);
    controller.pause();
    vi.mocked(audio.prepare).mockResolvedValueOnce(false).mockResolvedValueOnce(false);
    controller.resumeIfPossible();
    await flush();
    controller.continueFromTap();
    await flush();
    expect(controller.getState().phase).toBe('presenting');
    expect(state.message).toBe(MESSAGES.audioFailed);
    expect(state.lit.has('blue')).toBe(true);
  });

  it('a tap does nothing when no tap is expected', async () => {
    const { controller } = setup();
    await startAndWait(controller);
    controller.continueFromTap();
    expect(controller.getState().phase).toBe('awaitingInput');
    controller.pause();
    controller.continueFromTap();
    await flush();
    expect(controller.getState().phase).toBe('paused');
  });
});

describe('saving scores', () => {
  function fakeStore(saved = true) {
    const recorded: number[] = [];
    const store: ScoreStore = {
      load: () => ({ bestScore: null, lastScore: null }),
      record: (score) => {
        recorded.push(score);
        return { scores: { bestScore: Math.max(...recorded), lastScore: score }, saved };
      },
    };
    return { store, recorded };
  }

  it('records the result once when a game ends (0, 6, 10)', async () => {
    const { store, recorded } = fakeStore();
    const updates: Scores[] = [];
    const { controller } = setup({ scores: store, onScoresChanged: (s) => updates.push(s) });

    await startAndWait(controller);
    controller.press('red');
    await advance(RESPONSE_MS * 2);
    expect(recorded).toEqual([0]);

    controller.start();
    await flush();
    await advance(presentationMs(1));
    for (let i = 0; i < 6; i++) {
      await completeStageAndWait(controller);
    }
    controller.press('green');
    expect(recorded).toEqual([0, 6]);

    controller.start();
    await flush();
    await advance(presentationMs(1));
    for (let i = 0; i < 9; i++) {
      await completeStageAndWait(controller);
    }
    await playCurrentStage(controller);
    expect(recorded).toEqual([0, 6, 10]);
    expect(updates.at(-1)).toEqual({ bestScore: 10, lastScore: 10 });
  });

  it('does not record anything on start, pause or resume', async () => {
    const { store, recorded } = fakeStore();
    const { controller } = setup({ scores: store });
    await startAndWait(controller);
    controller.pause();
    controller.resumeIfPossible();
    await flush();
    expect(recorded).toEqual([]);
  });

  it('appends the save-failure message and the game still works', async () => {
    const { store } = fakeStore(false);
    const { controller, state } = setup({ scores: store });
    await startAndWait(controller);
    controller.press('red');
    expect(state.message).toBe(`${MESSAGES.wrong(0)} ${MESSAGES.saveFailed}`);
    expect(state.startEnabled).toBe(true);
    controller.start();
    await flush();
    expect(controller.getState().phase).toBe('presenting');
  });
});
