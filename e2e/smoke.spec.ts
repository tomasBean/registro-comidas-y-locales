import { expect, test } from '@playwright/test';

test('the empty app opens on a mobile viewport', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');

  await expect(page.getByRole('heading', { level: 1, name: 'Libreta de comidas' })).toBeVisible();
  await expect(page.getByText('Todavía no hay visitas')).toBeVisible();

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
  expect(errors).toEqual([]);
});

test('the PWA manifest and icons are served', async ({ page, request }) => {
  await page.goto('./');

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  const manifestResponse = await request.get(new URL(manifestHref!, page.url()).toString());
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe('standalone');

  for (const icon of manifest.icons as Array<{ src: string }>) {
    const iconResponse = await request.get(new URL(icon.src, manifestResponse.url()).toString());
    expect(iconResponse.ok(), icon.src).toBe(true);
  }

  const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect((await request.get(new URL(touchIcon!, page.url()).toString())).ok()).toBe(true);
});
