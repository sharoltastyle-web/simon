import { MAX_STAGES } from './engine.ts';

export const STORAGE_KEY = 'simon-memory.scores.v1';

export interface Scores {
  bestScore: number | null;
  lastScore: number | null;
}

export interface RecordResult {
  scores: Scores;
  saved: boolean;
}

export interface ScoreStore {
  load(): Scores;
  record(score: number): RecordResult;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const EMPTY: Scores = { bestScore: null, lastScore: null };

function validScore(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_STAGES
    ? value
    : null;
}

// Treats any stored data as untrusted: invalid values count as missing.
export function parseScores(raw: string | null): Scores {
  if (raw === null) {
    return { ...EMPTY };
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ...EMPTY };
  }
  if (typeof data !== 'object' || data === null) {
    return { ...EMPTY };
  }
  const record = data as Record<string, unknown>;
  const lastScore = validScore(record.lastScore);
  let bestScore = validScore(record.bestScore);
  if (lastScore !== null && (bestScore === null || bestScore < lastScore)) {
    bestScore = lastScore;
  }
  return { bestScore, lastScore };
}

// getStorage may itself throw (e.g. storage disabled by privacy settings).
export function createScoreStore(getStorage: () => StorageLike = () => window.localStorage): ScoreStore {
  let memory: Scores = { ...EMPTY };

  function readStored(): Scores {
    try {
      return parseScores(getStorage().getItem(STORAGE_KEY));
    } catch {
      return { ...EMPTY };
    }
  }

  return {
    load(): Scores {
      memory = readStored();
      return { ...memory };
    },

    record(score: number): RecordResult {
      // Another tab may have saved a higher best since this page loaded.
      const stored = readStored();
      const bestScore = Math.max(stored.bestScore ?? 0, memory.bestScore ?? 0, score);
      memory = { bestScore, lastScore: score };
      let saved = true;
      try {
        getStorage().setItem(
          STORAGE_KEY,
          JSON.stringify({ schemaVersion: 1, bestScore, lastScore: score }),
        );
      } catch {
        saved = false;
      }
      return { scores: { ...memory }, saved };
    },
  };
}
