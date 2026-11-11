# PROGRESS

> Estado vivo del proyecto. Se actualiza en cada commit. Leer esto primero al retomar.

## Hito actual

**H1 (dominio + repositorio en memoria + seeds): terminado, PR abierto** desde `feat/h1-dominio` hacia `feat/h0-andamiaje`. Sigue Graphify y después H2.

PRs abiertos (pila): #1 H0 → `ccr-05e3a17d-dyke5o`; H1 → `feat/h0-andamiaje`.

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

## Sin verificar

- **WebKit:** en la nube no hay WebKit. El proyecto `webkit-mobile` solo corre en CI; revisar el job "E2E" del PR de H0. No está verificado localmente.
- **iPhone real:** instalación en pantalla de inicio, safe areas e ícono. Checklist en `docs/context/pruebas-y-verificacion.md`.

## Sigue

1. Graphify (evaluar; CONSULTAR si toca configuración global).
2. **H2:** UI núcleo (rama `feat/h2-ui-nucleo`, sale de `feat/h1-dominio`).
3. H4 y H5 sobre `data/memory`. **H3 espera** el aviso del usuario de que el backend está listo (la sesión de Supabase deja URL y clave anon en el repo y lo indica en `docs/SETUP_SUPABASE.md`).

## Decisiones tomadas

- Hosting: GitHub Pages, con repo público al final (hito H6), tras escaneo de secretos.
- Datos: Supabase (un proyecto gratuito; si no hay lugar, schema separado). Detrás de una interfaz `Repository` intercambiable.
- Mapa: Leaflet + OpenStreetMap; Google Maps solo como link.
- Un puntaje por ítem de cada visita, escala 1–10 en pasos de media estrella, mostrada 1–5.
- Supabase lo configura una sesión aparte, en la compu del usuario. Esta sesión corre en la nube y no comparte archivos con ella: no depende de `.env.local`.
- Graphify: se evalúa después de H1, con verificación del hook y plan B.
- H0: TypeScript 6.0 (no 7) porque `typescript-eslint` todavía no soporta 7. `@playwright/test` fijado en 1.63.0 para coincidir con el Chromium preinstalado. Detalle en `docs/context/andamiaje-y-tooling.md`.
- H0: el workflow de deploy a Pages se deja para H6; en H0 solo CI.
- H1: el seed usa fechas, precios y comentarios inventados (el brief los declara ilustrativos) y deja los lugares sin coordenadas hasta H4.
- H1: se agregó `createdAt` a visitas, degustaciones y fotos para ordenar de forma estable. No cambia el modelo de §3.
- H1: "los de siempre" sugeridos = 3 visitas o más (`SUGGESTED_REGULAR_MIN_VISITS` en `src/domain/places.ts`).
- H1: la categoría de "Papas" en el seed es "papas fritas".
- H0: fuente del sistema (sin fuentes web) e íconos provisorios, hasta definir identidad visual.

## Pendientes de confirmar por el usuario

- Rama principal (ver arriba).
- Nombre y dirección de los lugares de ejemplo: *Perdú* (¿la sucursal de Rondeau?), *Albuche*, *La Cabaña de Chamigo* (calle Belgrano, número a completar).

## Pedidos a la sesión de Supabase

- La app muestra quién cargó cada degustación. Hace falta un nombre visible por miembro (por ejemplo, columna `display_name` en `notebook_members`). Si no existe, la app muestra el email. No bloquea.

## Estado de la sesión de Supabase

No iniciada (según este repo).

## Bloqueos

(ninguno)
