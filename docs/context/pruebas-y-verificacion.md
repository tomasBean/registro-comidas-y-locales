# Pruebas y verificación

Qué se prueba dónde y qué queda para probar a mano. Actualizado: 2026-11-11 (H0).

- **Unitarias (Vitest):** `src/**/*.test.ts`. Toda la lógica de `domain/` y `config/`.
- **E2E (Playwright):** `e2e/`, proyectos `chromium-mobile` (Pixel 7) y `webkit-mobile` (iPhone 14).
- `e2e/visit-flow.spec.ts` cubre el flujo de H2 sobre `data/memory`. Los datos se reinician al recargar, así que cada prueba arranca igual.
- **En la nube solo hay Chromium.** Ahí se corre `npm run e2e -- --project=chromium-mobile`. WebKit se verifica únicamente en CI (GitHub Actions). No declarar WebKit verificado sin mirar el job de CI.
- **WebKit de Playwright no es Safari de iOS:** no cubre instalación en pantalla de inicio, cámara ni safe areas reales. Eso va al checklist manual en iPhone (README, hito H6).

## Checklist manual en iPhone (se va completando por hito)

- [ ] H0: la app abre en Safari, respeta el notch y la barra inferior, y se puede agregar a pantalla de inicio con su ícono.

- [ ] H2: en el formulario de visita, "Agregar foto" ofrece cámara y galería; sacar una foto con la cámara desde la app instalada en pantalla de inicio y confirmar que queda la vista previa. Repetir desde la galería.
- [ ] H2: las estrellas se pueden tocar con el pulgar y marcan medias; al enfocar un campo de texto Safari no hace zoom.
- [ ] H2: el selector de fecha nativo muestra dd/mm/aaaa.

Relacionado: [andamiaje y tooling](andamiaje-y-tooling.md).
