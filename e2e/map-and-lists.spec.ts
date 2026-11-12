import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, itemFields, mockMapServices, openPlace, rate } from './helpers';

test.beforeEach(async ({ page }) => {
  await mockMapServices(page, [
    { lat: '-31.4201', lon: '-64.1888', display_name: 'Belgrano 123, Centro, Córdoba, Argentina' },
  ]);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Últimas visitas' })).toBeVisible();
});

test('the map shows a pin per place and filters them', async ({ page }) => {
  await page.getByRole('link', { name: 'Mapa' }).click();
  const map = page.getByRole('region', { name: 'Mapa de lugares' });
  const pins = map.getByRole('button', { name: /Perdú|Albuche|La Cabaña de Chamigo/ });
  await expect(pins).toHaveCount(3);
  await expect(page.getByRole('status')).toHaveText('3 en el mapa');
  await expectNoHorizontalOverflow(page);

  // By item category.
  await page.getByLabel('Categoría de ítem').selectOption('chipá');
  await expect(pins).toHaveCount(2);
  await expect(map.getByRole('button', { name: 'Albuche' })).toHaveCount(0);

  // By minimum rating of that category: Perdú's chipá averages below 3,5.
  await page.getByLabel('Puntaje mínimo').selectOption({ label: '3,5 o más' });
  await expect(pins).toHaveCount(1);
  await expect(map.getByRole('button', { name: 'La Cabaña de Chamigo' })).toBeVisible();

  // By kind of place.
  await page.getByLabel('Categoría de ítem').selectOption('');
  await page.getByLabel('Puntaje mínimo').selectOption('');
  await page.getByRole('button', { name: 'Visitados' }).click();
  await expect(pins).toHaveCount(1);
  await expect(map.getByRole('button', { name: 'Perdú' })).toBeVisible();
  await page.getByRole('button', { name: 'De siempre' }).click();
  await expect(page.getByRole('status')).toHaveText('Ningún lugar coincide con los filtros.');
});

test('tapping a pin opens the place page, with a Google Maps link', async ({ page }) => {
  await page.getByRole('link', { name: 'Mapa' }).click();
  await page.getByRole('region', { name: 'Mapa de lugares' }).getByRole('button', { name: 'Albuche' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Albuche' })).toBeVisible();
  const link = page.getByRole('link', { name: 'Abrir en Google Maps' });
  await expect(link).toHaveAttribute(
    'href',
    'https://www.google.com/maps/search/?api=1&query=Albuche%2C%20Illia%20y%20Paran%C3%A1%2C%20Nueva%20C%C3%B3rdoba',
  );
  await expect(link).toHaveAttribute('target', '_blank');
});

test('keeps a wishlist and moves a place out of it on its first visit', async ({ page }) => {
  await page.getByRole('link', { name: 'Lugares' }).click();
  await page.getByRole('button', { name: 'Quiero ir' }).click();
  await expect(page.getByText('No hay pendientes')).toBeVisible();

  await page.getByRole('link', { name: 'Agregar lugar para ir' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Nuevo lugar' })).toBeVisible();
  await page.getByLabel('Nombre').fill('El Papagayo');
  await page.getByLabel('Notas').fill('Probar la milanesa');
  await page.getByRole('button', { name: 'Guardar lugar' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'El Papagayo' })).toBeVisible();
  await expect(page.getByText('Probar la milanesa')).toBeVisible();

  // It is listed under "Quiero ir", with its note, and without a map pin.
  await page.getByRole('link', { name: 'Lugares' }).click();
  await page.getByRole('button', { name: 'Quiero ir' }).click();
  const card = page.getByRole('link', { name: /El Papagayo/ });
  await expect(card).toContainText('Probar la milanesa');
  await page.getByRole('link', { name: 'Mapa' }).click();
  await expect(page.getByRole('status')).toHaveText('3 en el mapa · 1 sin ubicación');

  // First visit: it stops being a pending place.
  await openPlace(page, 'El Papagayo');
  await page.getByRole('link', { name: 'Registrar visita acá' }).click();
  const item = itemFields(page, 1);
  await item.getByLabel('¿Qué pediste?').fill('Milanesa');
  await rate(item, '4');
  await page.getByRole('button', { name: 'Guardar visita' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'El Papagayo' })).toBeVisible();

  await page.getByRole('link', { name: 'Lugares' }).click();
  await page.getByRole('button', { name: 'Quiero ir' }).click();
  await expect(page.getByText('No hay pendientes')).toBeVisible();
});

test('lists the regulars: flagged by hand and suggested by visits', async ({ page }) => {
  await page.getByRole('link', { name: 'Lugares' }).click();
  await page.getByRole('button', { name: 'De siempre' }).click();

  const cards = page.getByRole('main').getByRole('link');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText('Perdú');
  await expect(cards.nth(1)).toContainText('Albuche');
  await expect(cards.nth(1)).toContainText('Sugerido por la cantidad de visitas');

  // Flag another place by hand from its page.
  await page.getByRole('button', { name: 'Todos' }).click();
  await page.getByRole('link', { name: /La Cabaña de Chamigo/ }).click();
  await page.getByRole('button', { name: 'Marcar como de siempre' }).click();
  await expect(page.getByRole('button', { name: 'Quitar de los de siempre' })).toBeVisible();

  await page.getByRole('link', { name: 'Lugares' }).click();
  await page.getByRole('button', { name: 'De siempre' }).click();
  await expect(cards).toHaveCount(3);
});

test('searches places and items, and shows similar items elsewhere', async ({ page }) => {
  await page.getByRole('link', { name: 'Lugares' }).click();
  await page.getByLabel('Buscar lugares e ítems').fill('chipa');

  const items = page.locator('section', { has: page.getByRole('heading', { name: 'Ítems' }) });
  await expect(items.getByRole('link')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Lugares', level: 2 })).toHaveCount(0);

  await items.getByRole('link', { name: /Perdú/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Chipá' })).toBeVisible();

  // Same category in another place.
  await expect(page.getByRole('heading', { name: 'Otros de la categoría «chipá»' })).toBeVisible();
  await page.getByRole('link', { name: /Chipá en La Cabaña de Chamigo/ }).click();
  await expect(page.getByRole('link', { name: 'La Cabaña de Chamigo' })).toBeVisible();

  await page.getByRole('link', { name: 'Lugares' }).click();
  await page.getByLabel('Buscar lugares e ítems').fill('hamburgueseria');
  await expect(page.getByRole('link', { name: /Albuche/ })).toBeVisible();
  await page.getByLabel('Buscar lugares e ítems').fill('sushi');
  await expect(page.getByText('Sin resultados')).toBeVisible();
});

test('sets a place location by address search, by tapping the map and by "Estoy acá"', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -31.4301, longitude: -64.1801 });

  await openPlace(page, 'Perdú');
  await page.getByRole('link', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Editar lugar' })).toBeVisible();
  const map = page.getByRole('region', { name: 'Mapa para ubicar el lugar' });
  const pin = map.getByRole('button', { name: 'Ubicación elegida' });
  await expect(pin).toBeVisible();

  // Remove it, then search an address (results arrive on submit, not per keystroke).
  await page.getByRole('button', { name: 'Quitar ubicación' }).click();
  await expect(pin).toHaveCount(0);
  await expect(page.getByText('Sin ubicación: el lugar aparece en las listas')).toBeVisible();
  await page.getByLabel('Buscar dirección').fill('Belgrano 123');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  // Asserting on the whole list first makes a failure show what actually came back.
  const results = page.getByRole('list', { name: 'Resultados de la búsqueda' }).getByRole('button');
  await expect(results).toHaveText(['Belgrano 123, Centro, Córdoba, Argentina']);
  await results.first().click();
  await expect(pin).toBeVisible();

  // Tap the map to move it, then use the device position.
  await page.getByRole('button', { name: 'Quitar ubicación' }).click();
  await map.click({ position: { x: 80, y: 80 } });
  await expect(pin).toBeVisible();
  await page.getByRole('button', { name: 'Estoy acá' }).click();
  await expect(pin).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByLabel('Dirección', { exact: true }).fill('Rondeau 150');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Perdú' })).toBeVisible();
  await expect(page.getByText('Rondeau 150')).toBeVisible();

  await page.getByRole('link', { name: 'Mapa' }).click();
  await expect(page.getByRole('status')).toHaveText('3 en el mapa');
});

test('deletes a visit and a place after confirming', async ({ page }) => {
  await openPlace(page, 'Albuche');
  await expect(page.getByRole('article')).toHaveCount(3);

  const visit = page.getByRole('article', { name: 'Visita del 10/10/2026' });
  await visit.getByRole('button', { name: 'Borrar visita' }).click();
  await visit.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('article')).toHaveCount(3);
  await visit.getByRole('button', { name: 'Borrar visita' }).click();
  await visit.getByRole('button', { name: 'Sí, borrar' }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(page.getByText('2 visitas')).toBeVisible();

  await page.getByRole('link', { name: 'Editar' }).click();
  await page.getByRole('button', { name: 'Borrar lugar' }).click();
  await page.getByRole('button', { name: 'Sí, borrar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Lugares' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Albuche/ })).toHaveCount(0);
});
