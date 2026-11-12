# Andamiaje y tooling

Qué herramientas usa el repo y por qué quedaron así. Actualizado: 2026-11-11 (H0).

- **Stack:** Vite 8 + React 19 + TypeScript 6.0, `vite-plugin-pwa`, React Router 7 con `HashRouter`.
- **TypeScript queda en 6.0, no 7:** `typescript-eslint` 8 exige `<6.1`. Subir cuando lo soporte.
- **`@playwright/test` fijado en 1.63.0:** es la versión cuyo Chromium viene preinstalado en las sesiones en la nube. Si se sube, hay que reinstalar navegadores.
- **Un solo `tsconfig.json`** cubre `src`, `e2e`, `scripts` y los archivos de configuración.
- **Vitest** se configura dentro de `vite.config.ts` (entorno `node`). Cuando haya tests de componentes, sumar `jsdom` por archivo.
- **Capas:** ESLint (`no-restricted-imports` en `eslint.config.js`) impide importar hacia arriba: `domain`/`config` puros, `data` sin React, `ui` sin `data` ni `features`.
- **Base de Vite:** `/registro-comidas-y-locales/`. Los e2e corren contra `vite preview` del build real.
- **Íconos:** se generan con `npm run icons` (`scripts/generate-icons.mjs`, usa Chromium) y los PNG se commitean. Son provisorios hasta definir identidad.
- **CI** (`.github/workflows/ci.yml`): corre en todo PR. Un job de lint/typecheck/test/build y otro de e2e en Chromium y WebKit móviles. WebKit solo se prueba ahí; ver [pruebas y verificación](pruebas-y-verificacion.md).
- **Deploy** (`.github/workflows/deploy.yml`): al mergear a `main`, build y publicación en Pages con `actions/deploy-pages`. Recibe `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como variables del repo. No corrió nunca todavía.

Relacionado: [formatos y escala de puntaje](formatos-y-puntaje.md).
