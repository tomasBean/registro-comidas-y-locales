import { RepositoryError } from '../../data';
import { ImageError } from '../photos/compressImage';

/** Text for the user when something fails. Never shows technical details. */
export function errorMessage(error: unknown): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'No hay conexión. Lo que cargaste no se guardó: probá de nuevo cuando vuelva.';
  }
  if (error instanceof RepositoryError || error instanceof ImageError) return error.message;
  return 'Algo salió mal. Probá de nuevo.';
}
