import type { ReactNode } from 'react';
import type { Dataset } from '../../domain/types';
import { Button } from '../../ui/components/Button';
import { Notice } from '../../ui/components/Notice';
import { useData } from './DataProvider';

/** Renders its children once the notebook is loaded; otherwise a loading or error state. */
export function LoadGate({ children }: { children: (dataset: Dataset) => ReactNode }) {
  const { dataset, loadError, refresh } = useData();
  if (dataset) return <>{children(dataset)}</>;
  if (loadError) {
    return (
      <>
        <Notice tone="error">{loadError}</Notice>
        <Button onClick={() => void refresh()}>Reintentar</Button>
      </>
    );
  }
  return <Notice>Cargando…</Notice>;
}
