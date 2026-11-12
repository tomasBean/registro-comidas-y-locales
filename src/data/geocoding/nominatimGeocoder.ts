import { isValidCoordinates } from '../../domain/maps';
import { cleanText } from '../../domain/text';
import { GeocodingError } from './geocoder';
import type { GeocodeResult, Geocoder } from './geocoder';

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
/** Usage policy of the public Nominatim server: at most one request per second. */
const MIN_INTERVAL_MS = 1100;
/** Rough box around Córdoba capital (west, north, east, south): results inside rank first. */
const CORDOBA_VIEWBOX = '-64.35,-31.28,-64.05,-31.52';

export interface NominatimOptions {
  fetch?: typeof fetch;
  now?: () => number;
  wait?: (ms: number) => Promise<void>;
}

interface NominatimRow {
  lat?: string;
  lon?: string;
  display_name?: string;
}

/**
 * Geocoder on the public Nominatim (OpenStreetMap) server. No key, no cost.
 * Call it when the user submits a search, never per keystroke.
 */
export class NominatimGeocoder implements Geocoder {
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly wait: (ms: number) => Promise<void>;
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = -Infinity;

  constructor(options: NominatimOptions = {}) {
    this.fetch = options.fetch ?? ((...args) => fetch(...args));
    this.now = options.now ?? (() => Date.now());
    this.wait = options.wait ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  search(query: string): Promise<GeocodeResult[]> {
    const text = cleanText(query);
    if (!text) return Promise.resolve([]);
    // Requests run one after another, spaced out, even if the user taps twice.
    const run = this.queue.then(() => this.request(text));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async request(text: string): Promise<GeocodeResult[]> {
    const elapsed = this.now() - this.lastRequestAt;
    if (elapsed < MIN_INTERVAL_MS) await this.wait(MIN_INTERVAL_MS - elapsed);
    this.lastRequestAt = this.now();

    const params = new URLSearchParams({
      format: 'jsonv2',
      q: text,
      limit: '5',
      countrycodes: 'ar',
      viewbox: CORDOBA_VIEWBOX,
      'accept-language': 'es',
    });
    let rows: unknown;
    try {
      const response = await this.fetch(`${ENDPOINT}?${params}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      rows = await response.json();
    } catch (cause) {
      throw new GeocodingError('No pudimos buscar la dirección. Probá de nuevo o ubicá el pin a mano.', { cause });
    }
    if (!Array.isArray(rows)) return [];
    return (rows as NominatimRow[])
      .map((row) => ({ lat: Number(row.lat), lng: Number(row.lon), label: row.display_name ?? '' }))
      .filter((result) => result.label !== '' && isValidCoordinates(result));
  }
}
