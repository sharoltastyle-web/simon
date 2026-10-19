import { expect, type Page } from '@playwright/test';

// Test-only: every random pick becomes the first color (blue), so the sequence is predictable.
export async function fixRandomToBlue(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
}

export const message = (page: Page) => page.locator('#message');
export const pad = (page: Page, color: 'blue' | 'red' | 'yellow' | 'green') =>
  page.locator(`.pad[data-color="${color}"]`);

// Records every text the message line shows, to prove no unexpected message appeared.
export async function recordMessages(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __messages: string[] }).__messages = seen;
    document.addEventListener('DOMContentLoaded', () => {
      const line = document.getElementById('message');
      if (!line) return;
      new MutationObserver(() => seen.push(line.textContent ?? '')).observe(line, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
  });
}

export async function seenMessages(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __messages: string[] }).__messages);
}

// Starts a game (random fixed to blue), completes stage 1 and fails stage 2: final score 1.
export async function playGameWithScoreOne(page: Page): Promise<void> {
  await page.locator('#start-button').click();
  await expect(message(page)).toHaveText('תורכם');
  await pad(page, 'blue').click();
  await expect(message(page)).toHaveText('צפו ברצף');
  await expect(page.locator('#stage-value')).toHaveText('2');
  await expect(message(page)).toHaveText('תורכם');
  await pad(page, 'red').click();
  await expect(message(page)).toHaveText('טעות! התוצאה: 1');
  await expect(page.locator('#score-value')).toHaveText('1');
}

export async function expectScores(page: Page, best: string, last: string): Promise<void> {
  await page.getByRole('link', { name: 'אודות' }).click();
  await expect(page.locator('#screen-about')).toBeVisible();
  await expect(page.locator('#best-score')).toHaveText(best);
  await expect(page.locator('#last-score')).toHaveText(last);
  await page.getByRole('link', { name: 'חזרה למשחק' }).click();
  await expect(page.locator('#screen-home')).toBeVisible();
}

export async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}
