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

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Libreta de comidas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Últimas visitas' })).toBeVisible();
});
