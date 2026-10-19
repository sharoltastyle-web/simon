/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Project Pages address: https://<owner>.github.io/simon/
const BASE = '/simon/';

export default defineConfig({
  base: BASE,
  build: {
    target: 'es2022',
  },
  define: {
    // Invisible build marker, used only by the browser test that checks two versions.
    __APP_BUILD__: JSON.stringify(process.env.SIMON_BUILD_ID ?? 'dev'),
  },
  plugins: [
    VitePWA({
      strategies: 'generateSW',
      // A new worker waits; it never takes over or reloads during a game.
      registerType: 'prompt',
      // Registration is done in src/pwa.ts.
      injectRegister: false,
      // Icons and the manifest are precached by globPatterns / the plugin, so no extra lists here.
      includeManifestIcons: false,
      manifest: {
        id: BASE,
        name: 'סיימון',
        short_name: 'סיימון',
        description: 'משחק זיכרון עם אורות וצלילים',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        background_color: '#171717',
        theme_color: '#171717',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cacheId: 'simon-memory',
        globPatterns: ['**/*.{html,js,css,woff2,png,svg}'],
        // Source file of the maskable PNG; not used by the app.
        globIgnores: ['icons/icon-maskable.svg'],
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^\/simon\//],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        // Only affects the very first worker, so the first visit is controlled without a reload.
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
