import { describe, expect, it } from 'vitest';
import { createScoreStore, parseScores, STORAGE_KEY } from './scoreStorage.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

const stored = (best: unknown, last: unknown) =>
  JSON.stringify({ schemaVersion: 1, bestScore: best, lastScore: last });

describe('parseScores', () => {
  it('returns empty scores when nothing is stored', () => {
    expect(parseScores(null)).toEqual({ bestScore: null, lastScore: null });
  });

  it('ignores malformed JSON and non-object values', () => {
    expect(parseScores('{oops')).toEqual({ bestScore: null, lastScore: null });
    expect(parseScores('42')).toEqual({ bestScore: null, lastScore: null });
    expect(parseScores('null')).toEqual({ bestScore: null, lastScore: null });
  });

  it('treats out-of-range, fractional and non-number values as missing', () => {
    for (const bad of [-1, 11, 2.5, '5', true, NaN, {}]) {
      expect(parseScores(stored(bad, bad))).toEqual({ bestScore: null, lastScore: null });
    }
  });

  it('keeps valid values, including 0', () => {
    expect(parseScores(stored(7, 0))).toEqual({ bestScore: 7, lastScore: 0 });
    expect(parseScores(stored(0, 0))).toEqual({ bestScore: 0, lastScore: 0 });
  });

  it('raises a missing or lower best to the last score', () => {
    expect(parseScores(stored(null, 4))).toEqual({ bestScore: 4, lastScore: 4 });
    expect(parseScores(stored(2, 6))).toEqual({ bestScore: 6, lastScore: 6 });
    expect(parseScores(JSON.stringify({ lastScore: 3 }))).toEqual({ bestScore: 3, lastScore: 3 });
  });
});

describe('score store', () => {
  it('loads empty scores before the first game', () => {
    const store = createScoreStore(() => memoryStorage());
    expect(store.load()).toEqual({ bestScore: null, lastScore: null });
  });

  it('updates last score every game and never lowers the best', () => {
    const storage = memoryStorage();
    const store = createScoreStore(() => storage);
    store.load();
    expect(store.record(5).scores).toEqual({ bestScore: 5, lastScore: 5 });
    expect(store.record(2).scores).toEqual({ bestScore: 5, lastScore: 2 });
    expect(store.record(0)).toEqual({ scores: { bestScore: 5, lastScore: 0 }, saved: true });
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!)).toEqual({ schemaVersion: 1, bestScore: 5, lastScore: 0 });
    // A fresh page load reads the same values back.
    expect(createScoreStore(() => storage).load()).toEqual({ bestScore: 5, lastScore: 0 });
  });

  it('stores 0 as a real result, distinct from no game', () => {
    const storage = memoryStorage();
    createScoreStore(() => storage).record(0);
    expect(createScoreStore(() => storage).load()).toEqual({ bestScore: 0, lastScore: 0 });
  });

  it('keeps a higher best saved by another tab', () => {
    const storage = memoryStorage();
    const store = createScoreStore(() => storage);
    store.load();
    storage.setItem(STORAGE_KEY, stored(9, 9));
    expect(store.record(3).scores).toEqual({ bestScore: 9, lastScore: 3 });
  });

  it('recovers from corrupt stored data when recording', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{broken' });
    const store = createScoreStore(() => storage);
    expect(store.load()).toEqual({ bestScore: null, lastScore: null });
    expect(store.record(4)).toEqual({ scores: { bestScore: 4, lastScore: 4 }, saved: true });
  });

  it('survives storage that throws on access', () => {
    const store = createScoreStore(() => {
      throw new Error('SecurityError');
    });
    expect(store.load()).toEqual({ bestScore: null, lastScore: null });
    expect(store.record(6)).toEqual({ scores: { bestScore: 6, lastScore: 6 }, saved: false });
    // Values stay in memory for this page.
    expect(store.record(2).scores).toEqual({ bestScore: 6, lastScore: 2 });
  });

  it('survives getItem and setItem failures', () => {
    const store = createScoreStore(() => ({
      getItem: () => {
        throw new Error('read failed');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    }));
    expect(store.load()).toEqual({ bestScore: null, lastScore: null });
    expect(store.record(1).saved).toBe(false);
  });
});
