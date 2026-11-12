# Pruebas y verificación

Qué se prueba dónde y qué queda para probar a mano. Actualizado: 2026-11-11 (H0).

- **Unitarias (Vitest):** `src/**/*.test.ts`. Toda la lógica de `domain/` y `config/`.
- **E2E (Playwright):** `e2e/`, proyectos `chromium-mobile` (Pixel 7) y `webkit-mobile` (iPhone 14).
- **En la nube solo hay Chromium.** Ahí se corre `npm run e2e -- --project=chromium-mobile`. WebKit se verifica únicamente en CI (GitHub Actions). No declarar WebKit verificado sin mirar el job de CI.
- **WebKit de Playwright no es Safari de iOS:** no cubre instalación en pantalla de inicio, cámara ni safe areas reales. Eso va al checklist manual en iPhone (README, hito H6).

## Checklist manual en iPhone (se va completando por hito)

- [ ] H0: la app abre en Safari, respeta el notch y la barra inferior, y se puede agregar a pantalla de inicio con su ícono.

Relacionado: [andamiaje y tooling](andamiaje-y-tooling.md).
