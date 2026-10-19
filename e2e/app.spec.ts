import { expect, test } from '@playwright/test';
import { expectScores, fixRandomToBlue, message, pad, playGameWithScoreOne } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await fixRandomToBlue(page);
});

test('home screen opens in Hebrew RTL with the board in the right order', async ({ page }) => {
  await page.goto('./');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('lang', 'he');
  await expect(html).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#screen-home')).toBeVisible();
  await expect(page.locator('#screen-about')).toBeHidden();
  await expect(page.locator('.status-bar')).toContainText('שלב: 0 מתוך 10');
  await expect(page.locator('.status-bar')).toContainText('ניקוד: 0');

  const box = async (color: 'blue' | 'red' | 'yellow' | 'green') => {
    const b = await pad(page, color).boundingBox();
    if (!b) throw new Error(`no box for ${color}`);
    return b;
  };
  const [blue, red, yellow, green] = await Promise.all([box('blue'), box('red'), box('yellow'), box('green')]);
  // Blue top-right, red top-left, yellow bottom-right, green bottom-left.
  expect(blue.x).toBeGreaterThan(red.x);
  expect(yellow.x).toBeGreaterThan(green.x);
  expect(yellow.y).toBeGreaterThan(blue.y);
  expect(green.y).toBeGreaterThan(red.y);
  for (const b of [blue, red, yellow, green]) {
    expect(b.width).toBeGreaterThanOrEqual(48);
  }
  // No horizontal scrolling at phone size.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('navigation home -> about -> home without a full reload, and direct about link', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    (window as unknown as { __sameDocument: boolean }).__sameDocument = true;
  });
  await page.getByRole('link', { name: 'אודות' }).click();
  await expect(page.locator('#screen-about')).toBeVisible();
  await expect(page.locator('#screen-home')).toBeHidden();
  await expect(page.locator('#best-score')).toHaveText('טרם שוחק משחק');
  await page.getByRole('link', { name: 'חזרה למשחק' }).click();
  await expect(page.locator('#screen-home')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument)).toBe(true);

  await page.goto('./#/about');
  await expect(page.locator('#screen-about')).toBeVisible();
  await expect(page.locator('#screen-home')).toBeHidden();
});

test('a finished game is saved and survives a reload', async ({ page }) => {
  await page.goto('./');
  await playGameWithScoreOne(page);
  await expectScores(page, '1', '1');
  await page.reload();
  await expect(page.locator('#start-button')).toBeEnabled();
  await expectScores(page, '1', '1');
});

test('reloading mid-game starts an empty session and keeps the previous scores', async ({ page }) => {
  await page.goto('./');
  await playGameWithScoreOne(page);
  await page.locator('#start-button').click();
  await expect(message(page)).toHaveText('תורכם');
  await pad(page, 'blue').click();
  await expect(page.locator('#stage-value')).toHaveText('2');
  await page.reload();
  await expect(page.locator('#stage-value')).toHaveText('0');
  await expect(page.locator('#score-value')).toHaveText('0');
  await expect(page.locator('#start-button')).toBeEnabled();
  await expectScores(page, '1', '1');
});
