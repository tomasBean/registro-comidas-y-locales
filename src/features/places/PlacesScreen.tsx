import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDate } from '../../config/locale';
import { regularPlaces, summarizePlaces, wishlistPlaces } from '../../domain/places';
import type { PlaceSummary } from '../../domain/places';
import { search } from '../../domain/search';
import { cleanText } from '../../domain/text';
import type { Dataset } from '../../domain/types';
import { buttonClassName } from '../../ui/components/Button';
import { cardLinkClassName, Section, Stack } from '../../ui/components/Card';
import { Chip, ChipRow, Tag } from '../../ui/components/Chip';
import { TextField } from '../../ui/components/Field';
import { RatingStars } from '../../ui/components/RatingStars';
import { EmptyState } from '../../ui/layout/EmptyState';
import { Page } from '../../ui/layout/Page';
import { LoadGate } from '../app/LoadGate';
import { routes } from '../app/routes';
import styles from './PlacesScreen.module.css';

type View = 'all' | 'regulars' | 'wishlist';

const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'regulars', label: 'De siempre' },
  { value: 'wishlist', label: 'Quiero ir' },
];

const visitsLabel = (count: number) => (count === 1 ? '1 visita' : `${count} visitas`);

function PlaceCard({ summary, tag }: { summary: PlaceSummary; tag?: string }) {
  const { place, visitCount, lastVisitDate, average } = summary;
  return (
    <Link to={routes.place(place.id)} className={cardLinkClassName}>
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
      {place.status === 'wishlist' && place.notes ? <p className={styles.notes}>{place.notes}</p> : null}
      {tag ? (
        <p className={styles.tagLine}>
          <Tag>{tag}</Tag>
        </p>
      ) : null}
    </Link>
  );
}

function SearchResults({ dataset, query }: { dataset: Dataset; query: string }) {
  const results = search(dataset, query);
  const summaries = new Map(summarizePlaces(dataset).map((summary) => [summary.place.id, summary]));
  if (results.places.length === 0 && results.items.length === 0) {
    return <EmptyState title="Sin resultados" description={`No hay lugares ni ítems con «${cleanText(query)}».`} />;
  }
  return (
    <>
      {results.places.length > 0 ? (
        <Section title="Lugares">
          <Stack>
            {results.places.map((place) => (
              <PlaceCard key={place.id} summary={summaries.get(place.id)!} />
            ))}
          </Stack>
        </Section>
      ) : null}
      {results.items.length > 0 ? (
        <Section title="Ítems">
          <Stack>
            {results.items.map(({ item, place }) => (
              <Link key={item.id} to={routes.item(item.id)} className={cardLinkClassName}>
                <h3 className={styles.name}>{item.name}</h3>
                <p className={styles.meta}>{[place.name, item.category || null].filter(Boolean).join(' · ')}</p>
              </Link>
            ))}
          </Stack>
        </Section>
      ) : null}
    </>
  );
}

function PlaceLists({ dataset, view }: { dataset: Dataset; view: View }) {
  if (view === 'wishlist') {
    const wishlist = new Set(wishlistPlaces(dataset).map((place) => place.id));
    const summaries = summarizePlaces(dataset)
      .filter((summary) => wishlist.has(summary.place.id))
      .sort((a, b) => b.place.createdAt.localeCompare(a.place.createdAt));
    return (
      <>
        <Link to={routes.newPlace('wishlist')} className={buttonClassName('primary', true)}>
          Agregar lugar para ir
        </Link>
        {summaries.length === 0 ? (
          <EmptyState title="No hay pendientes" description="Guardá acá los lugares que quieren probar." />
        ) : (
          <Stack>
            {summaries.map((summary) => (
              <PlaceCard key={summary.place.id} summary={summary} />
            ))}
          </Stack>
        )}
      </>
    );
  }

  if (view === 'regulars') {
    const regulars = regularPlaces(dataset);
    if (regulars.length === 0) {
      return (
        <EmptyState
          title="Todavía no hay lugares de siempre"
          description="Marcá uno desde su ficha, o aparecen solos cuando suman varias visitas."
        />
      );
    }
    return (
      <Stack>
        {regulars.map((regular) => (
          <PlaceCard
            key={regular.place.id}
            summary={regular}
            tag={regular.reason === 'suggested' ? 'Sugerido por la cantidad de visitas' : undefined}
          />
        ))}
      </Stack>
    );
  }

  const summaries = summarizePlaces(dataset).sort(
    (a, b) =>
      (b.lastVisitDate ?? '').localeCompare(a.lastVisitDate ?? '') || a.place.name.localeCompare(b.place.name, 'es'),
  );
  if (summaries.length === 0) {
    return <EmptyState title="Todavía no hay lugares" description="Se crean al registrar una visita." />;
  }
  return (
    <Stack>
      {summaries.map((summary) => (
        <PlaceCard key={summary.place.id} summary={summary} />
      ))}
    </Stack>
  );
}

export function PlacesScreen() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const requested = params.get('ver');
  const view: View = requested === 'regulars' || requested === 'wishlist' ? requested : 'all';

  return (
    <Page title="Lugares">
      <TextField
        label="Buscar lugares e ítems"
        type="search"
        placeholder="Chipá, Albuche, hamburguesería…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
        enterKeyHint="search"
      />
      <LoadGate>
        {(dataset) =>
          cleanText(query) ? (
            <SearchResults dataset={dataset} query={query} />
          ) : (
            <>
              <ChipRow label="Qué lugares ver">
                {VIEWS.map((option) => (
                  <Chip
                    key={option.value}
                    selected={view === option.value}
                    onClick={() => setParams(option.value === 'all' ? {} : { ver: option.value }, { replace: true })}
                  >
                    {option.label}
                  </Chip>
                ))}
              </ChipRow>
              <PlaceLists dataset={dataset} view={view} />
            </>
          )
        }
      </LoadGate>
    </Page>
  );
}
