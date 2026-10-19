// Pure game rules: no DOM, timers, audio or storage.

export type Color = 'blue' | 'red' | 'yellow' | 'green';

export const COLORS: readonly Color[] = ['blue', 'red', 'yellow', 'green'];
export const MAX_STAGES = 10;

export type RandomSource = () => number;

export interface Session {
  readonly sequence: readonly Color[];
  readonly inputIndex: number;
  readonly completedStages: number;
}

export type InputResult = 'correct' | 'stageComplete' | 'win' | 'wrong';

// Uniform mapping of a [0, 1) random value to one of the four colors.
export function randomColor(random: RandomSource): Color {
  const index = Math.min(COLORS.length - 1, Math.floor(random() * COLORS.length));
  return COLORS[Math.max(0, index)];
}

export function newSession(random: RandomSource): Session {
  return { sequence: [randomColor(random)], inputIndex: 0, completedStages: 0 };
}

// Checks one player input against the sequence and returns the updated session.
export function checkInput(session: Session, color: Color): { session: Session; result: InputResult } {
  if (session.sequence[session.inputIndex] !== color) {
    return { session, result: 'wrong' };
  }
  const inputIndex = session.inputIndex + 1;
  if (inputIndex < session.sequence.length) {
    return { session: { ...session, inputIndex }, result: 'correct' };
  }
  const completedStages = session.completedStages + 1;
  const updated = { ...session, inputIndex, completedStages };
  return { session: updated, result: completedStages >= MAX_STAGES ? 'win' : 'stageComplete' };
}

// Appends exactly one color to the end; the existing sequence is never changed.
export function advanceStage(session: Session, random: RandomSource): Session {
  if (session.sequence.length >= MAX_STAGES) {
    throw new Error('No stage after the last one');
  }
  return {
    sequence: [...session.sequence, randomColor(random)],
    inputIndex: 0,
    completedStages: session.completedStages,
  };
}
