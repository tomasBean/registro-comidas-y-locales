# PROGRESS

> Estado vivo del proyecto. Se actualiza en cada commit. Leer esto primero al retomar.

## Hito actual

**H0 (andamiaje): terminado, PR abierto** desde `feat/h0-andamiaje` hacia `ccr-05e3a17d-dyke5o`. Sigue H1.

## ⚠️ Antes de mergear: definir la rama principal

La rama `main` **no existe** en el remoto. Los PR están apilados: H0 apunta a `ccr-05e3a17d-dyke5o` y cada hito siguiente apunta a la rama del hito anterior. El usuario tiene que definir la rama principal (crear `main` o renombrar la base) antes de mergear. El workflow de deploy (H6) y el de CI en `push` asumen `main`.

## Hecho y verificado

- `BRIEF.md` v0.2 y `BRIEF-SUPABASE.md` v0.1 escritos.
- **H0** (verificado en la sesión en la nube, 2026-11-11):
  - Estructura `src/{domain,data,features,ui,config}`, Vite + React + TypeScript, `HashRouter`, PWA mínima (manifest, service worker, íconos, meta tags de iOS), tokens de diseño en `src/ui/theme/tokens.css`, README.
  - `npm run lint`, `npm run typecheck`, `npm run test` (6 tests) y `npm run build`: pasan.
  - `npm run e2e -- --project=chromium-mobile`: 2 pruebas pasan (la app abre vacía sin desbordes ni errores; manifest e íconos se sirven).
  - Workflow de CI escrito (`.github/workflows/ci.yml`).

## Sin verificar

- **WebKit:** en la nube no hay WebKit. El proyecto `webkit-mobile` solo corre en CI; revisar el job "E2E" del PR de H0. No está verificado localmente.
- **iPhone real:** instalación en pantalla de inicio, safe areas e ícono. Checklist en `docs/context/pruebas-y-verificacion.md`.

## Sigue

1. **H1:** dominio + repositorio en memoria + seeds (rama `feat/h1-dominio`, sale de `feat/h0-andamiaje`).
2. Graphify (después de H1).
3. H2, H4, H5 sobre `data/memory`. **H3 espera** el aviso del usuario de que el backend está listo (la sesión de Supabase deja URL y clave anon en el repo y lo indica en `docs/SETUP_SUPABASE.md`).

## Decisiones tomadas

- Hosting: GitHub Pages, con repo público al final (hito H6), tras escaneo de secretos.
- Datos: Supabase (un proyecto gratuito; si no hay lugar, schema separado). Detrás de una interfaz `Repository` intercambiable.
- Mapa: Leaflet + OpenStreetMap; Google Maps solo como link.
- Un puntaje por ítem de cada visita, escala 1–10 en pasos de media estrella, mostrada 1–5.
- Supabase lo configura una sesión aparte, en la compu del usuario. Esta sesión corre en la nube y no comparte archivos con ella: no depende de `.env.local`.
- Graphify: se evalúa después de H1, con verificación del hook y plan B.
- H0: TypeScript 6.0 (no 7) porque `typescript-eslint` todavía no soporta 7. `@playwright/test` fijado en 1.63.0 para coincidir con el Chromium preinstalado. Detalle en `docs/context/andamiaje-y-tooling.md`.
- H0: el workflow de deploy a Pages se deja para H6; en H0 solo CI.
- H0: fuente del sistema (sin fuentes web) e íconos provisorios, hasta definir identidad visual.

## Pendientes de confirmar por el usuario

- Rama principal (ver arriba).
- Nombre y dirección de los lugares de ejemplo: *Perdú* (¿la sucursal de Rondeau?), *Albuche*, *La Cabaña de Chamigo* (calle Belgrano, número a completar).

## Pedidos a la sesión de Supabase

(ninguno)

## Estado de la sesión de Supabase

No iniciada (según este repo).

## Bloqueos

(ninguno)
