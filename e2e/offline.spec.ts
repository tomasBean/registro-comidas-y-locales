import { expect, test } from '@playwright/test';

// The rest of the suite blocks the service worker; this file is about it.
test.use({ serviceWorkers: 'allow' });

test('the installed shell opens without network', async ({ page, context }) => {
  await page.goto('./');
  // Wait until the service worker has cached the shell and controls the page.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    }
  });

  // Cut the network by failing every request that reaches it. `context.setOffline` is not
  // used because WebKit then fails the navigation before the service worker can answer.
  let reachedNetwork = 0;
  await context.route('**/*', (route) => {
    reachedNetwork += 1;
    return route.abort('internetdisconnected');
  });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Libreta de comidas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Últimas visitas' })).toBeVisible();
  // The shell came from the cache: the document itself never asked the network.
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  test.info().annotations.push({ type: 'requests that reached the network', description: String(reachedNetwork) });
});
