import { useState } from 'react';
import { Button } from './Button';
import styles from './ConfirmButton.module.css';

interface ConfirmButtonProps {
  label: string;
  /** Explains what will be lost. */
  question: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
}

/** Destructive action in two taps, without relying on browser dialogs. */
export function ConfirmButton({ label, question, confirmLabel, onConfirm, disabled = false }: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="danger" onClick={() => setAsking(true)} disabled={disabled}>
        {label}
      </Button>
    );
  }
  return (
    <div className={styles.confirm} role="group" aria-label={label}>
      <p className={styles.question}>{question}</p>
      <div className={styles.actions}>
        <Button
          variant="danger"
          disabled={disabled}
          onClick={() => {
            setAsking(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </Button>
        <Button onClick={() => setAsking(false)}>Cancelar</Button>
      </div>
    </div>
  );
}
