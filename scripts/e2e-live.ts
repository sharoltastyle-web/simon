// Runs the browser tests against the live GitHub Pages site instead of a local build.
import { execSync } from 'node:child_process';

execSync('npx playwright test', {
  stdio: 'inherit',
  env: { ...process.env, E2E_BASE_URL: 'https://sharoltastyle-web.github.io/simon/' },
});
