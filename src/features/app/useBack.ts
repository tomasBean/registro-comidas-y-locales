import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/** Goes back in history when there is somewhere to go; otherwise to `fallback`. */
export function useBack(fallback: string): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (index > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}
