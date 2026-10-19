import { describe, expect, it } from 'vitest';
import { advanceStage, checkInput, MAX_STAGES, newSession, randomColor, type Color, type Session } from './engine.ts';

// Returns values that map to the given colors in order (blue=0, red=1, yellow=2, green=3).
function scripted(colors: Color[]): () => number {
  const order: Color[] = ['blue', 'red', 'yellow', 'green'];
  let i = 0;
  return () => (order.indexOf(colors[i++ % colors.length]) + 0.5) / 4;
}

function playStage(session: Session): { session: Session; result: string } {
  let current = session;
  let result = '';
  for (const color of session.sequence) {
    const checked = checkInput(current, color);
    current = checked.session;
    result = checked.result;
  }
  return { session: current, result };
}

describe('engine', () => {
  it('maps random values uniformly and safely', () => {
    expect(randomColor(() => 0)).toBe('blue');
    expect(randomColor(() => 0.25)).toBe('red');
    expect(randomColor(() => 0.5)).toBe('yellow');
    expect(randomColor(() => 0.99)).toBe('green');
    expect(randomColor(() => 1)).toBe('green');
  });

  it('starts with one color and appends one per stage without changing the past', () => {
    const random = scripted(['red', 'green', 'blue', 'yellow']);
    let session = newSession(random);
    expect(session.sequence).toEqual(['red']);
    for (let stage = 2; stage <= MAX_STAGES; stage++) {
      const before = [...session.sequence];
      session = advanceStage(session, random);
      expect(session.sequence).toHaveLength(stage);
      expect(session.sequence.slice(0, -1)).toEqual(before);
      expect(session.inputIndex).toBe(0);
    }
  });

  it('allows repeated colors, including back to back', () => {
    const random = () => 0.6; // always yellow
    let session = newSession(random);
    session = advanceStage(session, random);
    session = advanceStage(session, random);
    expect(session.sequence).toEqual(['yellow', 'yellow', 'yellow']);
  });

  it('has no stage 11', () => {
    const random = scripted(['blue']);
    let session = newSession(random);
    for (let i = 1; i < MAX_STAGES; i++) {
      session = advanceStage(session, random);
    }
    expect(session.sequence).toHaveLength(10);
    expect(() => advanceStage(session, random)).toThrow();
  });

  it('scores 0 when failing stage 1', () => {
    const session = newSession(() => 0); // blue
    const checked = checkInput(session, 'red');
    expect(checked.result).toBe('wrong');
    expect(checked.session.completedStages).toBe(0);
  });

  it('scores 6 when failing stage 7 and 10 on a win', () => {
    const random = scripted(['blue', 'red', 'green', 'yellow', 'blue', 'blue', 'red', 'green', 'yellow', 'red']);
    let session = newSession(random);
    for (let stage = 1; stage <= 6; stage++) {
      const played = playStage(session);
      expect(played.result).toBe('stageComplete');
      session = advanceStage(played.session, random);
    }
    const wrongColor = session.sequence[0] === 'green' ? 'blue' : 'green';
    const failed = checkInput(session, wrongColor);
    expect(failed.result).toBe('wrong');
    expect(failed.session.completedStages).toBe(6);

    for (let stage = 7; stage <= 10; stage++) {
      const played = playStage(session);
      if (stage < 10) {
        expect(played.result).toBe('stageComplete');
        session = advanceStage(played.session, random);
      } else {
        expect(played.result).toBe('win');
        expect(played.session.completedStages).toBe(10);
      }
    }
  });

  it('a correct but not last press keeps the stage open', () => {
    const random = scripted(['blue', 'red']);
    const session = advanceStage(newSession(random), random);
    const checked = checkInput(session, 'blue');
    expect(checked.result).toBe('correct');
    expect(checked.session.inputIndex).toBe(1);
    expect(checked.session.completedStages).toBe(0);
  });
});
