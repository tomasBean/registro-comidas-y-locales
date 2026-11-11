import { useId } from 'react';
import { formatRating, ratingScale, toDisplayRating } from '../../config/rating';
import { Star } from './Star';
import styles from './RatingInput.module.css';

interface RatingInputProps {
  label: string;
  /** Stored rating, or null when nothing was chosen yet. */
  value: number | null;
  onChange: (value: number) => void;
  invalid?: boolean;
}

/**
 * Half-star picker built on native radios: each star has two tap zones.
 * Works with keyboard arrows and screen readers without extra code.
 */
export function RatingInput({ label, value, onChange, invalid = false }: RatingInputProps) {
  const name = useId();
  const stepsPerStar = ratingScale.displayDivisor;
  const stars = ratingScale.displayMax;
  const display = value === null ? 0 : toDisplayRating(value);

  return (
    <fieldset className={[styles.field, invalid ? styles.invalid : ''].join(' ')}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.row}>
        <div className={styles.stars}>
          {Array.from({ length: stars }, (_, starIndex) => (
            <span key={starIndex} className={styles.star}>
              <Star fill={display - starIndex} size={40} />
              {Array.from({ length: stepsPerStar }, (_, stepIndex) => {
                const stored = starIndex * stepsPerStar + stepIndex + 1;
                if (stored < ratingScale.storedMin || stored > ratingScale.storedMax) return null;
                return (
                  <label
                    key={stored}
                    className={styles.zone}
                    style={{ left: `${(stepIndex / stepsPerStar) * 100}%`, width: `${100 / stepsPerStar}%` }}
                  >
                    <input
                      type="radio"
                      className={styles.radio}
                      name={name}
                      value={stored}
                      checked={value === stored}
                      onChange={() => onChange(stored)}
                      aria-label={formatRating(stored)}
                    />
                  </label>
                );
              })}
            </span>
          ))}
        </div>
        <output className={styles.value}>{value === null ? '–' : formatRating(value)}</output>
      </div>
    </fieldset>
  );
}
