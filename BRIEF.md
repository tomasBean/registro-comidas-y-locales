# BRIEF — Libreta de comidas (borrador v0.2)

> Documento para el agente que construye la app. Es autocontenido: no hace falta contexto previo.
> **DEFAULT** = decisión ya tomada. **CONSULTAR** = parar y preguntar al usuario antes de actuar.
> La configuración de Supabase **no es parte de este brief**: la hace otra sesión con `BRIEF-SUPABASE.md` (ver §7).

## 1. Qué es y para quién

Una app personal para que dos personas (Tomás y su novia) registren los lugares donde comen y **qué piden en cada visita**, con puntaje, precio, comentario y foto, para tener referencia futura. Idea de producto: "Letterboxd para lugares de comida": diario de lo que probaron + lista de pendientes ("quiero ir") + mapa + ranking propio.

- Uso personal, no comercial. Hoy: 2 usuarios. Mañana, quizá amigos y comparar rankings: **diseñá los datos para que sea posible después, pero no construyas nada social ahora**.
- Uso principal: **celular, en el momento** (recién comieron, cargan en 20 segundos). Secundario: compu, para mirar el historial.
- Ciudad de uso: Córdoba, Argentina. Interfaz en **español rioplatense (es-AR)**. Moneda: **pesos argentinos (ARS)**.
- Código, identificadores y comentarios en inglés. Todo texto visible al usuario en español.

## 2. Caso de uso que define el modelo de datos

Lo importante es que **el mismo plato se pide muchas veces y su calidad cambia**, y que **en una misma visita se piden varias cosas con puntajes distintos**:

- Panadería *Perdú* (sucursal de calle Rondeau, Nueva Córdoba): compran chipá casi siempre, casi siempre 4 puntos; la última vez, 1,5.
- Hamburguesería *Albuche* (esquina Illia y Paraná, Nueva Córdoba): siempre piden la triple customizada (eligen toppings); a veces estuvo mejor, a veces peor. Puede pasar que en una visita pidan también papas y les pongan otro puntaje que a la hamburguesa.
- *La Cabaña de Chamigo* (calle Belgrano; dirección exacta a completar): 3 chipá, $6.000 en total, entre 3,5 y 4.

Por eso el modelo separa **el plato** (existe una vez por lugar) de **cada vez que se probó** (una por visita e ítem), y la app muestra la evolución del puntaje de un plato en el tiempo.

## 3. Modelo de dominio

| Entidad | Qué es | Campos clave |
|---|---|---|
| `Place` (lugar) | Un local | nombre, tipo (panadería, hamburguesería…), dirección (texto libre), lat/lng (opcionales), `status`: `visited` \| `wishlist`, `is_regular` (marcado manual de "los de siempre"), notas |
| `Item` (ítem) | Un plato/producto *de un lugar* | `place_id`, nombre ("Chipá", "Triple customizada", "Papas"), `category` (etiqueta normalizada: "chipá", "hamburguesa"…) |
| `Visit` (visita) | Una ocasión en un lugar | `place_id`, fecha (default hoy), nota general |
| `Tasting` (degustación) | Un ítem probado en una visita | `visit_id`, `item_id`, `rating`, `price_total` (ARS enteros), `quantity` (default 1), comentario, `would_reorder` (sí/no), foto (opcional), `created_by` |
| `PlacePhoto` | Foto de un lugar | `place_id`, `kind`: `menu` \| `general`, ruta en Storage |

Reglas:
- **Cada ítem de cada visita tiene su propio puntaje** (papas y lomito, puntajes distintos). Un solo puntaje por `Tasting`, que deciden entre los dos; `created_by` registra quién cargó.
- **Puntaje:** guardalo como entero 1–10 (pasos de media estrella) y **mostralo como 1–5 estrellas con medias**. La escala (rango y presentación) vive en **un solo archivo de configuración**: pasarla a 0–10 tiene que ser trivial.
- **No hay integración con menús de Google ni de nadie**: muchos lugares no tienen menú digital. Los ítems se crean a mano con **autocompletado** a partir de los ítems previos de ese lugar. Se puede subir una **foto de la carta** como `PlacePhoto` de tipo `menu` para consultarla después.
- **Categorías:** permiten "mostrame todos los chipá" e "ítems similares" entre lugares. Autocompletá las ya usadas para no duplicar ("chipa" vs "chipá").
- `Place.status = wishlist` es la lista "quiero ir". Al registrar la primera visita pasa a `visited`.
- Todos los datos pertenecen a una **libreta** (`notebook`) con miembros (`notebook_members`). Hoy hay una libreta y dos miembros. Es la base para sumar amigos o comparar rankings sin migrar todo.

## 4. Funcionalidades de la v1

1. **Registrar visita (el flujo principal, optimizalo):** elegir un lugar existente o crear uno → fecha → agregar uno o varios ítems (autocompletar) cada uno con puntaje, precio, cantidad, comentario, "¿volvería a pedirlo?" y foto. Pocos toques, una mano.
2. **Ficha de lugar:** promedio, historial de visitas, y por cada ítem su **evolución de puntajes** (sparkline o lista cronológica) con el último puntaje destacado; fotos y carta.
3. **Ficha de ítem:** todas las veces que se probó, con fecha, puntaje, precio y comentario.
4. **Quiero ir:** guardar un lugar sin visita (con nota: "probar la milanesa").
5. **Los de siempre:** lista de lugares marcados como habituales (`is_regular`) y sugeridos automáticamente por cantidad de visitas.
6. **Mapa:** pines de lugares con ubicación; distinguir visitados / quiero ir / de siempre; filtrar por categoría de ítem y puntaje mínimo; tocar un pin abre la ficha. En cada lugar, botón **"Abrir en Google Maps"** (ver §6).
7. **Búsqueda:** por texto sobre lugares e ítems. "Ítems similares": desde un ítem, ver la misma categoría en otros lugares.
8. **Estadísticas y ranking propio:** lugares más visitados (este mes / histórico), ranking de lugares por puntaje promedio, ranking de ítems por categoría ("mis mejores chipá"), y gasto por mes. Toda la lógica de cálculo en `domain/`, con tests.
9. **Fotos:** desde cámara o galería, **comprimidas en el cliente** (lado mayor ≤ 1600 px, JPEG ~0,8) antes de subir.
10. **Acceso:** login con dos cuentas; los dos ven y editan lo mismo.

**Fuera de alcance en la v1** (no lo construyas): funciones sociales, seguir amigos o comparar rankings con otras personas (el modelo de libretas lo habilita más adelante), lectura automática de fotos de menú con IA, recomendaciones con IA, cola de escritura offline, importar de Google, notificaciones, reseñas públicas, varios idiomas.

## 5. Arquitectura (modular a propósito)

La interfaz se va a rehacer varias veces. **Cambiar el diseño no debe tocar la lógica.**

```
src/
  domain/     tipos, reglas puras (promedios, evolución, rankings, normalización de categorías), SIN dependencias de React ni de Supabase
  data/       interfaz Repository + implementaciones: memory/ (datos de ejemplo) y supabase/
  features/   hooks y pantallas por funcionalidad (visit-form, place, map, wishlist, search, stats)
  ui/         componentes presentacionales sin lógica de datos + theme/ (tokens de diseño)
  config/     escala de puntaje, locale, constantes
supabase/migrations/   SQL versionado (lo escribe la sesión de Supabase)
docs/context/          notas de contexto enlazadas (ver §11)
```

- **Tokens de diseño** (colores, tipografía, espaciados, radios) como variables CSS en un único archivo. Sin kits de UI pesados. **DEFAULT:** CSS Modules + variables CSS.
- **DEFAULT stack:** Vite + React + TypeScript, `vite-plugin-pwa`, React Router **con `HashRouter`** (GitHub Pages no hace enrutado SPA), `@supabase/supabase-js`, Leaflet (con `react-leaflet`). Pocas dependencias; justificá en el README cualquier otra.
- La app **tiene que correr y poder verificarse sin backend** usando `data/memory` con los datos de ejemplo (§9). Supabase se enchufa detrás de la misma interfaz `Repository`; por eso, si algún día se cambia de proveedor de datos, es reemplazar una carpeta.
- Sin conexión: el *shell* carga (PWA); la escritura sin red muestra un error claro. No hay cola offline en la v1.

## 6. Mapa y Google Maps

- **DEFAULT:** mapa con **Leaflet + OpenStreetMap**, sin claves ni costo. Google Places exige cuenta de facturación y no hace falta para esta función.
- **Alta de ubicación de un lugar**, de más cómoda a menos:
  1. Botón **"Estoy acá"** (geolocalización) al registrar una visita en el lugar.
  2. Buscar una dirección con **Nominatim o Photon** (sin autocompletado por tecla; respetá la política de uso: máx. 1 pedido/seg; resultados al enviar).
  3. Tocar el mapa para ubicar o ajustar el pin a mano.
  4. Un lugar puede quedar sin coordenadas (aparece en listas, no en el mapa).
- **"Abrir en Google Maps":** link de búsqueda con nombre + dirección o lat/lng (`https://www.google.com/maps/search/?api=1&query=...`). No usa API ni clave.
- Encapsulá la geocodificación detrás de una interfaz `Geocoder` para poder cambiar de proveedor.

## 7. Backend (Supabase): lo hace otra sesión

**No configures Supabase en esta sesión.** Eso está en `BRIEF-SUPABASE.md` y lo ejecuta una sesión aparte, en paralelo, que le va pidiendo datos al usuario sin interrumpir tu trabajo.

El contrato entre las dos sesiones:
- Esa sesión escribe `supabase/migrations/` a partir del modelo de §3, configura RLS, Storage, Auth, crea las dos cuentas y deja `docs/SETUP_SUPABASE.md` con el estado.
- Tu sesión consume **solo variables públicas** desde `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). **Nunca** abras, imprimas ni pidas `.env.secrets` ni `.env.local`; cargalas a los comandos sin leerlas (ver `CLAUDE.md`).
- Si cambiás el modelo de §3, **CONSULTAR** (afecta a la otra sesión). Cualquier cambio de esquema se pide a esa sesión escribiéndolo en `PROGRESS.md` bajo "Pedidos a la sesión de Supabase".
- **H3 es flexible:** si cuando llegás a H3 el setup no está listo, seguí con H4 y H5 sobre `data/memory` y volvé a H3 después.

## 8. Despliegue (GitHub Pages)

- **Decisión del usuario:** el repo se hará **público** (el usuario aprobó, con la condición de que no haya claves en el repo). GitHub Pages en el plan gratuito exige repo público.
- Hasta H5 el repo sigue **privado**. **CONSULTAR** antes del paso final:
  1. Corré un escaneo de secretos y revisá el historial completo en busca de claves, tokens o contraseñas.
  2. Confirmá que `.env*` (salvo `.env.example`) están en `.gitignore` y nunca se commitearon.
  3. Recién ahí, pedile al usuario que cambie la visibilidad a pública (lo hace él en Settings; no lo hagas vos).
- **GitHub Actions:** un workflow de CI (lint, typecheck, tests, build) en cada PR y un workflow de deploy a Pages al mergear a `main` (con `actions/deploy-pages`). En Vite, `base: '/registro-comidas-y-locales/'`.
- La URL y la clave `anon` de Supabase llegan al build como **variables del repositorio** de GitHub (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), no como secretos: la clave `anon` es pública por diseño. La seguridad la dan RLS y el cierre del registro. **Nunca** va la `service_role` al frontend ni al repo.
- Dejá `docs/DEPLOY.md` con los pasos exactos que le tocan al usuario (visibilidad, activar Pages con "GitHub Actions" como origen, cargar las variables).

## 9. Datos de ejemplo (seed) y criterio de aceptación

Cargalos en `data/memory`. La sesión de Supabase hace su propio `supabase/seed.sql` marcado "solo desarrollo". Son ilustrativos; el usuario ajusta los reales.

- **Perdú** — panadería, calle Rondeau, Nueva Córdoba. Ítem "Chipá" (categoría chipá): 3 visitas con 4 puntos y una última con 1,5.
- **Albuche** — hamburguesería, esquina Illia y Paraná. Ítem "Triple customizada" (categoría hamburguesa): 3 visitas con puntajes distintos (por ejemplo 4,5 · 3 · 4), comentario con los toppings; en una de esas visitas, ítem "Papas" con otro puntaje.
- **La Cabaña de Chamigo** — calle Belgrano (número a completar). Ítem "Chipá" (categoría chipá), 3 unidades, $6.000 en total, 3,5.

Con eso se tiene que poder demostrar: "los chipá de los tres lugares, comparados", "cómo evolucionó la triple de Albuche", "el chipá de Perdú bajó de 4 a 1,5", "las papas de Albuche vs la hamburguesa en la misma visita" y "lugar más visitado del mes".

## 10. Experiencia y diseño

- **Mobile-first**, tocable con una mano, zonas táctiles ≥ 44 px, respetar *safe areas* de iPhone. En compu se ve bien, pero el celular manda.
- Estética **simple y cálida** (es comida): paleta cálida, tipografía legible, mucho aire, fotos protagonistas. **Todavía no hay referencia visual**: hacé algo sobrio y neutro, sin casarte con un estilo; la identidad se define en una iteración posterior.
- Formatos es-AR: `$ 6.000`, fechas `dd/mm/aaaa`, coma decimal en puntajes ("3,5").
- **PWA instalable en iPhone y Android:** manifest, íconos (incluido `apple-touch-icon`), meta tags de iOS. La novia usa iPhone: en iOS se instala desde Safari → Compartir → "Agregar a pantalla de inicio". Documentalo en el README con pasos para los dos sistemas.
- **Fotos en iOS:** usá `<input type="file" accept="image/*">` (ofrece cámara o galería). Hay antecedentes de fallas intermitentes de cámara en apps instaladas en pantalla de inicio de iOS: **no declares que funciona sin verificarlo**; dejá la galería como respaldo y anotá en el README qué probar en un iPhone real.

## 11. Cómo trabajar

**Hitos** (cada uno cierra por sus criterios de salida, no por tareas hechas):

| # | Hito | Criterio de salida |
|---|---|---|
| H0 | Andamiaje: estructura, tooling, CI, PWA mínima, tokens de diseño, README | `lint`, `typecheck`, `test` y `build` pasan; la app abre vacía en viewport móvil |
| H1 | Dominio + repositorio en memoria + seeds | Tests de dominio verdes con los casos de §9 |
| — | **Graphify** (ver abajo) | Grafo generado y hook verificado, o plan B documentado |
| H2 | UI núcleo: registrar visita (varios ítems), ficha de lugar, ficha de ítem | Flujo completo sobre `data/memory`, verificado con Playwright en viewport móvil (Chromium **y WebKit**) |
| H3 | Integración con Supabase (cuando la otra sesión termine) | Los mismos tests e2e pasan contra Supabase; RLS probada con un usuario ajeno |
| H4 | Mapa, quiero ir, los de siempre, búsqueda e ítems similares | Mapa con filtros; "Abrir en Google Maps" correcto |
| H5 | Estadísticas y ranking propio | Tests de dominio para cada ranking; pantalla con datos del seed |
| H6 | Despliegue y pulido PWA/iOS | `docs/DEPLOY.md` completo; checklist de pruebas en iPhone real en el README |

**Git:**
- Una rama por hito (`feat/h1-dominio`, …) y **un PR por hito** hacia `main`, con qué se hizo y cómo se verificó. Commits chicos y con mensaje claro.
- No hagas push directo a `main`, no reescribas historia compartida, no mergees tus propios PR (los mergea el usuario, en orden y con *merge commit*, no squash).
- Para no esperar merges: cada rama sale de la anterior y el PR apunta a la rama anterior mientras no esté mergeada.
- La sesión de Supabase trabaja en otra rama (`infra/supabase`) y en otro *worktree*; no toques `supabase/` ni `docs/SETUP_SUPABASE.md`.

**Contexto y consumo** (el usuario tiene límites de uso por ventana de 5 horas):
- No podés borrar tu propio contexto. Lo que sí podés: trabajar por hitos, volcar lo aprendido a notas y delegar exploraciones a subagentes. El usuario hace `/clear` entre hitos.
- Mantené `PROGRESS.md`: hito actual, qué está hecho y verificado, qué sigue, decisiones y su motivo, bloqueos, pedidos a la otra sesión. Actualizalo en cada commit.
- Mantené **notas de contexto** en `docs/context/`: archivos `.md` cortos y atómicos (uno por tema: modelo de datos, decisiones de UI, convenciones, riesgos) enlazados entre sí con links relativos y un `docs/context/README.md` como índice. Cuando una parte del trabajo termina, volcá lo importante ahí y seguí sin cargarlo en la conversación; releelo solo si lo necesitás.
- Al retomar, **leé solo `CLAUDE.md`, `PROGRESS.md` y las notas que haga falta**, no todo el repo.

**Graphify** (grafo de conocimiento del código):
- Es una herramienta gratuita y de código abierto; el grafo del código se construye en local con tree-sitter, sin gastar tokens de modelo.
- **Cuándo:** después de H1, cuando ya hay código que valga la pena indexar. Antes, el repo es demasiado chico.
- **Cómo (pasos según documentación de terceros; verificá contra la documentación oficial y la versión instalada):** instalar la CLI, correr `graphify claude install` en el repo (agrega una sección en `CLAUDE.md` y un hook que le indica a Claude consultar el grafo antes de buscar) y `graphify hook install` (reconstruye el grafo en cada commit).
- **Verificación obligatoria:** hay reportes de que el hook previo a búsquedas falla en versiones recientes de Claude Code. Comprobá que funciona en la versión instalada. Si no, **plan B**: una instrucción fija en `CLAUDE.md` ("antes de buscar en el código, leé `graphify-out/GRAPH_REPORT.md`") y el hook de commit solo.
- **CONSULTAR** antes de instalarlo si implica cambiar configuración global del usuario (fuera del repo).

**Qué decidís vos y qué consultás:**
- Decidí solo: detalles de implementación, nombres, estructura interna, dependencias menores.
- **CONSULTAR siempre:** crear/borrar recursos externos, cualquier cosa que cueste dinero, cambios al modelo de §3, y todo lo irreversible (por ejemplo, hacer público el repo).
- Si algo es ambiguo y la diferencia es material, preguntá una vez, de forma concreta. Si no es material, elegí y anotá el supuesto en `PROGRESS.md`.

## 12. Definición de terminado de la v1

1. Los dos usuarios entran desde el celular (uno con iPhone, otro con Android o compu), cargan una visita con varios ítems y foto, y la ven desde el otro dispositivo.
2. Se ve la evolución del puntaje de un ítem entre visitas.
3. El mapa muestra los lugares y abre Google Maps; hay lista de "quiero ir" y de "los de siempre".
4. Hay estadísticas: más visitados del mes y ranking propio.
5. CI en verde; RLS verificada; ningún secreto en el repo ni en su historial.
6. README con: cómo correrlo, cómo instalarlo en iPhone y Android, cómo cambiar la escala de puntaje, cómo rehacer la interfaz (qué carpeta tocar y cuál no).

## 13. Entrega final

Al terminar cada hito (y al final), reportá: qué quedó hecho y verificado (con el comando o prueba que lo demuestra), qué quedó sin verificar y por qué, decisiones que tomaste, qué le toca hacer al usuario y qué viene después.
