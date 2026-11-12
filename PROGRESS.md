# PROGRESS

> Estado vivo del proyecto. Se actualiza en cada commit. Leer esto primero al retomar.

## Hito actual

**H6 (despliegue y pulido PWA/iOS): terminado en lo que no depende del usuario, PR abierto** desde `feat/h6-despliegue` hacia `feat/h5-estadisticas`. **Queda H3** (integración con Supabase), que espera el aviso de que el backend está listo.

PRs abiertos (pila): #1 H0 → `ccr-05e3a17d-dyke5o`; #2 H1 → `feat/h0-andamiaje`; #3 H2 → `feat/h1-dominio`; #4 H4 → `feat/h2-ui-nucleo`; #5 H5 → `feat/h4-mapa`; #6 H6 → `feat/h5-estadisticas`.

## ⚠️ Antes de mergear: definir la rama principal

La rama `main` **no existe** en el remoto. Los PR están apilados: H0 apunta a `ccr-05e3a17d-dyke5o` y cada hito siguiente apunta a la rama del hito anterior. El usuario tiene que definir la rama principal (crear `main` o renombrar la base) antes de mergear. El workflow de deploy (H6) y el de CI en `push` asumen `main`.

## Hecho y verificado

- `BRIEF.md` v0.2 y `BRIEF-SUPABASE.md` v0.1 escritos.
- **H0** (verificado en la sesión en la nube, 2026-11-11):
  - Estructura `src/{domain,data,features,ui,config}`, Vite + React + TypeScript, `HashRouter`, PWA mínima (manifest, service worker, íconos, meta tags de iOS), tokens de diseño en `src/ui/theme/tokens.css`, README.
  - `npm run lint`, `npm run typecheck`, `npm run test` (6 tests) y `npm run build`: pasan.
  - `npm run e2e -- --project=chromium-mobile`: 2 pruebas pasan (la app abre vacía sin desbordes ni errores; manifest e íconos se sirven).
  - Workflow de CI escrito (`.github/workflows/ci.yml`).

- **H1** (2026-11-11):
  - `src/domain/`: tipos y reglas puras (categorías, evolución de ítems, rankings, más visitados, de siempre, validación de visita).
  - `src/data/`: interfaz `Repository`, `MemoryRepository` y seed de §9.
  - `npm run test`: 38 tests pasan. Los cinco casos de §9 están en `src/domain/seedCases.test.ts`. `lint`, `typecheck` y `build` pasan.

- **H2** (2026-11-11):
  - Pantallas: inicio (últimas visitas), lugares, ficha de lugar (promedio, evolución por ítem, visitas, fotos y carta), ficha de ítem, y registrar visita con varios ítems, lugar nuevo y foto.
  - `npm run e2e -- --project=chromium-mobile`: 9 pruebas pasan. `npm run test`: 41 tests. `lint`, `typecheck`, `build` pasan.
- **H4** (2026-11-11):
  - Mapa con pines por tipo y filtros (tipo, categoría de ítem, puntaje mínimo); alta y edición de lugar con ubicación por "Estoy acá", búsqueda de dirección o tocando el mapa; "Abrir en Google Maps"; vistas "De siempre" y "Quiero ir"; búsqueda de lugares e ítems; ítems similares; borrar visita y lugar.
  - `npm run e2e -- --project=chromium-mobile`: 16 pruebas pasan. `npm run test`: 57 tests. `lint`, `typecheck`, `build` pasan.
- **H5** (2026-11-12):
  - Pantalla "Resumen": más visitados (este mes / histórico), ranking de lugares por promedio, mejores ítems por categoría y gasto por mes. Cálculo en `src/domain/` (`places.ts`, `items.ts`, `stats.ts`).
  - `npm run test`: 66 tests (uno o más por ranking en `src/domain/stats.test.ts`). `npm run e2e -- --project=chromium-mobile`: 21 pruebas. `lint`, `typecheck`, `build` pasan.
- **H6** (2026-11-12):
  - `docs/DEPLOY.md` con los pasos del usuario; workflow `.github/workflows/deploy.yml`; README con instalación en iPhone y Android y checklist de pruebas en iPhone real.
  - Prueba e2e de que la app abre sin red (service worker): pasa en Chromium. Total e2e: 22.
  - Escaneo de secretos: solo las plantillas `.env` están versionadas y una búsqueda por patrones en el historial de las ramas de la app no encontró nada.
- **CI de los PR #1 (H0), #2 (H1) y #3 (H2):** los dos jobs en verde, incluido e2e en Chromium y WebKit.

## Sin verificar

- **WebKit en H2:** en la nube no hay WebKit. Solo lo verifica el job "E2E" de CI de cada PR; mirar el del PR de H2.
- **Deploy:** el workflow de Pages nunca corrió (no existe `main` ni está activado Pages).
- **Escaneo de secretos incompleto:** no se usó `gitleaks` y no se revisó la rama `infra/supabase` (no estaba en el remoto). Repetir según `docs/DEPLOY.md` antes de hacer público el repo.
- **OpenStreetMap real:** la nube bloquea las teselas y Nominatim; las pruebas los simulan. Falta ver el mapa y una búsqueda de dirección reales. Detalle en `docs/context/mapa-y-ubicacion.md`.
- **Fotos en iPhone real:** la cámara desde la app instalada no se probó. Checklist en `docs/context/pruebas-y-verificacion.md`.
- **iPhone real:** instalación en pantalla de inicio, safe areas e ícono. Checklist en `docs/context/pruebas-y-verificacion.md`.

## Sigue

1. **Usuario:** definir la rama principal y mergear la pila en orden (ver `docs/DEPLOY.md`, paso 0).
2. **H3:** integración con Supabase, cuando el usuario avise que el backend está listo (`docs/SETUP_SUPABASE.md` con "LISTO PARA H3"). Implica `src/data/supabase/`, login con las dos cuentas, URLs firmadas para fotos, y correr los mismos e2e contra Supabase más la prueba de RLS con un usuario ajeno.
3. **Usuario:** pasos de `docs/DEPLOY.md` (revisión de secretos, visibilidad, Pages, variables) y checklist de iPhone del README.
4. Pendiente menor: pantalla para editar una visita ya cargada.

## Decisiones tomadas

- Hosting: GitHub Pages, con repo público al final (hito H6), tras escaneo de secretos.
- Datos: Supabase (un proyecto gratuito; si no hay lugar, schema separado). Detrás de una interfaz `Repository` intercambiable.
- Mapa: Leaflet + OpenStreetMap; Google Maps solo como link.
- Un puntaje por ítem de cada visita, escala 1–10 en pasos de media estrella, mostrada 1–5.
- Supabase lo configura una sesión aparte, en la compu del usuario. Esta sesión corre en la nube y no comparte archivos con ella: no depende de `.env.local`.
- Graphify: no se instaló desde la nube; queda como decisión del usuario. Motivos en `docs/context/graphify.md`.
- H0: TypeScript 6.0 (no 7) porque `typescript-eslint` todavía no soporta 7. `@playwright/test` fijado en 1.63.0 para coincidir con el Chromium preinstalado. Detalle en `docs/context/andamiaje-y-tooling.md`.
- H0: el workflow de deploy a Pages se deja para H6; en H0 solo CI.
- H6: el login (funcionalidad 10 del brief) se hace en H3, porque depende de Supabase Auth.
- H6: el workflow de deploy también corre lint, typecheck y tests antes de publicar.
- H5: el gasto por mes suma solo los ítems con precio y avisa cuántos no lo tienen. Se agregaron precios inventados al seed para que haya datos.
- H5: "este mes" es el mes calendario del dispositivo.
- H4: las coordenadas del seed son aproximadas (puestas a ojo), no relevadas.
- H4: se puede editar y borrar un lugar y borrar una visita. **Falta editar** una visita o una degustación ya cargada (el repositorio lo soporta; no hay pantalla). Hoy se corrige borrando la visita y cargándola de nuevo.
- H4: "de siempre" y "quiero ir" son vistas de la pantalla Lugares, no pestañas propias.
- H2: la app en memoria arranca con el seed y pierde los cambios al recargar.
- H1: el seed usa fechas, precios y comentarios inventados (el brief los declara ilustrativos) y deja los lugares sin coordenadas hasta H4.
- H1: se agregó `createdAt` a visitas, degustaciones y fotos para ordenar de forma estable. No cambia el modelo de §3.
- H1: "los de siempre" sugeridos = 3 visitas o más (`SUGGESTED_REGULAR_MIN_VISITS` en `src/domain/places.ts`).
- H1: la categoría de "Papas" en el seed es "papas fritas".
- H0: fuente del sistema (sin fuentes web) e íconos provisorios, hasta definir identidad visual.

## Pendientes de confirmar por el usuario

- Rama principal (ver arriba).
- Graphify: ¿instalarlo en su compu? Ver `docs/context/graphify.md`.
- Nombre y dirección de los lugares de ejemplo: *Perdú* (¿la sucursal de Rondeau?), *Albuche*, *La Cabaña de Chamigo* (calle Belgrano, número a completar).

## Pedidos a la sesión de Supabase

- La app muestra quién cargó cada degustación. Hace falta un nombre visible por miembro (por ejemplo, columna `display_name` en `notebook_members`). Si no existe, la app muestra el email. No bloquea.

## Estado de la sesión de Supabase

No iniciada (según este repo).

## Bloqueos

(ninguno)
