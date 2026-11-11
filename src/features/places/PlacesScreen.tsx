import { Link } from 'react-router-dom';
import { formatDate } from '../../config/locale';
import { summarizePlaces } from '../../domain/places';
import { cardLinkClassName, Stack } from '../../ui/components/Card';
import { Tag } from '../../ui/components/Chip';
import { RatingStars } from '../../ui/components/RatingStars';
import { EmptyState } from '../../ui/layout/EmptyState';
import { Page } from '../../ui/layout/Page';
import { LoadGate } from '../app/LoadGate';
import { routes } from '../app/routes';
import styles from './PlacesScreen.module.css';

const visitsLabel = (count: number) => (count === 1 ? '1 visita' : `${count} visitas`);

export function PlacesScreen() {
  return (
    <Page title="Lugares">
      <LoadGate>
        {(dataset) => {
          const summaries = summarizePlaces(dataset).sort(
            (a, b) =>
              (b.lastVisitDate ?? '').localeCompare(a.lastVisitDate ?? '') ||
              a.place.name.localeCompare(b.place.name, 'es'),
          );
          if (summaries.length === 0) {
            return <EmptyState title="Todavía no hay lugares" description="Se crean al registrar una visita." />;
          }
          return (
            <Stack>
              {summaries.map(({ place, visitCount, lastVisitDate, average }) => (
                <Link key={place.id} to={routes.place(place.id)} className={cardLinkClassName}>
                  <div className={styles.top}>
                    <h2 className={styles.name}>{place.name}</h2>
                    {place.status === 'wishlist' ? <Tag tone="accent">Quiero ir</Tag> : <RatingStars value={average} size={16} />}
                  </div>
                  <p className={styles.meta}>
                    {[
                      place.type || null,
                      visitCount > 0 ? visitsLabel(visitCount) : null,
                      lastVisitDate ? `última: ${formatDate(lastVisitDate)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </Link>
              ))}
            </Stack>
          );
        }}
      </LoadGate>
    </Page>
  );
}
