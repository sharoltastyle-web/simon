// One-off script: renders the SVG icon sources in public/icons to PNG files.
// Run with `npm run icons` after changing an SVG; the PNG files are committed.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ICONS_DIR = new URL('../public/icons/', import.meta.url);
const BACKGROUND = '#171717';

const outputs = [
  { source: 'icon.svg', file: 'icon-192.png', size: 192, transparent: true },
  { source: 'icon.svg', file: 'icon-512.png', size: 512, transparent: true },
  { source: 'icon-maskable.svg', file: 'icon-maskable-512.png', size: 512, transparent: false },
  // iOS rounds the corners itself, so the apple-touch-icon is a full square on the app background.
  { source: 'icon.svg', file: 'apple-touch-icon-180.png', size: 180, transparent: false },
];

const browser = await chromium.launch();
try {
  for (const { source, file, size, transparent } of outputs) {
    const svg = await readFile(new URL(source, ICONS_DIR), 'utf8');
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const background = transparent ? 'transparent' : BACKGROUND;
    await page.setContent(
      `<html><body style="margin:0;background:${background}">` +
        `<img style="display:block;width:${size}px;height:${size}px" ` +
        `src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`,
    );
    await page.screenshot({ path: fileURLToPath(new URL(file, ICONS_DIR)), omitBackground: transparent });
    await page.close();
    console.log(`wrote ${file}`);
  }
} finally {
  await browser.close();
}
