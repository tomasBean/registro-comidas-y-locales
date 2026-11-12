import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { expect, test } from '@playwright/test';

// The rest of the suite blocks the service worker; this file is about it.
test.use({ serviceWorkers: 'allow' });

const BASE = '/registro-comidas-y-locales/';
const DIST = path.resolve('dist');
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Serves the production build from its own port, so the test can take the server away.
 * Emulated offline modes do not work here: in WebKit they block the navigation before
 * the service worker gets to answer it.
 */
async function serveBuild(): Promise<{ url: string; server: Server }> {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const relative = pathname.startsWith(BASE) ? pathname.slice(BASE.length) || 'index.html' : null;
    const file = relative === null ? null : path.resolve(DIST, relative);
    if (!file || !file.startsWith(DIST)) {
      response.writeHead(404).end();
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  // `localhost` is a secure context in every browser, which service workers require.
  return { url: `http://localhost:${port}${BASE}`, server };
}

function stop(server: Server): Promise<void> {
  server.closeAllConnections();
  return new Promise((resolve) => server.close(() => resolve()));
}

test('the installed shell opens when the server is gone', async ({ page }) => {
  const { url, server } = await serveBuild();
  try {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Últimas visitas' })).toBeVisible();
    // Wait until the service worker has cached the shell and controls the page.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
        );
      }
    });
  } finally {
    await stop(server);
  }

  // Nothing listens on that port any more: only the cache can answer.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Libreta de comidas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Últimas visitas' })).toBeVisible();
});
