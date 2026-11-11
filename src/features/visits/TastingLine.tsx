import { Link } from 'react-router-dom';
import { formatPrice } from '../../config/locale';
import type { TastingWithItem } from '../../domain/visits';
import { RatingStars } from '../../ui/components/RatingStars';
import { routes } from '../app/routes';
import styles from './visits.module.css';

/** One item of a visit: name, rating and price. Links to the item page. */
export function TastingLine({ tasting, item }: TastingWithItem) {
  return (
    <li className={styles.line}>
      <Link to={routes.item(item.id)} className={styles.lineLink}>
        <span className={styles.lineName}>
          {tasting.quantity > 1 ? `${tasting.quantity} × ` : ''}
          {item.name}
        </span>
        <RatingStars value={tasting.rating} size={16} />
      </Link>
      {tasting.priceTotal !== null || tasting.comment ? (
        <p className={styles.lineMeta}>
          {[tasting.priceTotal !== null ? formatPrice(tasting.priceTotal) : null, tasting.comment || null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}
    </li>
  );
}
