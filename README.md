# Libreta de comidas

App personal (PWA) para registrar los lugares donde comemos y qué pedimos en cada visita (puntaje, precio, comentario, foto), con mapa, lista de "quiero ir" y ranking propio.

**Estado:** en construcción. Ver `PROGRESS.md` para el hito actual.

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

## Estructura

```
src/
  domain/     reglas puras y tipos (sin React ni Supabase)
  data/       interfaz Repository + implementaciones (memory, supabase)
  features/   pantallas y hooks por funcionalidad
  ui/         componentes presentacionales + theme/ (tokens de diseño)
  config/     escala de puntaje, locale, constantes
e2e/          pruebas de Playwright
```

ESLint impide que una capa importe de las que tiene arriba (por ejemplo, `ui/` no puede importar de `data/`).

## Cómo cambiar la escala de puntaje

Todo vive en `src/config/rating.ts`. El puntaje se guarda como entero de 1 a 10 y se muestra dividido por `displayDivisor` (hoy 2, o sea 1 a 5 estrellas con medias). Para mostrar 0–10, poné `displayDivisor: 1` y `displayMax: 10`.

## Cómo rehacer la interfaz

- **Tocar:** `src/ui/` (componentes) y, sobre todo, `src/ui/theme/tokens.css` (colores, tipografía, espaciados, radios). Las pantallas están en `src/features/`.
- **No tocar:** `src/domain/` ni `src/data/`. La lógica y los datos no dependen del diseño.

## Instalarla en el celular

> Se completa en el hito H6, junto con el checklist de pruebas en iPhone real.

- **iPhone:** abrir la app en Safari → Compartir → "Agregar a pantalla de inicio".
- **Android:** abrir la app en Chrome → menú → "Instalar app" o "Agregar a pantalla principal".

## Dependencias

Las del brief (Vite, React, TypeScript, `vite-plugin-pwa`, React Router) más las de calidad: ESLint con `typescript-eslint`, Vitest y Playwright. `@playwright/test` está fijado en una versión exacta para que coincida con los navegadores instalados.

## Documentos

- `BRIEF.md` — qué hay que construir y cómo trabajar.
- `BRIEF-SUPABASE.md` — configuración del backend (sesión aparte).
- `PROGRESS.md` — estado vivo del proyecto.
- `CLAUDE.md` — convenciones y reglas para el agente.
- `docs/context/` — notas de contexto enlazadas.
