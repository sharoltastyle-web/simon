import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { expectScores, fixRandomToBlue, message, pad, playGameWithScoreOne, waitForServiceWorkerControl } from './helpers.ts';
import { startStaticServer, type SwappableServer } from './staticServer.ts';

const PORT = 4174;
const URL = `http://localhost:${PORT}/simon/`;
const V1 = 'dist-e2e/v1';
const V2 = 'dist-e2e/v2';

let server: SwappableServer;

test.beforeAll(async () => {
  test.setTimeout(120_000);
  for (const [id, dir] of [['1', V1], ['2', V2]]) {
    execSync(`npx vite build --outDir ${dir} --emptyOutDir --logLevel warn`, {
      env: { ...process.env, SIMON_BUILD_ID: id },
      stdio: 'inherit',
    });
  }
  server = await startStaticServer(PORT, V1);
});

test.afterAll(async () => {
  await server?.close();
});

const hasWaitingWorker = () =>
  navigator.serviceWorker.getRegistration().then((registration) => Boolean(registration?.waiting));

test('a waiting update does not interrupt a game; the new version loads after reopening', async ({ context }) => {
  const page = await context.newPage();
  await fixRandomToBlue(page);
  await page.goto(URL);
  await waitForServiceWorkerControl(page);
  await expect(page.locator('html')).toHaveAttribute('data-build', '1');

  // A saved score from version 1, then a new game in progress.
  await playGameWithScoreOne(page);
  await page.locator('#start-button').click();
  await expect(message(page)).toHaveText('תורכם');
  await page.evaluate(() => {
    (window as unknown as { __samePage: boolean }).__samePage = true;
  });

  // Deploy version 2 and let the browser find it.
  server.serve(V2);
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()));
  await page.waitForFunction(hasWaitingWorker);

  // The open game is untouched: same page, same version, still playable.
  expect(await page.evaluate(() => (window as unknown as { __samePage?: boolean }).__samePage)).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-build', '1');
  await expect(page.locator('#stage-value')).toHaveText('1');
  await pad(page, 'blue').click();
  await expect(page.locator('#stage-value')).toHaveText('2');
  await expect(message(page)).toHaveText('תורכם');
  expect(await page.evaluate(() => (window as unknown as { __samePage?: boolean }).__samePage)).toBe(true);

  // Close every page of the old version, then reopen in the same browser context.
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(URL);
  await expect
    .poll(async () => {
      const build = await reopened.locator('html').getAttribute('data-build');
      if (build !== '2') await reopened.reload();
      return build;
    }, { timeout: 15_000 })
    .toBe('2');
  expect(await reopened.evaluate(hasWaitingWorker)).toBe(false);

  // Scores from version 1 are kept.
  await expectScores(reopened, '1', '1');

  // Only the new version's files remain cached.
  const v2Urls = [...readFileSync(`${V2}/sw.js`, 'utf8').matchAll(/url:"([^"]+)"/g)].map((m) => `${URL}${m[1]}`);
  const v1Js = [...readFileSync(`${V1}/sw.js`, 'utf8').matchAll(/url:"(assets\/index-[^"]+\.js)"/g)].map((m) => `${URL}${m[1]}`);
  const cached = await reopened.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) urls.push(request.url.split('?')[0]);
    }
    return urls;
  });
  for (const url of v2Urls) expect(cached).toContain(url);
  for (const url of v1Js) expect(cached).not.toContain(url);
});
