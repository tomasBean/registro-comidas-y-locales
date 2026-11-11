# BRIEF — Libreta de comidas (borrador v0.1)

> Documento para el agente que construye la app. Es autocontenido: no hace falta contexto previo.
> Lo que está marcado como **DEFAULT** es una decisión ya tomada. Lo marcado como **CONSULTAR** exige parar y preguntar al usuario antes de actuar.

## 1. Qué es y para quién

Una app personal para que dos personas (Tomás y su novia) registren los lugares donde comen y **qué piden en cada visita**, con puntaje, precio, comentario y foto, para tener referencia futura. La idea de producto es "Letterboxd para lugares de comida": diario de lo que probaron + lista de pendientes ("quiero ir") + mapa.

- Uso personal, no comercial. Hoy: 2 usuarios. Mañana, quizá amigos: **diseñá los datos para que sea posible sumar gente después, pero no construyas nada social ahora**.
- Uso principal: **celular, en el momento** (recién comieron, cargan en 20 segundos). Secundario: compu, para mirar el historial.
- Ciudad de uso: Córdoba, Argentina. Idioma de la interfaz: **español rioplatense (es-AR)**. Moneda: **pesos argentinos (ARS)**.
- El código, los identificadores y los comentarios van en inglés. Todo texto visible al usuario va en español.

## 2. Caso de uso que define el modelo de datos

Lo importante es que **el mismo plato se pide muchas veces y su calidad cambia**:

- Panadería *Rondó* (Nueva Córdoba): compran chipá casi siempre, casi siempre 4 puntos; la última vez, 1,5.
- Hamburguesería *Albuche* (esquina Illia y Paraná, Nueva Córdoba): siempre piden la triple customizada (eligen toppings); a veces estuvo mejor, a veces peor.
- Cabaña *Chamigo* (Belgrano y otra calle; dirección a completar): 3 chipá, $6.000 en total, entre 3,5 y 4.

Por eso el modelo separa **el plato** (existe una vez por lugar) de **cada vez que se probó** (una por visita), y la app tiene que mostrar la evolución del puntaje de un plato en el tiempo.

## 3. Modelo de dominio

| Entidad | Qué es | Campos clave |
|---|---|---|
| `Place` (lugar) | Un local | nombre, tipo (panadería, hamburguesería…), dirección (texto libre), lat/lng (opcionales), `status`: `visited` \| `wishlist`, notas |
| `Item` (ítem) | Un plato/producto *de un lugar* | `place_id`, nombre ("Chipá", "Triple customizada"), `category` (etiqueta normalizada: "chipá", "hamburguesa"…) |
| `Visit` (visita) | Una ocasión en un lugar | `place_id`, fecha (default hoy), nota general |
| `Tasting` (degustación) | Un ítem probado en una visita | `visit_id`, `item_id`, `rating`, `price_total` (ARS enteros), `quantity` (default 1), comentario, `would_reorder` (sí/no), foto (opcional), `created_by` |

Reglas:
- **Puntaje:** guardalo como entero 1–10 (pasos de media estrella) y **mostralo como 1–5 estrellas con medias**. La escala (rango y cómo se muestra) vive en **un solo archivo de configuración**: cambiarla a 0–10 tiene que ser trivial.
- Un puntaje por degustación (lo deciden entre los dos), con `created_by` registrado.
- **Ítems por categoría:** la categoría permite "mostrame todos los chipá" y "ítems similares" entre lugares. Autocompletá categorías ya usadas para no duplicar ("chipa" vs "chipá").
- `Place.status = wishlist` es la lista "quiero ir". Al registrar la primera visita pasa a `visited`.
- Todos los datos pertenecen a una **libreta** (`notebook`) con miembros (`notebook_members`). Hoy hay una libreta y dos miembros. Es la base para sumar amigos más adelante sin migrar todo.

## 4. Funcionalidades de la v1

1. **Registrar visita (el flujo principal, optimizalo):** elegir un lugar existente o crear uno → fecha → agregar ítems (autocompletar con los ítems previos de ese lugar) con puntaje, precio, cantidad, comentario, "¿volvería a pedirlo?" y foto. Pensado para pocos toques y con una mano.
2. **Ficha de lugar:** promedio, historial de visitas, y por cada ítem su **evolución de puntajes** (por ejemplo una línea/sparkline o lista cronológica) y su último puntaje destacado.
3. **Ficha de ítem:** todas las veces que se probó, con fecha, puntaje, precio y comentario.
4. **Quiero ir:** guardar un lugar sin visita (con nota: "probar la milanesa").
5. **Mapa:** pines de lugares con ubicación; distinguir visitados / quiero ir; filtrar por categoría de ítem y por puntaje mínimo; tocar un pin abre la ficha. En cada lugar, botón **"Abrir en Google Maps"** (ver §6).
6. **Búsqueda:** por texto sobre lugares e ítems. "Ítems similares": desde un ítem, ver la misma categoría en otros lugares.
7. **Fotos:** desde cámara o galería, **comprimidas en el cliente** (lado mayor ≤ 1600 px, JPEG ~0,8) antes de subir.
8. **Acceso:** login con dos cuentas; los dos ven y editan lo mismo.

**Fuera de alcance en la v1** (no lo construyas): funciones sociales o seguir amigos, recomendaciones con IA, cola de escritura offline, importar de Google, notificaciones, reseñas públicas, varios idiomas.

## 5. Arquitectura (modular a propósito)

La interfaz se va a rehacer varias veces. **Cambiar el diseño no debe tocar la lógica.**

```
src/
  domain/     tipos, reglas puras (promedios, evolución, normalización de categorías), SIN dependencias de React ni de Supabase
  data/       interfaz Repository + implementaciones: memory/ (datos de ejemplo) y supabase/
  features/   hooks y pantallas por funcionalidad (visit-form, place, map, wishlist, search)
  ui/         componentes presentacionales sin lógica de datos + theme/ (tokens de diseño)
  config/     escala de puntaje, locale, constantes
supabase/migrations/   SQL versionado
```

- **Tokens de diseño** (colores, tipografía, espaciados, radios) como variables CSS en un único archivo. Sin kits de UI pesados. **DEFAULT:** CSS Modules + variables CSS.
- **DEFAULT stack:** Vite + React + TypeScript, `vite-plugin-pwa`, React Router, `@supabase/supabase-js`, Leaflet (con `react-leaflet`). Pocas dependencias; justificá en el README cualquier otra que agregues.
- La app **tiene que correr y poder verificarse sin backend** usando `data/memory` con los datos de ejemplo (§9). Supabase se enchufa detrás de la misma interfaz.
- Sin conexión: el *shell* de la app carga (PWA); la escritura sin red muestra un error claro. No hay cola offline en la v1.

## 6. Mapa y Google Maps

- **DEFAULT:** mapa con **Leaflet + OpenStreetMap**, sin claves ni costo. Google Places exige una cuenta de facturación y no es necesario para esta función.
- **Alta de ubicación de un lugar**, de más cómoda a menos:
  1. Botón **"Estoy acá"** (geolocalización del dispositivo) al registrar una visita en el lugar.
  2. Buscar una dirección con **Nominatim o Photon** (sin autocompletado por tecla; respetá la política de uso: máx. 1 pedido/seg, y mostrá resultados al enviar).
  3. Tocar el mapa para ubicar o ajustar el pin a mano.
  4. Un lugar puede quedar sin coordenadas y seguir funcionando (aparece en listas, no en el mapa).
- **"Abrir en Google Maps":** armá un link de búsqueda con nombre + dirección o lat/lng (`https://www.google.com/maps/search/?api=1&query=...`). No usa API ni clave.
- Encapsulá la geocodificación detrás de una interfaz `Geocoder` para poder cambiar de proveedor después.

## 7. Backend (Supabase) y configuración externa

- Migraciones SQL en `supabase/migrations/`, con **Row Level Security** en todas las tablas: un usuario solo accede a datos de las libretas de las que es miembro.
- **Fotos:** bucket privado de Storage con políticas por libreta y URLs firmadas. Guardá en la base la ruta, no la URL.
- **Auth:** email + contraseña (o magic link) para los dos usuarios. Una vez creadas las dos cuentas, **desactivá el registro público**: la clave `anon` va dentro del bundle y es pública por diseño; la seguridad la dan RLS y el cierre de registros.
- **Secretos:** nunca al repo. `.env.local` en `.gitignore`; el repo solo trae `.env.example`. Al build solo van la URL del proyecto y la clave `anon`.

### Fase de credenciales (hacela primero, en un solo mensaje)

Para que el trabajo no se corte a la mitad, **antes de escribir código pedí todo lo externo junto**: qué token o clave necesitás, para qué, y qué pasos manuales le toca hacer al usuario. Después seguí de corrido.
- Intentá automatizar con la CLI de Supabase (`supabase projects create`, `db push`, etc.) usando un token personal que te pase el usuario como variable de entorno. Si no se puede automatizar algo, **no bloquees todo**: avanzá con `data/memory`, dejá `docs/SETUP_SUPABASE.md` con los pasos exactos y retomá cuando esté listo.
- **CONSULTAR** antes de crear un proyecto de Supabase: la cuenta gratuita permite 2 proyectos activos y el usuario ya usa 1. Confirmá que usa el segundo.

## 8. Despliegue

- **Repo privado.** GitHub Pages no sirve páginas desde repos privados en el plan gratuito. **DEFAULT:** **Cloudflare Pages** conectado al repo (build `npm run build`, salida `dist/`), con deploy automático al hacer push a `main`. Dejá `docs/DEPLOY.md` con los pasos exactos que le tocan al usuario y un archivo `public/_redirects` para el enrutado SPA.
- Es una app estática (archivos HTML/JS/CSS) que habla con Supabase desde el navegador; por eso se puede alojar como estática.
- **GitHub Actions** solo para CI: lint, typecheck, tests y build en cada PR.

## 9. Datos de ejemplo (seed) y criterio de aceptación

Cargá estos datos en `data/memory` y en un `supabase/seed.sql` aparte, marcado como "solo desarrollo". Son ilustrativos; el usuario ajusta los valores reales.

- **Rondó** — panadería, Nueva Córdoba. Ítem "Chipá" (categoría chipá): 3 visitas con 4 puntos y una última con 1,5.
- **Albuche** — hamburguesería, esquina Illia y Paraná. Ítem "Triple customizada" (categoría hamburguesa): 3 visitas con puntajes distintos (por ejemplo 4,5 · 3 · 4), comentario con los toppings.
- **Cabaña Chamigo** — dirección Belgrano y calle a completar. Ítem "Chipá" (categoría chipá), 3 unidades, $6.000 en total, 3,5.

Con eso se tiene que poder demostrar: "los chipá de los tres lugares, comparados", "cómo evolucionó la triple de Albuche" y "el chipá de Rondó bajó de 4 a 1,5".

## 10. Experiencia y diseño

- **Mobile-first**, tocable con una mano, zonas táctiles ≥ 44 px, respetar *safe areas* de iPhone. Se ve bien en compu, pero el celular manda.
- Estética **simple y cálida** (es comida): paleta cálida, tipografía legible, mucho aire, fotos protagonistas. **Todavía no hay referencia visual**: hacé algo sobrio y neutro, sin casarte con un estilo; la identidad se define en una iteración posterior.
- Formatos es-AR: `$ 6.000`, fechas `dd/mm/aaaa`, coma decimal en puntajes ("3,5").
- **PWA instalable en iPhone y Android:** manifest, íconos (incluido `apple-touch-icon`), meta tags de iOS. La novia usa iPhone: la instalación en iOS es por Safari → Compartir → "Agregar a pantalla de inicio". Documentalo en el README con pasos para ambos sistemas.
- **Fotos en iOS:** usá `<input type="file" accept="image/*">` (que ofrece cámara o galería). `capture` y las apps instaladas en pantalla de inicio de iOS tienen antecedentes de fallas intermitentes con la cámara: **no declares que funciona sin verificarlo**; dejá el flujo de foto con un camino de respaldo (galería) y anotá en el README qué hay que probar en un iPhone real.

## 11. Cómo trabajar

**Hitos** (cada uno cierra por sus criterios de salida, no por tareas hechas):

| # | Hito | Criterio de salida |
|---|---|---|
| H0 | Andamiaje: estructura, tooling, CI, PWA mínima, tokens de diseño, `PROGRESS.md`, README | `npm run lint`, `typecheck`, `test` y `build` pasan; la app abre vacía en el celular (emulado) |
| H1 | Dominio + repositorio en memoria + seeds | Tests de dominio verdes con los tres casos de §9 |
| H2 | UI núcleo: registrar visita, ficha de lugar, ficha de ítem | Flujo completo funcionando sobre `data/memory`, verificado con Playwright en viewport móvil (Chromium **y WebKit**) |
| H3 | Supabase: migraciones, RLS, auth, repositorio real, fotos | Los mismos tests e2e pasan contra Supabase; RLS probada con un usuario ajeno |
| H4 | Mapa, quiero ir, búsqueda e ítems similares | Mapa con filtros; "Abrir en Google Maps" correcto |
| H5 | Despliegue y pulido PWA/iOS | `docs/DEPLOY.md` completo; checklist de pruebas en iPhone real en el README |

**Git:**
- Una rama por hito (`feat/h1-dominio`, …) y **un PR por hito** hacia `main`, con descripción de qué se hizo y cómo se verificó. Commits chicos y con mensaje claro.
- No hagas push directo a `main`, no reescribas historia compartida, no mergees tus propios PR (los mergea el usuario, en orden y con *merge commit*, no squash).
- Para no esperar merges: cada rama sale de la anterior, y el PR apunta a la rama anterior mientras no esté mergeada.

**Continuidad y consumo:** el usuario trabaja con límites de uso por ventana de 5 horas.
- Mantené `PROGRESS.md` en la raíz: hito actual, qué está hecho y verificado, qué sigue, decisiones tomadas y por qué, bloqueos. Actualizalo en cada commit.
- Mantené un `CLAUDE.md` corto con las convenciones del repo y la regla "leé `PROGRESS.md` primero". Al retomar, **leé solo `PROGRESS.md` y lo necesario para el siguiente paso**, no todo el repo.

**Qué decidís vos y qué consultás:**
- Decidí solo: detalles de implementación, nombres, estructura interna, dependencias menores.
- **CONSULTAR siempre:** crear/borrar recursos externos (proyecto de Supabase, dominio, deploys), cualquier cosa que cueste dinero, cambios al modelo de datos de §3, y todo lo irreversible.
- Si algo del brief es ambiguo y la diferencia es material, preguntá una vez, de forma concreta. Si no es material, elegí, y anotá el supuesto en `PROGRESS.md`.

## 12. Definición de terminado de la v1

1. Los dos usuarios entran desde el celular (uno con iPhone, otro con Android o compu), cargan una visita con foto y la ven desde el otro dispositivo.
2. Se ve la evolución del puntaje de un ítem entre visitas.
3. El mapa muestra los lugares y abre Google Maps.
4. CI en verde; RLS verificada; ningún secreto en el repo.
5. README con: cómo correrlo, cómo instalarlo en iPhone y Android, cómo cambiar la escala de puntaje, cómo rehacer la interfaz (qué carpeta tocar y cuál no).

## 13. Entrega final

Al terminar cada hito (y al final), reportá: qué quedó hecho y verificado (con el comando o prueba que lo demuestra), qué quedó sin verificar y por qué, decisiones que tomaste, qué le toca hacer al usuario y qué viene después.
