import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow } from './helpers';

test.beforeEach(async ({ page }) => {
  // "Este mes" depends on today's date: pin it inside the month the seed covers.
  await page.clock.setFixedTime(new Date('2026-11-15T15:00:00Z'));
  await page.goto('./');
  await page.getByRole('link', { name: 'Resumen' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible();
});

test('shows the most visited places this month and all time', async ({ page }) => {
  const list = page.getByRole('list', { name: 'Más visitados' });
  await expect(list.getByRole('listitem')).toHaveText([/1\s*Perdú\s*2 visitas/, /Albuche\s*1 visita/, /La Cabaña de Chamigo\s*1 visita/]);

  await page.getByRole('group', { name: 'Período de más visitados' }).getByRole('button', { name: 'Histórico' }).click();
  await expect(list.getByRole('listitem')).toHaveText([/Perdú\s*4 visitas/, /Albuche\s*3 visitas/, /La Cabaña de Chamigo\s*1 visita/]);
  await expectNoHorizontalOverflow(page);
});

test('ranks places by average rating', async ({ page }) => {
  const list = page.getByRole('list', { name: 'Ranking de lugares' });
  await expect(list.getByRole('listitem')).toHaveText([/1\s*Albuche/, /2\s*La Cabaña de Chamigo/, /3\s*Perdú/]);
  await expect(list.getByRole('listitem').first().getByRole('img', { name: '3,9 de 5', exact: true })).toBeVisible();

  await list.getByRole('link', { name: 'Albuche' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Albuche' })).toBeVisible();
});

test('ranks the best items of a category', async ({ page }) => {
  const list = page.getByRole('list', { name: 'Mejores de chipá' });
  await expect(list.getByRole('listitem')).toHaveText([/Chipá\s*La Cabaña de Chamigo · 1 vez/, /Chipá\s*Perdú · 4 veces/]);

  await page.getByRole('group', { name: 'Categoría del ranking' }).getByRole('button', { name: 'hamburguesa' }).click();
  await expect(page.getByRole('list', { name: 'Mejores de hamburguesa' }).getByRole('listitem')).toHaveText([
    /Triple customizada\s*Albuche · 3 veces/,
  ]);
});

test('adds up spending per month', async ({ page }) => {
  const months = page.getByRole('list', { name: 'Gasto por mes' }).getByRole('listitem');
  await expect(months).toHaveCount(3);
  await expect(months.nth(0)).toContainText('noviembre de 2026');
  await expect(months.nth(0)).toContainText('$ 21.800');
  await expect(months.nth(0)).toContainText('4 visitas · 1 ítem sin precio');
  await expect(months.nth(1)).toContainText('$ 19.500');
  await expect(months.nth(2)).toContainText('$ 14.500');
});

test('explains an empty month instead of showing an empty list', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-02-10T15:00:00Z'));
  await page.reload();
  await page.getByRole('link', { name: 'Resumen' }).click();
  await expect(page.getByText('Todavía no hay visitas en febrero de 2027.')).toBeVisible();
});
