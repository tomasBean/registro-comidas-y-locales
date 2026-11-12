import { useId } from 'react';
import type { ReactNode } from 'react';
import styles from './PhotoInput.module.css';

interface PhotoInputProps {
  label: string;
  /** Called with the chosen file; compression and upload happen outside. */
  onPick: (file: File) => void;
  busy?: boolean;
  /** Preview and remove control, when a photo is already attached. */
  children?: ReactNode;
}

/**
 * Plain file input styled as a button. `accept="image/*"` without `capture`
 * lets iOS and Android offer both camera and gallery.
 */
export function PhotoInput({ label, onPick, busy = false, children }: PhotoInputProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      {children}
      <label htmlFor={id} className={[styles.trigger, busy ? styles.busy : ''].join(' ')}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        {busy ? 'Procesando…' : label}
      </label>
      <input
        id={id}
        className={styles.input}
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset so picking the same file again fires a change.
          event.target.value = '';
          if (file) onPick(file);
        }}
      />
    </div>
  );
}
