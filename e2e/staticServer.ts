import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

// Minimal static server under /simon/ whose folder can be swapped, to simulate a new deployment.
export interface SwappableServer {
  serve(dir: string): void;
  close(): Promise<void>;
}

export async function startStaticServer(port: number, initialDir: string): Promise<SwappableServer> {
  let root = initialDir;
  const server: Server = createServer(async (request, response) => {
    const path = decodeURIComponent((request.url ?? '/').split('?')[0]);
    if (!path.startsWith('/simon/')) {
      response.writeHead(404).end();
      return;
    }
    const relative = normalize(path.slice('/simon/'.length) || 'index.html');
    if (relative.startsWith('..')) {
      response.writeHead(404).end();
      return;
    }
    try {
      const body = await readFile(join(root, relative));
      response.writeHead(200, {
        'Content-Type': TYPES[extname(relative)] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(port, resolve));
  return {
    serve: (dir) => {
      root = dir;
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
