import { Link } from 'react-router-dom';
import { formatDate } from '../../config/locale';
import type { VisitDetail } from '../../domain/visits';
import { Card } from '../../ui/components/Card';
import { routes } from '../app/routes';
import { TastingLine } from './TastingLine';
import styles from './visits.module.css';

interface VisitCardProps {
  detail: VisitDetail;
  /** Shows the place name as a link (home feed). Hidden inside the place page. */
  showPlace?: boolean;
}

export function VisitCard({ detail, showPlace = false }: VisitCardProps) {
  const { visit, place, tastings } = detail;
  return (
    <Card>
      <article aria-label={showPlace ? `${place.name}, ${formatDate(visit.date)}` : `Visita del ${formatDate(visit.date)}`}>
        <header className={styles.cardHeader}>
          {showPlace ? (
            <Link to={routes.place(place.id)} className={styles.placeLink}>
              {place.name}
            </Link>
          ) : null}
          <time dateTime={visit.date} className={showPlace ? styles.date : styles.dateStrong}>
            {formatDate(visit.date)}
          </time>
        </header>
        {visit.note ? <p className={styles.note}>{visit.note}</p> : null}
        <ul className={styles.lines}>
          {tastings.map((entry) => (
            <TastingLine key={entry.tasting.id} {...entry} />
          ))}
        </ul>
      </article>
    </Card>
  );
}
