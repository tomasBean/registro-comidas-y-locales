# Mapa y ubicación

Cómo funcionan el mapa, la geocodificación y el link a Google Maps. Actualizado: 2026-11-11 (H4).

- **Mapa:** Leaflet + teselas de OpenStreetMap, sin claves. Componente presentacional `ui/components/MapView.tsx` (pines o modo "elegir punto"). Pantalla en `features/map/`.
- **Pines:** un tipo por lugar (`pinKind` en `domain/maps.ts`): quiero ir, de siempre (marcado a mano) o visitado. Colores en `tokens.css` (`--color-pin-*`). Tocar un pin abre la ficha.
- **Filtros** (`filterPlacesForMap`): tipo de lugar, categoría de ítem y puntaje mínimo. Con categoría elegida, el puntaje mínimo se aplica al promedio de esa categoría en el lugar.
- **Lugares sin coordenadas:** aparecen en la lista de abajo del mapa y en las demás listas, no como pin.
- **Alta de ubicación** (`features/place-form/LocationEditor.tsx`): "Estoy acá" (geolocalización), buscar dirección, o tocar el mapa y arrastrar el pin. También hay "Estoy acá" al crear un lugar desde el formulario de visita y en la ficha de un lugar sin ubicación.
- **Geocodificación:** interfaz `Geocoder` en `data/geocoding/`. Implementación `NominatimGeocoder`: busca al enviar (nunca por tecla), espacia los pedidos 1,1 s, y prioriza Córdoba. Para cambiar de proveedor se cambia `createGeocoder()` en `data/index.ts`.
- **"Abrir en Google Maps"** (`googleMapsUrl`): link de búsqueda por nombre y dirección; si no hay dirección, por coordenadas. Sin API ni clave.
- **Coordenadas del seed:** son aproximadas, puestas a ojo dentro de Nueva Córdoba y Centro. No están relevadas.

## Sin verificar

Desde la sesión en la nube no hay acceso a `tile.openstreetmap.org` ni a `nominatim.openstreetmap.org`. Las pruebas e2e simulan ambos servicios. Falta ver las teselas reales y una búsqueda real de dirección desde un navegador con internet.

Relacionado: [decisiones de UI](decisiones-de-ui.md), [pruebas y verificación](pruebas-y-verificacion.md).
