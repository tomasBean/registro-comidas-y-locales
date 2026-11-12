import type { Coordinates } from '../../domain/maps';

export class LocationError extends Error {}

/** "Estoy acá": the device position, with messages the user can act on. */
export function currentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new LocationError('Este dispositivo no permite obtener la ubicación.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) =>
        reject(
          new LocationError(
            error.code === error.PERMISSION_DENIED
              ? 'No tenemos permiso para usar tu ubicación. Habilitalo en los ajustes del navegador o ubicá el pin a mano.'
              : 'No pudimos obtener tu ubicación. Probá de nuevo o ubicá el pin a mano.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  });
}
