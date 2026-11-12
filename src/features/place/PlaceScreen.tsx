import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDate } from '../../config/locale';
import { formatRating } from '../../config/rating';
import { placeItemEvolutions } from '../../domain/items';
import type { ItemEvolution } from '../../domain/items';
import { summarizePlace } from '../../domain/places';
import type { Dataset, PlacePhotoKind } from '../../domain/types';
import { placeVisitDetails } from '../../domain/visits';
import { buttonClassName } from '../../ui/components/Button';
import { Card, cardLinkClassName, Section, Stack } from '../../ui/components/Card';
import { Tag } from '../../ui/components/Chip';
import { Notice } from '../../ui/components/Notice';
import { PhotoInput } from '../../ui/components/PhotoInput';
import { RatingStars } from '../../ui/components/RatingStars';
import { Sparkline } from '../../ui/components/Sparkline';
import { EmptyState } from '../../ui/layout/EmptyState';
import { Page } from '../../ui/layout/Page';
import { useData } from '../app/DataProvider';
import { errorMessage } from '../app/errors';
import { LoadGate } from '../app/LoadGate';
import { routes } from '../app/routes';
import { useBack } from '../app/useBack';
import { compressImage } from '../photos/compressImage';
import { Photo } from '../photos/Photo';
import { VisitCard } from '../visits/VisitCard';
import styles from './PlaceScreen.module.css';

const visitsLabel = (count: number) => (count === 1 ? '1 visita' : `${count} visitas`);
const timesLabel = (count: number) => (count === 1 ? '1 vez' : `${count} veces`);

function changeLabel(change: number | null): { text: string; tone: 'up' | 'down' | 'same' } | null {
  if (change === null) return null;
  if (change === 0) return { text: 'Igual que la vez anterior', tone: 'same' };
  // `change` is in the stored scale; formatRating converts a difference just as well.
  const amount = formatRating(Math.abs(change));
  return change > 0
    ? { text: `▲ ${amount} respecto de la vez anterior`, tone: 'up' }
    : { text: `▼ ${amount} respecto de la vez anterior`, tone: 'down' };
}

function ItemCard({ evolution }: { evolution: ItemEvolution }) {
  const { item, points, latest, change, timesTried } = evolution;
  const trend = changeLabel(change);
  return (
    <Link to={routes.item(item.id)} className={cardLinkClassName}>
      <div className={styles.itemTop}>
        <div className={styles.itemHeading}>
          <h3 className={styles.itemName}>{item.name}</h3>
          <p className={styles.muted}>
            {[item.category || null, timesTried > 0 ? timesLabel(timesTried) : 'Sin probar'].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Sparkline values={points.map((point) => point.rating)} label={`Evolución de ${item.name}`} />
      </div>
      {latest ? (
        <div className={styles.itemBottom}>
          <span className={styles.muted}>Última vez</span>
          <RatingStars value={latest.rating} emphasis />
        </div>
      ) : null}
      {trend ? <p className={[styles.trend, styles[trend.tone]].join(' ')}>{trend.text}</p> : null}
    </Link>
  );
}

function PlacePhotos({ dataset, placeId, placeName }: { dataset: Dataset; placeId: string; placeName: string }) {
  const { repository, refresh } = useData();
  const [busy, setBusy] = useState<PlacePhotoKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const photos = dataset.placePhotos
    .filter((photo) => photo.placeId === placeId)
    .sort((a, b) => Number(b.kind === 'menu') - Number(a.kind === 'menu') || b.createdAt.localeCompare(a.createdAt));

  async function add(kind: PlacePhotoKind, file: File) {
    setBusy(kind);
    setError(null);
    try {
      const image = await compressImage(file);
      const path = await repository.uploadPhoto(placeId, image);
      await repository.addPlacePhoto(placeId, kind, path);
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Section title="Fotos y carta">
      {photos.length > 0 ? (
        <ul className={styles.photoGrid}>
          {photos.map((photo) => (
            <li key={photo.id} className={styles.photoCell}>
              <Photo path={photo.path} alt={photo.kind === 'menu' ? `Carta de ${placeName}` : `Foto de ${placeName}`} />
              {photo.kind === 'menu' ? (
                <span className={styles.photoTag}>
                  <Tag tone="accent">Carta</Tag>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.muted}>Todavía no hay fotos de este lugar.</p>
      )}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className={styles.photoActions}>
        <PhotoInput label="Foto de la carta" busy={busy === 'menu'} onPick={(file) => void add('menu', file)} />
        <PhotoInput label="Foto del lugar" busy={busy === 'general'} onPick={(file) => void add('general', file)} />
      </div>
    </Section>
  );
}

function PlaceContent({ dataset, placeId }: { dataset: Dataset; placeId: string }) {
  const summary = summarizePlace(dataset, placeId);
  if (!summary) {
    return <EmptyState title="No encontramos ese lugar" description="Puede que lo hayan borrado." />;
  }
  const { place, visitCount, lastVisitDate, average } = summary;
  const evolutions = placeItemEvolutions(dataset, placeId);
  const visits = placeVisitDetails(dataset, placeId);

  return (
    <>
      <Card>
        <div className={styles.summaryTop}>
          <p className={styles.kind}>{place.type || 'Lugar'}</p>
          {place.status === 'wishlist' ? <Tag tone="accent">Quiero ir</Tag> : null}
        </div>
        {place.address ? <p className={styles.muted}>{place.address}</p> : null}
        {visitCount > 0 ? (
          <div className={styles.summaryStats}>
            <RatingStars value={average} emphasis size={22} />
            <p className={styles.muted}>
              {visitsLabel(visitCount)}
              {lastVisitDate ? ` · última: ${formatDate(lastVisitDate)}` : ''}
            </p>
          </div>
        ) : null}
        {place.notes ? <p className={styles.notes}>{place.notes}</p> : null}
      </Card>

      <Link to={routes.newVisit(place.id)} className={buttonClassName('primary', true)}>
        Registrar visita acá
      </Link>

      {evolutions.length > 0 ? (
        <Section title="Lo que pedimos">
          <Stack>
            {evolutions.map((evolution) => (
              <ItemCard key={evolution.item.id} evolution={evolution} />
            ))}
          </Stack>
        </Section>
      ) : null}

      <Section title="Visitas">
        {visits.length > 0 ? (
          <Stack>
            {visits.map((detail) => (
              <VisitCard key={detail.visit.id} detail={detail} />
            ))}
          </Stack>
        ) : (
          <p className={styles.muted}>Todavía no registraron visitas acá.</p>
        )}
      </Section>

      <PlacePhotos dataset={dataset} placeId={place.id} placeName={place.name} />
    </>
  );
}

export function PlaceScreen() {
  const { placeId = '' } = useParams();
  const { dataset } = useData();
  const back = useBack(routes.places());
  const name = dataset?.places.find((place) => place.id === placeId)?.name ?? 'Lugar';
  return (
    <Page title={name} onBack={back}>
      <LoadGate>{(loaded) => <PlaceContent dataset={loaded} placeId={placeId} />}</LoadGate>
    </Page>
  );
}
