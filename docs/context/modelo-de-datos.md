# Modelo de datos y dominio

Cómo está implementado el modelo de `BRIEF.md` §3 y dónde vive cada regla. Actualizado: 2026-11-11 (H1).

## Entidades (`src/domain/types.ts`)

`Place`, `Item`, `Visit`, `Tasting`, `PlacePhoto`, `Notebook`, `NotebookMember`. Nombres en camelCase; la sesión de Supabase usa snake_case y el mapeo se hace en `data/supabase` (H3).

- `Dataset` = todo lo de una libreta (`places`, `items`, `visits`, `tastings`, `placePhotos`). Es chico: se carga entero y las reglas corren en memoria.
- Agregado respecto del brief: `createdAt` en `Place`, `Visit`, `Tasting` y `PlacePhoto` (para ordenar de forma estable). No es un cambio de modelo: la base ya lleva `created_at`.
- `NotebookMember.displayName`: nombre para mostrar quién cargó. **Pendiente de confirmar con la sesión de Supabase** de dónde sale (ver `PROGRESS.md`).
- `Tasting.priceTotal` y `wouldReorder` admiten `null` (dato no cargado).

## Reglas (todas puras, con tests)

| Archivo | Qué resuelve |
|---|---|
| `text.ts` | `textKey`: clave sin acentos ni mayúsculas; `matchesQuery` para búsquedas |
| `categories.ts` | Normalización, variantes ("chipa" = "chipá"), autocompletado, `resolveCategory` reutiliza la grafía existente |
| `items.ts` | `itemEvolution` (historial, último, anterior, cambio, promedio), `categoryRanking` (misma categoría entre lugares), `similarItems`, `suggestItems`, `findItemByName` |
| `places.ts` | `summarizePlaces`, `mostVisitedPlaces` (con filtro de mes), `rankPlacesByAverage`, `regularPlaces` (manual + sugeridos con 3 visitas o más), `wishlistPlaces`, `placeAfterVisit` |
| `visits.ts` | `visitDetail` (ítems de una misma visita), `validateVisitDraft`, `unitPrice`, `recentVisits` |
| `ratings.ts` | Promedio sobre el valor guardado |

Los promedios se calculan sobre el valor guardado (1–10) y se convierten al mostrar ([formatos y escala](formatos-y-puntaje.md)).

## Repositorio (`src/data/`)

- `repository.ts`: interfaz `Repository` y `RepositoryError` (mensaje en español, mostrable). Las pantallas solo conocen la interfaz.
- `memory/memoryRepository.ts`: implementación en memoria. Devuelve copias; `recordVisit` es todo o nada, reutiliza ítems por nombre, crea los que faltan y pasa el lugar de `wishlist` a `visited`.
- `memory/seed.ts`: datos de ejemplo de §9. Precios, fechas y comentarios son inventados; los lugares no tienen coordenadas todavía.
- `index.ts`: `createRepository()` elige la fuente. Hoy, memoria con seed. Supabase se enchufa ahí.

## Casos de aceptación de §9

Están en `src/domain/seedCases.test.ts`, uno por caso del brief.

Relacionado: [andamiaje y tooling](andamiaje-y-tooling.md), [pruebas y verificación](pruebas-y-verificacion.md).
