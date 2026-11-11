import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { hasLocation } from '../../domain/maps';
import type { Coordinates } from '../../domain/maps';
import { cleanText, textKey } from '../../domain/text';
import type { Dataset, Place, PlaceStatus } from '../../domain/types';
import { Button } from '../../ui/components/Button';
import { Chip, ChipRow } from '../../ui/components/Chip';
import { ChoiceField } from '../../ui/components/ChoiceField';
import { ConfirmButton } from '../../ui/components/ConfirmButton';
import { TextAreaField, TextField } from '../../ui/components/Field';
import { Notice } from '../../ui/components/Notice';
import { EmptyState } from '../../ui/layout/EmptyState';
import { Page } from '../../ui/layout/Page';
import { useData } from '../app/DataProvider';
import { errorMessage } from '../app/errors';
import { LoadGate } from '../app/LoadGate';
import { routes } from '../app/routes';
import { useBack } from '../app/useBack';
import { LocationEditor } from './LocationEditor';
import styles from './PlaceForm.module.css';

const MAX_TYPE_SUGGESTIONS = 6;

interface PlaceFormProps {
  dataset: Dataset;
  /** Null when creating. */
  place: Place | null;
  initialStatus: PlaceStatus;
}

function PlaceForm({ dataset, place, initialStatus }: PlaceFormProps) {
  const { repository, refresh } = useData();
  const navigate = useNavigate();
  const [name, setName] = useState(place?.name ?? '');
  const [type, setType] = useState(place?.type ?? '');
  const [address, setAddress] = useState(place?.address ?? '');
  const [notes, setNotes] = useState(place?.notes ?? '');
  const [status, setStatus] = useState<PlaceStatus>(place?.status ?? initialStatus);
  const [isRegular, setIsRegular] = useState(place?.isRegular ?? false);
  const [location, setLocation] = useState<Coordinates | null>(
    place && hasLocation(place) ? { lat: place.lat, lng: place.lng } : null,
  );
  const [nameMissing, setNameMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const types = [...new Set(dataset.places.map((other) => other.type).filter(Boolean))].slice(0, MAX_TYPE_SUGGESTIONS);
  const hasVisits = place ? dataset.visits.some((visit) => visit.placeId === place.id) : false;

  async function run(action: () => Promise<string>) {
    setSaving(true);
    setError(null);
    try {
      const destination = await action();
      await refresh();
      navigate(destination, { replace: true });
    } catch (cause) {
      setError(errorMessage(cause));
      setSaving(false);
    }
  }

  function save() {
    if (!cleanText(name)) {
      setNameMissing(true);
      return;
    }
    const fields = {
      name: cleanText(name),
      type: cleanText(type).toLowerCase(),
      address: cleanText(address),
      notes: notes.trim(),
      status,
      isRegular: status === 'visited' && isRegular,
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
    };
    void run(async () => {
      const saved = place ? await repository.updatePlace(place.id, fields) : await repository.createPlace(fields);
      return routes.place(saved.id);
    });
  }

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <TextField
        label="Nombre"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setNameMissing(false);
        }}
        error={nameMissing ? 'El lugar necesita un nombre.' : undefined}
        autoComplete="off"
      />

      {/* A place with visits is visited by definition. */}
      {!hasVisits ? (
        <ChoiceField
          label="¿Ya fueron?"
          options={[
            { value: 'wishlist', label: 'Quiero ir' },
            { value: 'visited', label: 'Ya fuimos' },
          ]}
          value={status}
          onChange={(choice) => setStatus(choice ?? status)}
        />
      ) : null}

      <div className={styles.group}>
        <TextField
          label="Tipo de lugar"
          placeholder="Panadería, hamburguesería…"
          value={type}
          onChange={(event) => setType(event.target.value)}
          autoCapitalize="none"
          autoComplete="off"
        />
        {types.length > 0 ? (
          <ChipRow label="Tipos usados">
            {types.map((option) => (
              <Chip key={option} selected={textKey(option) === textKey(type)} onClick={() => setType(option)}>
                {option}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
      </div>

      <TextField
        label="Dirección"
        placeholder="Calle y altura, o una esquina"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        autoComplete="off"
      />

      <TextAreaField
        label="Notas"
        placeholder={status === 'wishlist' ? 'Qué querés probar: «la milanesa»' : 'Horarios, con quién ir, lo que quieras recordar'}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />

      {status === 'visited' ? (
        <ChoiceField
          label="¿Es de los de siempre?"
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'no', label: 'No' },
          ]}
          value={isRegular ? 'yes' : 'no'}
          onChange={(choice) => setIsRegular(choice === 'yes')}
        />
      ) : null}

      <LocationEditor value={location} onChange={setLocation} address={address} />

      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button type="submit" variant="primary" block disabled={saving}>
        {saving ? 'Guardando…' : place ? 'Guardar cambios' : 'Guardar lugar'}
      </Button>

      {place ? (
        <ConfirmButton
          label="Borrar lugar"
          question={
            hasVisits
              ? 'Se borran también todas sus visitas, ítems y fotos. No se puede deshacer.'
              : 'Se borra el lugar. No se puede deshacer.'
          }
          confirmLabel="Sí, borrar"
          disabled={saving}
          onConfirm={() =>
            void run(async () => {
              await repository.deletePlace(place.id);
              return routes.places();
            })
          }
        />
      ) : null}
    </form>
  );
}

export function PlaceFormScreen() {
  const { placeId } = useParams();
  const [params] = useSearchParams();
  const back = useBack(placeId ? routes.place(placeId) : routes.places());
  const editing = placeId !== undefined;
  return (
    <Page title={editing ? 'Editar lugar' : 'Nuevo lugar'} onBack={back}>
      <LoadGate>
        {(dataset) => {
          const place = editing ? (dataset.places.find((candidate) => candidate.id === placeId) ?? null) : null;
          if (editing && !place) {
            return <EmptyState title="No encontramos ese lugar" description="Puede que lo hayan borrado." />;
          }
          return (
            <PlaceForm
              // Remount when switching between places so the fields reset.
              key={place?.id ?? 'new'}
              dataset={dataset}
              place={place}
              initialStatus={params.get('estado') === 'wishlist' ? 'wishlist' : 'visited'}
            />
          );
        }}
      </LoadGate>
    </Page>
  );
}
