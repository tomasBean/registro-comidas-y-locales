# Libreta de comidas

App personal (PWA) para registrar los lugares donde comemos y qué pedimos en cada visita (puntaje, precio, comentario, foto), con mapa, lista de "quiero ir" y ranking propio.

**Estado:** la app funciona completa con datos de ejemplo en memoria. Falta conectar el backend (Supabase), así que por ahora los cambios se pierden al recargar. Ver `PROGRESS.md`.

## Cómo correrlo

Requiere Node 22 o superior.

```bash
npm install
npm run dev        # servidor de desarrollo
npm run check      # lint + typecheck + tests + build
npm run e2e        # pruebas de punta a punta (Playwright, viewport móvil)
```

La app se sirve bajo `/registro-comidas-y-locales/` (la ruta que usa GitHub Pages).

Para `npm run e2e` hacen falta los navegadores de Playwright: `npx playwright install chromium webkit`. Con solo Chromium: `npm run e2e -- --project=chromium-mobile`.

Publicación: ver `docs/DEPLOY.md`.

## Instalarla en el celular

La app se instala desde el navegador, sin tienda de aplicaciones.

**iPhone (Safari):**

1. Abrir la dirección de la app en **Safari**. Desde otros navegadores puede no aparecer la opción.
2. Tocar el botón **Compartir** (el cuadrado con la flecha hacia arriba).
3. Elegir **"Agregar a pantalla de inicio"** y confirmar.
4. Abrirla desde el ícono nuevo: se ve a pantalla completa, sin barra de Safari.

**Android (Chrome):**

1. Abrir la dirección de la app en **Chrome**.
2. Tocar el menú de los tres puntos.
3. Elegir **"Instalar app"** o **"Agregar a pantalla principal"** y confirmar.

## Qué probar en un iPhone real

Nada de esto se pudo verificar desde el entorno de desarrollo. Las pruebas automáticas corren en WebKit de escritorio, que no es Safari de iOS. Marcar cada punto después de probarlo.

Instalación y aspecto:

- [ ] La app abre en Safari y se puede agregar a pantalla de inicio, con su ícono y el nombre "Libreta".
- [ ] Abierta desde el ícono, ocupa toda la pantalla y el contenido no queda tapado por el notch ni por la barra inferior.
- [ ] Con el celular en modo avión, la app instalada abre igual (muestra los datos de ejemplo).

Formulario de visita:

- [ ] "Agregar foto" ofrece **cámara y galería**.
- [ ] Sacar una foto con la **cámara desde la app instalada** deja la vista previa. Repetir tres o cuatro veces: hay antecedentes de fallas intermitentes de la cámara en apps instaladas en iOS.
- [ ] Si la cámara falla, elegir la foto desde la **galería** funciona (es el respaldo previsto).
- [ ] Las estrellas se tocan cómodas con el pulgar y marcan medias.
- [ ] Al tocar un campo de texto, Safari no hace zoom.
- [ ] El selector de fecha muestra dd/mm/aaaa.

Mapa y ubicación:

- [ ] El mapa carga y se mueve con un dedo sin trabar el scroll de la página.
- [ ] "Estoy acá" pide permiso de ubicación y deja el pin donde corresponde.
- [ ] Buscar una dirección real de Córdoba devuelve resultados.
- [ ] "Abrir en Google Maps" abre Google Maps en el lugar correcto.

## Estructura

```
src/
  domain/     reglas puras y tipos (sin React ni Supabase)
  data/       interfaz Repository + implementaciones (memory, supabase) y geocodificación
  features/   pantallas y hooks por funcionalidad
  ui/         componentes presentacionales + theme/ (tokens de diseño)
  config/     escala de puntaje, locale, constantes
e2e/          pruebas de Playwright
```

ESLint impide que una capa importe de las que tiene arriba (por ejemplo, `ui/` no puede importar de `data/`).

## Cómo cambiar la escala de puntaje

Todo vive en `src/config/rating.ts`. El puntaje se guarda como entero de 1 a 10 y se muestra dividido por `displayDivisor` (hoy 2, o sea 1 a 5 estrellas con medias). Para mostrar 0–10, poné `displayDivisor: 1` y `displayMax: 10`.

El filtro de puntaje mínimo del mapa tiene sus opciones en `src/features/map/MapScreen.tsx` (`MIN_RATING_OPTIONS`), en la escala guardada.

## Cómo rehacer la interfaz

- **Tocar:** `src/ui/theme/tokens.css` (colores, tipografía, espaciados, radios), `src/ui/` (componentes) y las pantallas de `src/features/`.
- **No tocar:** `src/domain/` ni `src/data/`. La lógica y los datos no dependen del diseño.

Cambiar solo `tokens.css` alcanza para otra paleta y otra tipografía. Los íconos se regeneran con `npm run icons` después de editar `scripts/generate-icons.mjs`.

## Dependencias

Las del brief: Vite, React, TypeScript, `vite-plugin-pwa`, React Router, Leaflet y `react-leaflet`. Se suman las de calidad: ESLint con `typescript-eslint`, Vitest y Playwright. `@playwright/test` está fijado en una versión exacta para que coincida con los navegadores instalados. `@supabase/supabase-js` se agrega cuando se integre el backend.

## Documentos

- `BRIEF.md` — qué hay que construir y cómo trabajar.
- `BRIEF-SUPABASE.md` — configuración del backend (sesión aparte).
- `PROGRESS.md` — estado vivo del proyecto.
- `CLAUDE.md` — convenciones y reglas para el agente.
- `docs/DEPLOY.md` — pasos para publicar en GitHub Pages.
- `docs/context/` — notas de contexto enlazadas.
