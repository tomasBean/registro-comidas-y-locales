import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/** The fieldset of the n-th item of the visit form (1-based). */
export function itemFields(page: Page, position: number): Locator {
  return page.getByRole('group', { name: `Ítem ${position}`, exact: true });
}

/** Picks a rating by its displayed value, e.g. "4,5". */
export async function rate(fields: Locator, value: string): Promise<void> {
  await fields.getByRole('radio', { name: value, exact: true }).check();
  await expect(fields.getByRole('group', { name: /^Puntaje/ }).getByRole('status')).toHaveText(value);
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
}

/** A tiny valid PNG, enough to exercise the photo pipeline. */
export function samplePng(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFklEQVR4nGP8z8Dwn4EIwESMolGF1FMIAD2cAg7rk4vGAAAAAElFTkSuQmCC',
    'base64',
  );
}

/** Opens a place page through the "Lugares" tab. */
export async function openPlace(page: Page, name: string): Promise<void> {
  await page.getByRole('link', { name: 'Lugares' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lugares' })).toBeVisible();
  await page.getByRole('link', { name: new RegExp(name) }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}
