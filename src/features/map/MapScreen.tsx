import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ratingScale, formatRating } from '../../config/rating';
import { listCategories } from '../../domain/categories';
import { DEFAULT_MAP_CENTER, filterPlacesForMap, hasLocation, PIN_KINDS } from '../../domain/maps';
import type { PinKind } from '../../domain/maps';
import type { Dataset } from '../../domain/types';
import { cardLinkClassName, Stack } from '../../ui/components/Card';
import { Chip, ChipRow, Tag } from '../../ui/components/Chip';
import { MapView } from '../../ui/components/MapView';
import { RatingStars } from '../../ui/components/RatingStars';
import { Page } from '../../ui/layout/Page';
import { LoadGate } from '../app/LoadGate';
import { routes } from '../app/routes';
import styles from './MapScreen.module.css';

const KIND_LABELS: Record<PinKind, string> = {
  regular: 'De siempre',
  visited: 'Visitados',
  wishlist: 'Quiero ir',
};

/** Minimum ratings offered by the filter, in the stored scale (3, 3,5, 4 and 4,5 stars). */
const MIN_RATING_OPTIONS = [6, 7, 8, 9].filter((value) => value <= ratingScale.storedMax);

function MapContent({ dataset }: { dataset: Dataset }) {
  const navigate = useNavigate();
  const [kinds, setKinds] = useState<PinKind[]>(PIN_KINDS);
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState('');

  const categories = listCategories(dataset.items);
  const entries = filterPlacesForMap(dataset, {
    kinds,
    category: category || null,
    minRating: minRating ? Number(minRating) : null,
  });
  const located = entries.filter((entry) => hasLocation(entry.place));
  const withoutLocation = entries.length - located.length;

  const toggleKind = (kind: PinKind) =>
    setKinds((current) => (current.includes(kind) ? current.filter((other) => other !== kind) : [...current, kind]));

  return (
    <>
      <div className={styles.filters}>
        <ChipRow label="Tipo de lugar">
          {PIN_KINDS.map((kind) => (
            <Chip key={kind} selected={kinds.includes(kind)} onClick={() => toggleKind(kind)}>
              <span className={[styles.dot, styles[kind]].join(' ')} aria-hidden="true" />
              {KIND_LABELS[kind]}
            </Chip>
          ))}
        </ChipRow>
        <div className={styles.selects}>
          <label className={styles.select}>
            <span className={styles.selectLabel}>Categoría de ítem</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Todas</option>
              {categories.map((option) => (
                <option key={option.key} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.select}>
            <span className={styles.selectLabel}>Puntaje mínimo</span>
            <select value={minRating} onChange={(event) => setMinRating(event.target.value)}>
              <option value="">Cualquiera</option>
              {MIN_RATING_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {formatRating(value)} o más
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <MapView
        label="Mapa de lugares"
        fallbackCenter={DEFAULT_MAP_CENTER}
        pins={located.map((entry) => ({
          id: entry.place.id,
          lat: entry.place.lat!,
          lng: entry.place.lng!,
          label: entry.place.name,
          tone: entry.kind,
        }))}
        onPinClick={(placeId) => navigate(routes.place(placeId))}
      />

      <p className={styles.count} role="status">
        {entries.length === 0
          ? 'Ningún lugar coincide con los filtros.'
          : `${located.length} en el mapa${withoutLocation > 0 ? ` · ${withoutLocation} sin ubicación` : ''}`}
      </p>

      <Stack gap="sm">
        {entries.map((entry) => (
          <Link key={entry.place.id} to={routes.place(entry.place.id)} className={cardLinkClassName}>
            <div className={styles.entry}>
              <span className={styles.entryName}>
                <span className={[styles.dot, styles[entry.kind]].join(' ')} aria-hidden="true" />
                {entry.place.name}
              </span>
              {entry.kind === 'wishlist' ? <Tag tone="accent">Quiero ir</Tag> : <RatingStars value={entry.rating} size={16} />}
            </div>
            {!hasLocation(entry.place) ? <p className={styles.muted}>Sin ubicación</p> : null}
          </Link>
        ))}
      </Stack>
    </>
  );
}

export function MapScreen() {
  return (
    <Page title="Mapa">
      <LoadGate>{(dataset) => <MapContent dataset={dataset} />}</LoadGate>
    </Page>
  );
}
