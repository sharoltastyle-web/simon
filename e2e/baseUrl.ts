// Address the browser tests open: the local preview of the build, or the live site when E2E_BASE_URL is set.
export const LIVE = Boolean(process.env.E2E_BASE_URL);
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4173/simon/';
export const ORIGIN = new URL(BASE_URL).origin;
