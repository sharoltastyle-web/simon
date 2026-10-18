import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths so the build also works under a sub-path (final base is set at deployment).
  base: './',
  build: {
    target: 'es2022',
  },
});
