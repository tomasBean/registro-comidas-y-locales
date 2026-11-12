import { useState } from 'react';
import type { Coordinates } from '../../domain/maps';
import { Button } from '../../ui/components/Button';
import { Notice } from '../../ui/components/Notice';
import { currentPosition, LocationError } from './currentPosition';

interface LocateButtonProps {
  label?: string;
  onLocated: (coordinates: Coordinates) => void | Promise<void>;
}

/** Button that reads the device position and reports problems inline. */
export function LocateButton({ label = 'Estoy acá', onLocated }: LocateButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function locate() {
    setBusy(true);
    setError(null);
    try {
      await onLocated(await currentPosition());
    } catch (cause) {
      setError(cause instanceof LocationError ? cause.message : 'No pudimos guardar la ubicación. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => void locate()} disabled={busy}>
        {busy ? 'Buscando tu ubicación…' : label}
      </Button>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </>
  );
}
