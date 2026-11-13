import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, itemFields, openPlace, rate, samplePng } from './helpers';

// The app runs on the in-memory repository with the seed of BRIEF.md §9.
// Data resets on reload, so every test starts from the same state.

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Últimas visitas' })).toBeVisible();
});

test('the home feed lists the latest visits, newest first', async ({ page }) => {
  const visits = page.getByRole('article');
  await expect(visits).toHaveCount(8);
  await expect(visits.first()).toContainText('Perdú');
  await expect(visits.first()).toContainText('10/11/2026');
  await expectNoHorizontalOverflow(page);
});

test('records a visit with several items in an existing place', async ({ page }) => {
  await page.getByRole('link', { name: 'Registrar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Registrar visita' })).toBeVisible();

  await page.getByRole('group', { name: 'Lugares' }).getByRole('button', { name: 'Albuche' }).click();
  await page.getByLabel('Fecha').fill('2026-11-11');

  // Item 1: an existing item, picked from the suggestions of the place.
  const first = itemFields(page, 1);
  await first.getByRole('button', { name: 'Triple customizada' }).click();
  await expect(first.getByText('Ya lo pidieron antes')).toBeVisible();
  await expect(first.getByLabel('Categoría')).toHaveCount(0);
  await rate(first, '5');
  await first.getByLabel('Comentario').fill('Con cheddar y panceta. La mejor hasta ahora.');
  await first.getByRole('button', { name: 'Sí' }).click();

  // Item 2: a new item with its own rating, price and quantity.
  await page.getByRole('button', { name: 'Agregar otro ítem' }).click();
  const second = itemFields(page, 2);
  await second.getByLabel('¿Qué pediste?').fill('Limonada');
  await second.getByRole('textbox', { name: 'Categoría' }).fill('bebida');
  await rate(second, '3,5');
  await second.getByLabel('Precio total ($)').fill('5000');
  await second.getByRole('button', { name: 'Sumar cantidad' }).click();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Guardar visita' }).click();

  // Lands on the place page with the new visit on top.
  await expect(page.getByRole('heading', { level: 1, name: 'Albuche' })).toBeVisible();
  const visit = page.getByRole('article', { name: 'Visita del 11/11/2026' });
  await expect(visit).toContainText('Triple customizada');
  await expect(visit).toContainText('2 × Limonada');
  await expect(visit).toContainText('$ 5.000');
  await expect(visit.getByRole('img', { name: '5 de 5', exact: true })).toBeVisible();
  await expect(visit.getByRole('img', { name: '3,5 de 5', exact: true })).toBeVisible();
  await expect(page.getByText('4 visitas')).toBeVisible();

  // The item card shows the latest rating and the change against the previous visit.
  const triple = page.getByRole('link', { name: /Triple customizada.*Última vez/ });
  await expect(triple).toContainText('4 veces');
  await expect(triple).toContainText('▲ 1 respecto de la vez anterior');

  // The item page lists every time it was tried.
  await triple.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Triple customizada' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Probado 4 veces' })).toBeVisible();
  const latest = page.getByRole('article').first();
  await expect(latest).toContainText('11/11/2026');
  await expect(latest).toContainText('La mejor hasta ahora');
  await expect(latest).toContainText('Volvería a pedirlo');
  await expect(latest).toContainText('Cargó Tomás');
  await expectNoHorizontalOverflow(page);
});

test('creates a new place while recording its first visit', async ({ page }) => {
  await page.getByRole('link', { name: 'Registrar' }).click();

  await page.getByRole('textbox', { name: 'Lugar', exact: true }).fill('El Papagayo');
  await page.getByRole('button', { name: 'Crear «El Papagayo»' }).click();
  await page.getByLabel('Tipo de lugar').fill('restaurante');
  await page.getByLabel('Dirección (opcional)').fill('Arturo M. Bas 69');

  const item = itemFields(page, 1);
  await item.getByLabel('¿Qué pediste?').fill('Milanesa');
  await item.getByRole('textbox', { name: 'Categoría' }).fill('milanesa');
  await rate(item, '4,5');
  await page.getByLabel('Nota de la visita (opcional)').fill('Festejo de aniversario');
  await page.getByRole('button', { name: 'Guardar visita' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'El Papagayo' })).toBeVisible();
  await expect(page.getByText('Arturo M. Bas 69')).toBeVisible();
  await expect(page.getByText('1 visita ·')).toBeVisible();
  await expect(page.getByRole('article')).toContainText('Festejo de aniversario');

  // The new place shows up in the list.
  await page.getByRole('link', { name: 'Lugares' }).click();
  await expect(page.getByRole('link', { name: /El Papagayo/ })).toBeVisible();
});

test('shows validation messages instead of saving an incomplete visit', async ({ page }) => {
  await page.getByRole('link', { name: 'Registrar' }).click();
  await page.getByRole('button', { name: 'Guardar visita' }).click();

  await expect(page.getByText('Elegí un lugar o creá uno nuevo.')).toBeVisible();
  await expect(page.getByText('Decinos qué pediste.')).toBeVisible();
  await expect(page.getByText('Puntaje (falta elegirlo)')).toBeVisible();
  await expect(page.getByText('Faltan datos: revisá lo marcado en rojo.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Registrar visita' })).toBeVisible();
});

test('the place page shows how each item evolved', async ({ page }) => {
  await openPlace(page, 'Perdú');

  await expect(page.getByRole('heading', { level: 1, name: 'Perdú' })).toBeVisible();
  await expect(page.getByText('4 visitas · última: 10/11/2026')).toBeVisible();

  const chipa = page.getByRole('link', { name: /Chipá.*Última vez/ });
  await expect(chipa.getByRole('img', { name: '1,5 de 5', exact: true })).toBeVisible();
  await expect(chipa).toContainText('▼ 2,5 respecto de la vez anterior');
  await expect(chipa.getByRole('img', { name: 'Evolución de Chipá' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(4);

  await chipa.click();
  await expect(page.getByRole('heading', { name: 'Probado 4 veces' })).toBeVisible();
  await expect(page.getByRole('article').first()).toContainText('Estaba seco');
  await expect(page.getByRole('article').first()).toContainText('No volvería a pedirlo');
  await expect(page.getByRole('link', { name: 'Perdú' })).toBeVisible();

  // Back returns to the place page.
  await page.getByRole('button', { name: 'Volver' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Perdú' })).toBeVisible();
});

test('rates fries and burger apart in the same visit', async ({ page }) => {
  await openPlace(page, 'Albuche');

  const visit = page.getByRole('article', { name: 'Visita del 10/10/2026' });
  await expect(visit.getByRole('link', { name: /Triple customizada/ }).getByRole('img', { name: '3 de 5', exact: true })).toBeVisible();
  await expect(visit.getByRole('link', { name: /Papas/ }).getByRole('img', { name: '4 de 5', exact: true })).toBeVisible();
});

test('attaches a compressed photo to an item and a menu photo to a place', async ({ page }) => {
  await openPlace(page, 'La Cabaña de Chamigo');
  await page.getByRole('link', { name: 'Registrar visita acá' }).click();

  // Arrives with the place already chosen.
  await expect(page.getByText('La Cabaña de Chamigo')).toBeVisible();
  const item = itemFields(page, 1);
  await item.getByRole('button', { name: 'Chipá', exact: true }).click();
  await rate(item, '4');
  await item.getByLabel('Agregar foto').setInputFiles({ name: 'chipa.png', mimeType: 'image/png', buffer: samplePng() });
  await expect(item.getByRole('img', { name: 'Foto de Chipá' })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar visita' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'La Cabaña de Chamigo' })).toBeVisible();
  await page.getByLabel('Foto de la carta').setInputFiles({ name: 'carta.png', mimeType: 'image/png', buffer: samplePng() });
  const menu = page.getByRole('img', { name: 'Carta de La Cabaña de Chamigo' });
  await expect(menu).toBeVisible();
  // The stored photo was re-encoded as JPEG by the browser.
  const type = await menu.evaluate(async (image: HTMLImageElement) => (await (await fetch(image.src)).blob()).type);
  expect(type).toBe('image/jpeg');

  await page.getByRole('link', { name: /Chipá.*Última vez/ }).click();
  await expect(page.getByRole('article').first().getByRole('img', { name: /^Chipá, / })).toBeVisible();
});

test('edits a saved visit: date, note and the details of its items', async ({ page }) => {
  await openPlace(page, 'Albuche');
  const visit = page.getByRole('article', { name: 'Visita del 10/10/2026' });
  await visit.getByRole('link', { name: 'Editar visita' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Editar visita' })).toBeVisible();

  // The item stays as recorded: no name or category inputs.
  const fields = itemFields(page, 1);
  await expect(fields.getByLabel('¿Qué pediste?')).toHaveCount(0);
  await expect(fields.getByLabel('Categoría')).toHaveCount(0);

  await page.getByLabel('Fecha').fill('2026-10-12');
  await rate(fields, '2');
  await fields.getByLabel('Precio total ($)').fill('7777');
  await fields.getByLabel('Comentario').fill('Corregido: estaba fría.');
  await page.getByLabel('Nota de la visita (opcional)').fill('Fuimos de noche.');
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Albuche' })).toBeVisible();
  const edited = page.getByRole('article', { name: 'Visita del 12/10/2026' });
  await expect(edited).toContainText('Fuimos de noche.');
  await expect(edited).toContainText('$ 7.777');
  await expect(edited).toContainText('Corregido: estaba fría.');
  await expect(edited.getByRole('img', { name: '2 de 5', exact: true })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Visita del 10/10/2026' })).toHaveCount(0);
});

test('editing a visit with a wrong date shows the error and keeps the visit', async ({ page }) => {
  await openPlace(page, 'Albuche');
  const visit = page.getByRole('article', { name: 'Visita del 10/10/2026' });
  await visit.getByRole('link', { name: 'Editar visita' }).click();
  await page.getByLabel('Fecha').fill('');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Elegí una fecha válida.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Editar visita' })).toBeVisible();
});
