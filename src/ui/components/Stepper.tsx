import styles from './Stepper.module.css';

interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

/** Whole-number picker with big minus/plus buttons. */
export function Stepper({ label, value, min = 1, max = 99, onChange }: StepperProps) {
  return (
    <div className={styles.field} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <div className={styles.controls}>
        <button type="button" className={styles.button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Restar ${label.toLowerCase()}`}>
          −
        </button>
        <output className={styles.value}>{value}</output>
        <button type="button" className={styles.button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Sumar ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </div>
  );
}
