# Pruebas y verificación

Qué se prueba dónde y qué queda para probar a mano. Actualizado: 2026-11-11 (H0).

- **Unitarias (Vitest):** `src/**/*.test.ts`. Toda la lógica de `domain/` y `config/`.
- **E2E (Playwright):** `e2e/`, proyectos `chromium-mobile` (Pixel 7) y `webkit-mobile` (iPhone 14).
- `e2e/visit-flow.spec.ts` cubre el flujo de H2 sobre `data/memory`. Los datos se reinician al recargar, así que cada prueba arranca igual.
- `e2e/map-and-lists.spec.ts` cubre H4. Simula las teselas y Nominatim (`mockMapServices`) para no pegarle a los servidores públicos.
- `e2e/offline.spec.ts` prueba que la app abra sin red. Es el único archivo que habilita el service worker; el resto corre con él bloqueado. Levanta su propio servidor con el build y lo apaga antes de recargar: los modos "sin conexión" simulados de Playwright (`setOffline`, `route.abort`) en WebKit bloquean la navegación antes de que responda el service worker.
- **En la nube solo hay Chromium.** Ahí se corre `npm run e2e -- --project=chromium-mobile`. WebKit se verifica únicamente en CI (GitHub Actions). No declarar WebKit verificado sin mirar el job de CI.
- **WebKit de Playwright no es Safari de iOS:** no cubre instalación en pantalla de inicio, cámara ni safe areas reales. Eso va al checklist manual del README.

## Checklist manual en iPhone

Vive en el `README.md`, sección "Qué probar en un iPhone real". Al sumar una función que dependa del dispositivo, agregar ahí su punto.

Relacionado: [andamiaje y tooling](andamiaje-y-tooling.md).
