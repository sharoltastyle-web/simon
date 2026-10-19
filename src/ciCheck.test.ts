import { expect, test } from 'vitest';

// Temporary: fails on purpose to prove a failing check blocks deployment. Never merged.
test('deliberately failing check', () => {
  expect(1 + 1).toBe(3);
});
