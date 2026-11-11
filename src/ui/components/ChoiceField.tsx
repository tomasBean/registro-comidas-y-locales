import styles from './ChoiceField.module.css';

interface ChoiceFieldProps<T extends string> {
  label: string;
  options: Array<{ value: T; label: string }>;
  /** Null when nothing is chosen. Tapping the chosen option clears it. */
  value: T | null;
  onChange: (value: T | null) => void;
}

/** Segmented control for a short optional choice ("Sí" / "No"). */
export function ChoiceField<T extends string>({ label, options, value, onChange }: ChoiceFieldProps<T>) {
  return (
    <div className={styles.field} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <div className={styles.options}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            className={[styles.option, value === option.value ? styles.selected : ''].join(' ')}
            onClick={() => onChange(value === option.value ? null : option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
