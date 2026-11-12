import { Link, useParams } from 'react-router-dom';
import { formatDate, formatPrice } from '../../config/locale';
import { itemEvolution, similarItems } from '../../domain/items';
import type { TastingPoint } from '../../domain/items';
import type { Dataset, NotebookMember } from '../../domain/types';
import { unitPrice } from '../../domain/visits';
import { Card, cardLinkClassName, Section, Stack } from '../../ui/components/Card';
import { Tag } from '../../ui/components/Chip';
import { RatingStars } from '../../ui/components/RatingStars';
import { Sparkline } from '../../ui/components/Sparkline';
import { EmptyState } from '../../ui/layout/EmptyState';
import { Page } from '../../ui/layout/Page';
import { useData } from '../app/DataProvider';
import { LoadGate } from '../app/LoadGate';
import { routes } from '../app/routes';
import { useBack } from '../app/useBack';
import { Photo } from '../photos/Photo';
import styles from './ItemScreen.module.css';

const timesLabel = (count: number) => (count === 1 ? 'Probado 1 vez' : `Probado ${count} veces`);

function priceLabel(point: TastingPoint): string | null {
  const { priceTotal, quantity } = point.tasting;
  if (priceTotal === null) return null;
  const unit = unitPrice(point.tasting);
  return quantity > 1 && unit !== null
    ? `${formatPrice(priceTotal)} por ${quantity} (${formatPrice(Math.round(unit))} c/u)`
    : formatPrice(priceTotal);
}

function TastingCard({ point, members, itemName }: { point: TastingPoint; members: NotebookMember[]; itemName: string }) {
  const { tasting, date } = point;
  const author = members.find((member) => member.userId === tasting.createdBy)?.displayName;
  const price = priceLabel(point);
  return (
    <Card>
      <article aria-label={`${itemName}, ${formatDate(date)}`}>
        <header className={styles.tastingHeader}>
          <time dateTime={date} className={styles.date}>
            {formatDate(date)}
          </time>
          <RatingStars value={tasting.rating} />
        </header>
        {price ? <p className={styles.detail}>{price}</p> : null}
        {tasting.comment ? <p className={styles.comment}>{tasting.comment}</p> : null}
        {tasting.photoPath ? (
          <div className={styles.photo}>
            <Photo path={tasting.photoPath} alt={`${itemName}, ${formatDate(date)}`} />
          </div>
        ) : null}
        <p className={styles.footer}>
          {tasting.wouldReorder === true ? <Tag tone="accent">Volvería a pedirlo</Tag> : null}
          {tasting.wouldReorder === false ? <Tag>No volvería a pedirlo</Tag> : null}
          {author ? <span className={styles.muted}>Cargó {author}</span> : null}
        </p>
      </article>
    </Card>
  );
}

function ItemContent({ dataset, itemId }: { dataset: Dataset; itemId: string }) {
  const { members } = useData();
  const item = dataset.items.find((candidate) => candidate.id === itemId);
  const place = item ? dataset.places.find((candidate) => candidate.id === item.placeId) : undefined;
  if (!item || !place) {
    return <EmptyState title="No encontramos ese ítem" description="Puede que lo hayan borrado." />;
  }
  const evolution = itemEvolution(dataset, item);
  const newestFirst = [...evolution.points].reverse();
  const similar = similarItems(dataset, item);

  return (
    <>
      <Card>
        <p>
          En{' '}
          <Link to={routes.place(place.id)} className={styles.placeLink}>
            {place.name}
          </Link>
          {item.category ? (
            <>
              {' '}
              <Tag>{item.category}</Tag>
            </>
          ) : null}
        </p>
        {evolution.latest ? (
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt className={styles.muted}>Última vez</dt>
              <dd>
                <RatingStars value={evolution.latest.rating} emphasis />
              </dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.muted}>Promedio</dt>
              <dd>
                <RatingStars value={evolution.average} />
              </dd>
            </div>
          </dl>
        ) : null}
        {evolution.timesTried > 1 ? (
          <div className={styles.chart}>
            <Sparkline
              values={evolution.points.map((point) => point.rating)}
              width={280}
              height={64}
              label={`Evolución del puntaje de ${item.name}`}
            />
            <p className={styles.muted}>
              {formatDate(evolution.points[0]!.date)} → {formatDate(evolution.latest!.date)}
            </p>
          </div>
        ) : null}
      </Card>

      <Section title={evolution.timesTried > 0 ? timesLabel(evolution.timesTried) : 'Todavía sin probar'}>
        <Stack>
          {newestFirst.map((point) => (
            <TastingCard key={point.tasting.id} point={point} members={members} itemName={item.name} />
          ))}
        </Stack>
      </Section>

      {similar.length > 0 ? (
        <Section title={`Otros de la categoría «${item.category}»`}>
          <Stack>
            {similar.map((entry) => (
              <Link key={entry.item.id} to={routes.item(entry.item.id)} className={cardLinkClassName}>
                <div className={styles.tastingHeader}>
                  <span>
                    <strong>{entry.item.name}</strong> en {entry.place.name}
                  </span>
                  <RatingStars value={entry.average} size={16} />
                </div>
              </Link>
            ))}
          </Stack>
        </Section>
      ) : null}
    </>
  );
}

export function ItemScreen() {
  const { itemId = '' } = useParams();
  const { dataset } = useData();
  const item = dataset?.items.find((candidate) => candidate.id === itemId);
  const back = useBack(item ? routes.place(item.placeId) : routes.home());
  return (
    <Page title={item?.name ?? 'Ítem'} onBack={back}>
      <LoadGate>{(loaded) => <ItemContent dataset={loaded} itemId={itemId} />}</LoadGate>
    </Page>
  );
}
