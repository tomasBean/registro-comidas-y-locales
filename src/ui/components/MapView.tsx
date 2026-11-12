import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import styles from './MapView.module.css';

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface MapPin extends MapPoint {
  id: string;
  /** Accessible name and tooltip. */
  label: string;
  tone: 'regular' | 'visited' | 'wishlist';
}

interface MapViewProps {
  label: string;
  /** Where the map opens when there are no pins or selection. */
  fallbackCenter: MapPoint;
  pins?: MapPin[];
  onPinClick?: (id: string) => void;
  /** Picker mode: one movable marker. Tapping the map or dragging it calls `onSelect`. */
  selected?: MapPoint | null;
  onSelect?: (point: MapPoint) => void;
  height?: string;
}

const PIN_SIZE = 40;

function pinIcon(tone: string): L.DivIcon {
  return L.divIcon({
    className: `${styles.pin} ${styles[tone] ?? ''}`,
    html: '<span></span>',
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
  });
}

/** Keeps the view on what matters: the selection, or all the pins. */
function Viewport({ pins, selected }: { pins: MapPin[]; selected: MapPoint | null | undefined }) {
  const map = useMap();
  const pinsKey = pins.map((pin) => `${pin.id}:${pin.lat},${pin.lng}`).join('|');
  const selectedKey = selected ? `${selected.lat},${selected.lng}` : '';

  useEffect(() => {
    if (selected) {
      map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 16));
    } else if (pins.length === 1) {
      map.setView([pins[0]!.lat, pins[0]!.lng], 16);
    } else if (pins.length > 1) {
      map.fitBounds(L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng])), { padding: [32, 32], maxZoom: 16 });
    }
    // Keys stand in for the arrays so the view only moves when the data does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pinsKey, selectedKey]);
  return null;
}

function ClickToSelect({ onSelect }: { onSelect: (point: MapPoint) => void }) {
  useMapEvents({ click: (event) => onSelect({ lat: event.latlng.lat, lng: event.latlng.lng }) });
  return null;
}

/** Leaflet map on OpenStreetMap tiles. Shows pins, or lets the user place one. */
export function MapView({ label, fallbackCenter, pins = [], onPinClick, selected, onSelect, height = '50dvh' }: MapViewProps) {
  const icons = useMemo(
    () => ({ regular: pinIcon('regular'), visited: pinIcon('visited'), wishlist: pinIcon('wishlist'), selected: pinIcon('selected') }),
    [],
  );
  return (
    <div className={styles.frame} style={{ height }} role="region" aria-label={label}>
      <MapContainer
        center={[fallbackCenter.lat, fallbackCenter.lng]}
        zoom={13}
        className={styles.map}
        // One finger scrolls the page; the map still pans by dragging.
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        <Viewport pins={pins} selected={selected} />
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={icons[pin.tone]}
            title={pin.label}
            alt={pin.label}
            eventHandlers={onPinClick ? { click: () => onPinClick(pin.id) } : undefined}
          />
        ))}
        {onSelect ? <ClickToSelect onSelect={onSelect} /> : null}
        {selected ? (
          <Marker
            position={[selected.lat, selected.lng]}
            icon={icons.selected}
            title="Ubicación elegida"
            alt="Ubicación elegida"
            draggable={Boolean(onSelect)}
            eventHandlers={
              onSelect
                ? {
                    dragend: (event) => {
                      const position = (event.target as L.Marker).getLatLng();
                      onSelect({ lat: position.lat, lng: position.lng });
                    },
                  }
                : undefined
            }
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
