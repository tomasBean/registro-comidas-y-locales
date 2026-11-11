import { useState } from 'react';
import { summarizePlaces } from '../../domain/places';
import { cleanText, matchesQuery, textKey } from '../../domain/text';
import type { Dataset } from '../../domain/types';
import { Button } from '../../ui/components/Button';
import { Chip, ChipRow } from '../../ui/components/Chip';
import { TextField } from '../../ui/components/Field';
import type { PlaceChoice } from './useVisitForm';
import styles from './VisitForm.module.css';

const MAX_SUGGESTIONS = 6;

interface PlacePickerProps {
  dataset: Dataset;
  value: PlaceChoice;
  onChange: (value: PlaceChoice) => void;
  error?: string;
}

/** Step one of the form: pick an existing place or name a new one. */
export function PlacePicker({ dataset, value, onChange, error }: PlacePickerProps) {
  const [query, setQuery] = useState('');

  if (value.kind === 'existing') {
    const place = dataset.places.find((candidate) => candidate.id === value.placeId);
    return (
      <div className={styles.chosen}>
        <div className={styles.chosenText}>
          <span className={styles.fieldLabel}>Lugar</span>
          <strong>{place?.name ?? 'Lugar'}</strong>
          {place?.address ? <span className={styles.muted}>{place.address}</span> : null}
        </div>
        <Button variant="ghost" onClick={() => onChange({ kind: 'none' })}>
          Cambiar
        </Button>
      </div>
    );
  }

  if (value.kind === 'new') {
    const types = [...new Set(dataset.places.map((place) => place.type).filter(Boolean))].slice(0, MAX_SUGGESTIONS);
    return (
      <div className={styles.group}>
        <div className={styles.chosen}>
          <div className={styles.chosenText}>
            <span className={styles.fieldLabel}>Lugar nuevo</span>
            <strong>{value.name}</strong>
          </div>
          <Button variant="ghost" onClick={() => onChange({ kind: 'none' })}>
            Cambiar
          </Button>
        </div>
        <TextField
          label="Tipo de lugar"
          placeholder="Panadería, hamburguesería…"
          value={value.type}
          onChange={(event) => onChange({ ...value, type: event.target.value })}
          autoCapitalize="none"
        />
        {types.length > 0 ? (
          <ChipRow label="Tipos usados">
            {types.map((type) => (
              <Chip key={type} selected={textKey(type) === textKey(value.type)} onClick={() => onChange({ ...value, type })}>
                {type}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
        <TextField
          label="Dirección (opcional)"
          placeholder="Calle y altura, o una esquina"
          value={value.address}
          onChange={(event) => onChange({ ...value, address: event.target.value })}
        />
      </div>
    );
  }

  const typed = cleanText(query);
  // Most recently visited first, so the usual places are one tap away.
  const matches = summarizePlaces(dataset)
    .filter(({ place }) => !typed || matchesQuery(place.name, typed))
    .sort((a, b) => (b.lastVisitDate ?? '').localeCompare(a.lastVisitDate ?? '') || a.place.name.localeCompare(b.place.name, 'es'))
    .slice(0, MAX_SUGGESTIONS);
  const exact = dataset.places.some((place) => textKey(place.name) === textKey(typed));

  return (
    <div className={styles.group}>
      <TextField
        label="Lugar"
        placeholder="Buscá o escribí uno nuevo"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        error={error}
        autoComplete="off"
        enterKeyHint="search"
      />
      <ChipRow label="Lugares">
        {matches.map(({ place }) => (
          <Chip key={place.id} onClick={() => onChange({ kind: 'existing', placeId: place.id })}>
            {place.name}
          </Chip>
        ))}
        {typed && !exact ? (
          <Chip onClick={() => onChange({ kind: 'new', name: typed, type: '', address: '' })}>Crear «{typed}»</Chip>
        ) : null}
      </ChipRow>
    </div>
  );
}
