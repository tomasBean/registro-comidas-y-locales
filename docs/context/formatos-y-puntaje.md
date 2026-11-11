# Formatos y escala de puntaje

Dónde viven los formatos es-AR y la escala. Actualizado: 2026-11-11 (H0).

- **Escala:** `src/config/rating.ts`. Guardado entero 1–10; mostrado `stored / displayDivisor` (2) con coma decimal. Los promedios se calculan sobre el valor guardado y se convierten al mostrar.
- **Precio:** `formatPrice` en `src/config/locale.ts`, pesos enteros (`$ 6.000`). `Intl` separa el símbolo con un espacio duro (U+00A0); los tests lo normalizan.
- **Fechas:** las fechas de calendario viajan como texto ISO (`2026-11-11`) y `formatDate` las convierte a `dd/mm/aaaa` sin pasar por `Date`, para que no se corran de día por zona horaria.

Relacionado: [andamiaje y tooling](andamiaje-y-tooling.md).
