import { describe, expect, it } from 'vitest';
import { GeocodingError } from './geocoder';
import { NominatimGeocoder } from './nominatimGeocoder';

function setup(respond: () => Response | Promise<Response>) {
  const calls: string[] = [];
  const waits: number[] = [];
  let clock = 1_000_000;
  const geocoder = new NominatimGeocoder({
    fetch: async (input) => {
      calls.push(String(input));
      return respond();
    },
    now: () => clock,
    wait: async (ms) => {
      waits.push(ms);
      clock += ms;
    },
  });
  return { geocoder, calls, waits, advance: (ms: number) => (clock += ms) };
}

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe('NominatimGeocoder', () => {
  it('maps results and biases the search to Córdoba, Argentina', async () => {
    const { geocoder, calls } = setup(() =>
      json([
        { lat: '-31.4215', lon: '-64.1820', display_name: 'Paraná, Nueva Córdoba, Córdoba' },
        { lat: 'x', lon: '0', display_name: 'broken row' },
      ]),
    );

    expect(await geocoder.search('  Illia y   Paraná ')).toEqual([
      { lat: -31.4215, lng: -64.182, label: 'Paraná, Nueva Córdoba, Córdoba' },
    ]);
    const url = new URL(calls[0]!);
    expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/search');
    expect(url.searchParams.get('q')).toBe('Illia y Paraná');
    expect(url.searchParams.get('countrycodes')).toBe('ar');
    expect(url.searchParams.get('viewbox')).toBeTruthy();
  });

  it('does not call the server for an empty query', async () => {
    const { geocoder, calls } = setup(() => json([]));
    expect(await geocoder.search('   ')).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('spaces requests at least one second apart', async () => {
    const { geocoder, calls, waits, advance } = setup(() => json([]));

    await Promise.all([geocoder.search('a'), geocoder.search('b')]);
    expect(calls).toHaveLength(2);
    expect(waits).toEqual([1100]);

    advance(5000);
    await geocoder.search('c');
    expect(waits).toEqual([1100]);
  });

  it('turns failures into a message for the user and keeps working afterwards', async () => {
    let fail = true;
    const { geocoder } = setup(() => (fail ? new Response('', { status: 503 }) : json([])));

    await expect(geocoder.search('a')).rejects.toBeInstanceOf(GeocodingError);
    fail = false;
    expect(await geocoder.search('b')).toEqual([]);
  });
});
