import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Repository } from '../../data';
import type { Dataset, NotebookMember } from '../../domain/types';
import { errorMessage } from './errors';

interface DataContextValue {
  repository: Repository;
  /** Null until the first load finishes. */
  dataset: Dataset | null;
  members: NotebookMember[];
  loadError: string | null;
  /** Reloads everything after a change. */
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

/** Loads the notebook once and shares it with every screen. */
export function DataProvider({ repository, children }: { repository: Repository; children: ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [members, setMembers] = useState<NotebookMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [nextDataset, nextMembers] = await Promise.all([repository.loadDataset(), repository.listMembers()]);
      setDataset(nextDataset);
      setMembers(nextMembers);
      setLoadError(null);
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ repository, dataset, members, loadError, refresh }),
    [repository, dataset, members, loadError, refresh],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}
