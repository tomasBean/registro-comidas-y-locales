import { useState } from 'react';
import type { GeocodeResult } from '../../data';
import { GeocodingError } from '../../data';
import { DEFAULT_MAP_CENTER } from '../../domain/maps';
import type { Coordinates } from '../../domain/maps';
import { Button } from '../../ui/components/Button';
import { TextField } from '../../ui/components/Field';
import { MapView } from '../../ui/components/MapView';
import { Notice } from '../../ui/components/Notice';
import { useData } from '../app/DataProvider';
import { LocateButton } from '../location/LocateButton';
import styles from './PlaceForm.module.css';

interface LocationEditorProps {
  value: Coordinates | null;
  onChange: (value: Coordinates | null) => void;
  /** Prefills the address search. */
  address: string;
}

/** The three ways to place a pin: current position, address search, tapping the map. */
export function LocationEditor({ value, onChange, address }: LocationEditorProps) {
  const { geocoder } = useData();
  const [query, setQuery] = useState<string | null>(null);
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = query ?? address;

  async function searchAddress() {
    if (!text.trim()) return;
    setSearching(true);
    setError(null);
    try {
      setResults(await geocoder.search(text));
    } catch (cause) {
      setResults(null);
      setError(cause instanceof GeocodingError ? cause.message : 'No pudimos buscar la dirección.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <fieldset className={styles.location}>
      <legend className={styles.legend}>Ubicación</legend>
      <p className={styles.muted}>
        {value
          ? 'Ubicación guardada. Tocá el mapa o arrastrá el pin para ajustarla.'
          : 'Sin ubicación: el lugar aparece en las listas, pero no en el mapa.'}
      </p>

      <LocateButton onLocated={onChange} />

      <div className={styles.searchRow}>
        <TextField
          label="Buscar dirección"
          placeholder="Calle y altura, Córdoba"
          value={text}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              // Inside the place form: search instead of submitting it.
              event.preventDefault();
              void searchAddress();
            }
          }}
          enterKeyHint="search"
          autoComplete="off"
        />
        <Button onClick={() => void searchAddress()} disabled={searching || !text.trim()}>
          {searching ? 'Buscando…' : 'Buscar'}
        </Button>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {results && results.length === 0 ? <Notice>No encontramos esa dirección. Ubicá el pin tocando el mapa.</Notice> : null}
      {results && results.length > 0 ? (
        <ul className={styles.results} aria-label="Resultados de la búsqueda">
          {results.map((result) => (
            <li key={`${result.lat},${result.lng},${result.label}`}>
              <button
                type="button"
                className={styles.result}
                onClick={() => {
                  onChange({ lat: result.lat, lng: result.lng });
                  setResults(null);
                }}
              >
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <MapView
        label="Mapa para ubicar el lugar"
        fallbackCenter={DEFAULT_MAP_CENTER}
        selected={value}
        onSelect={onChange}
        height="40dvh"
      />
      {value ? (
        <Button variant="ghost" onClick={() => onChange(null)}>
          Quitar ubicación
        </Button>
      ) : null}
    </fieldset>
  );
}
