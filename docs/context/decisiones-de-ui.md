# Decisiones de UI

Cómo está armada la interfaz y qué se decidió. Actualizado: 2026-11-11 (H2).

- **Navegación:** barra inferior fija (`ui/layout/BottomNav`) con Inicio, Lugares, Registrar (acción principal), Mapa y Resumen. Se arma en `src/App.tsx`.
- **Resumen** (`features/stats/`): cuatro bloques con sus propios selectores. Las pruebas e2e fijan la fecha con `page.clock` porque "este mes" depende del día.
- **Lugares:** una sola pantalla con buscador y tres vistas (Todos, De siempre, Quiero ir) en el parámetro `?ver=`. Evita sumar pestañas a la barra.
- **Borrados:** `ConfirmButton` pide confirmación en dos toques, sin diálogos del navegador.
- **Rutas** (`features/app/routes.ts`): `/`, `/places`, `/places/:id`, `/items/:id`, `/visits/new?place=:id`. Nadie arma URLs a mano.
- **Datos en pantalla:** `DataProvider` carga el `Dataset` una vez y lo comparte; después de escribir se llama `refresh()`. Las pantallas calculan con funciones de `domain/`. `LoadGate` resuelve cargando y error.
- **Formulario de visita** (`features/visit-form/`): el estado vive en `useVisitForm`; los componentes solo dibujan. Las fotos se comprimen al elegirlas y se suben recién al guardar (un lugar nuevo todavía no tiene id). Si falla el guardado después de crear el lugar, el formulario queda apuntando al lugar ya creado para no duplicarlo.
- **Puntaje:** `RatingInput` son radios nativos invisibles sobre las estrellas, dos zonas por estrella. Funciona con teclado y lector de pantalla sin código extra.
- **Sugerencias:** chips tocables en lugar de `<datalist>` (que en iOS es poco confiable).
- **Fotos:** `<input type="file" accept="image/*">` sin `capture`, para que el sistema ofrezca cámara o galería. Compresión en `features/photos/compressImage.ts` (canvas, JPEG).
- **Componentes de `ui/`:** no importan de `data/` ni `features/`; reciben todo por props. `BottomNav` recibe los links ya armados para no depender del router.
- **Campos de texto a 16 px** como mínimo: evita el zoom automático de Safari en iOS.

Relacionado: [modelo de datos](modelo-de-datos.md), [pruebas y verificación](pruebas-y-verificacion.md).
