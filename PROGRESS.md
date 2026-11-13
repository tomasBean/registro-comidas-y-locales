# PROGRESS

> Estado vivo del proyecto. Se actualiza en cada commit. Leer esto primero al retomar.

## Hito actual

**H6 (despliegue y pulido PWA/iOS): terminado en lo que no depende del usuario, PR abierto** desde `feat/h6-despliegue` hacia `feat/h5-estadisticas`. **Queda H3** (integración con Supabase), que espera el aviso de que el backend está listo.

**Rama principal:** `main` existe desde el 2026-11-12. El PR #1 (H0) ya está mergeado ahí.

PRs abiertos (pila): #2 H1 → `main`; #3 H2 → `feat/h1-dominio`; #4 H4 → `feat/h2-ui-nucleo`; #5 H5 → `feat/h4-mapa`; #6 H6 → `feat/h5-estadisticas`. Mergear en orden con *merge commit*; al mergear uno, cambiar la base del siguiente a `main` si GitHub no lo hace solo.

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
- **Editar visita** (2026-11-13):
  - Pantalla `/visits/:id/edit` (botón "Editar visita" en la página del lugar): cambia fecha, nota y, por ítem, puntaje, precio, cantidad, comentario, "volverías a pedirlo" y foto. El lugar y los ítems pedidos quedan como se registraron (no se puede agregar ni quitar ítems; para eso, borrar y cargar de nuevo).
  - Reutiliza `TastingFields` con `lockItem` y la validación `validateVisitDraft`. 2 pruebas e2e nuevas (total 24 en Chromium), `lint`, `typecheck`, `build` y `test` pasan.
- **CI de los seis PR (#1 a #6):** los dos jobs en verde en cada uno, incluido e2e en Chromium y WebKit móviles (2026-11-12). Con eso queda cumplido el criterio de salida de H2 (Chromium y WebKit).
- **Verificación local** (2026-11-13, en la compu, rama `claude/determined-bardeen-jhgrmn`):
  - Escaneo de secretos: `gitleaks detect --log-opts="--all" --redact -v` (v8.30.1, binario oficial con checksum verificado) sobre todas las ramas locales y remotas: 26 commits en el historial (16 con cambios; los 10 merges no tienen diff). Sin hallazgos. Mensajes de commit sin `service_role`, `password`, `sbp_` ni `eyJ`; `token` solo aparece en "design tokens".
  - `lint`, `typecheck`, `build` pasan; `test`: 66 tests. e2e `chromium-mobile`: 24 pasan. e2e `webkit-mobile`: 24 pasan con `--workers=1`; con workers en paralelo fallaron 5 por tiempos en la compu (flaky local, no verificado si es de la app o de carga).
  - A mano en `npm run dev` (viewport móvil): editar una visita de Albuche (fecha, puntaje, precio y nota) la deja actualizada y recalcula el promedio; en el ítem se puede agregar, cambiar y quitar la foto.

## Sin verificar

- **WebKit local:** verificado en la compu el 2026-11-13 (ver "Verificación local"). WebKit de Playwright no es Safari de iOS: falta el checklist de iPhone del README.
- **Deploy:** según el usuario (2026-11-13) la app ya está desplegada en Pages e instalada en su teléfono; no lo verifiqué desde la nube. Falta confirmar que el workflow terminó en verde.
- **Escaneo de secretos:** hecho el 2026-11-13 con gitleaks (ver "Verificación local"). La rama `infra/supabase` no existe ni local ni en el remoto: si aparece, repetir el escaneo.
- **OpenStreetMap real:** la nube bloquea las teselas y Nominatim; las pruebas los simulan. Falta ver el mapa y una búsqueda de dirección reales. Detalle en `docs/context/mapa-y-ubicacion.md`.
- **Fotos en iPhone real:** la cámara desde la app instalada no se probó. Checklist en `docs/context/pruebas-y-verificacion.md`.
- **iPhone real:** instalación en pantalla de inicio, safe areas e ícono. Checklist en `docs/context/pruebas-y-verificacion.md`.

## Sigue

1. ~~Mergear la pila (#2 a #6)~~: hecho, `main` incluye hasta el PR #6.
2. **H3:** integración con Supabase, cuando el usuario avise que el backend está listo (`docs/SETUP_SUPABASE.md` con "LISTO PARA H3"). Implica `src/data/supabase/`, login con las dos cuentas, URLs firmadas para fotos, y correr los mismos e2e contra Supabase más la prueba de RLS con un usuario ajeno.
3. **Usuario:** checklist de iPhone del README y agregar la URL de Pages en Supabase (Authentication → URL Configuration) cuando esté H3.
4. ~~Pantalla para editar una visita~~: hecha (ver "Editar visita" arriba).

## Decisiones tomadas

- Hosting: GitHub Pages, con repo público al final (hito H6), tras escaneo de secretos.
- Datos: Supabase (un proyecto gratuito; si no hay lugar, schema separado). Detrás de una interfaz `Repository` intercambiable.
- Mapa: Leaflet + OpenStreetMap; Google Maps solo como link.
- Un puntaje por ítem de cada visita, escala 1–10 en pasos de media estrella, mostrada 1–5.
- Supabase lo configura una sesión aparte, en la compu del usuario. Esta sesión corre en la nube y no comparte archivos con ella: no depende de `.env.local`.
- Graphify: no se instaló desde la nube; queda como decisión del usuario. Motivos en `docs/context/graphify.md`.
- H0: TypeScript 6.0 (no 7) porque `typescript-eslint` todavía no soporta 7. `@playwright/test` fijado en 1.63.0 para coincidir con el Chromium preinstalado. Detalle en `docs/context/andamiaje-y-tooling.md`.
- H0: el workflow de deploy a Pages se deja para H6; en H0 solo CI.
- H6: las pruebas e2e corren con el service worker bloqueado, porque con él activo WebKit no aplicaba los servicios simulados (falló la búsqueda de dirección en CI). La prueba de "abre sin red" es la única que lo habilita y hace un corte real apagando su propio servidor, porque los modos sin conexión simulados de Playwright no sirven en WebKit.
- H6: el login (funcionalidad 10 del brief) se hace en H3, porque depende de Supabase Auth.
- H6: el workflow de deploy también corre lint, typecheck y tests antes de publicar.
- H5: el gasto por mes suma solo los ítems con precio y avisa cuántos no lo tienen. Se agregaron precios inventados al seed para que haya datos.
- H5: "este mes" es el mes calendario del dispositivo.
- H4: las coordenadas del seed son aproximadas (puestas a ojo), no relevadas.
- H4: se puede editar y borrar un lugar y borrar una visita. Editar una visita ya cargada quedó para después y se hizo el 2026-11-13.
- H4: "de siempre" y "quiero ir" son vistas de la pantalla Lugares, no pestañas propias.
- H2: la app en memoria arranca con el seed y pierde los cambios al recargar.
- H1: el seed usa fechas, precios y comentarios inventados (el brief los declara ilustrativos) y deja los lugares sin coordenadas hasta H4.
- H1: se agregó `createdAt` a visitas, degustaciones y fotos para ordenar de forma estable. No cambia el modelo de §3.
- H1: "los de siempre" sugeridos = 3 visitas o más (`SUGGESTED_REGULAR_MIN_VISITS` en `src/domain/places.ts`).
- H1: la categoría de "Papas" en el seed es "papas fritas".
- H0: fuente del sistema (sin fuentes web) e íconos provisorios, hasta definir identidad visual.

## Pendientes de confirmar por el usuario

- Graphify: ¿instalarlo en su compu? Ver `docs/context/graphify.md`.
- Nombre y dirección de los lugares de ejemplo: *Perdú* (¿la sucursal de Rondeau?), *Albuche*, *La Cabaña de Chamigo* (calle Belgrano, número a completar).

## Pedidos a la sesión de Supabase

- La app muestra quién cargó cada degustación. Hace falta un nombre visible por miembro (por ejemplo, columna `display_name` en `notebook_members`). Si no existe, la app muestra el email. No bloquea.

## Estado de la sesión de Supabase

No iniciada (según este repo).

## Bloqueos

(ninguno)
