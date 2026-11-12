import { formatRating, ratingScale, toDisplayRating } from '../../config/rating';
import { Star } from './Star';
import styles from './RatingStars.module.css';

interface RatingStarsProps {
  /** Stored rating or an average of stored ratings. Null renders a dash. */
  value: number | null;
  size?: number;
  /** Shows the number next to the stars. */
  showValue?: boolean;
  emphasis?: boolean;
}

export function RatingStars({ value, size = 18, showValue = true, emphasis = false }: RatingStarsProps) {
  if (value === null) {
    return <span className={styles.none}>Sin puntaje</span>;
  }
  const display = toDisplayRating(value);
  const label = `${formatRating(value)} de ${ratingScale.displayMax}`;
  return (
    <span className={[styles.rating, emphasis ? styles.emphasis : ''].join(' ')} role="img" aria-label={label}>
      <span className={styles.stars}>
        {Array.from({ length: ratingScale.displayMax }, (_, index) => (
          <Star key={index} fill={display - index} size={size} />
        ))}
      </span>
      {showValue ? <span className={styles.value}>{formatRating(value)}</span> : null}
    </span>
  );
}
