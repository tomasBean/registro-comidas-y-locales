import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Dataset } from '../../domain/types';
import { Button } from '../../ui/components/Button';
import { Stack } from '../../ui/components/Card';
import { TextAreaField, TextField } from '../../ui/components/Field';
import { Notice } from '../../ui/components/Notice';
import { Page } from '../../ui/layout/Page';
import { LoadGate } from '../app/LoadGate';
import { routes } from '../app/routes';
import { useBack } from '../app/useBack';
import { PlacePicker } from './PlacePicker';
import { TastingFields } from './TastingFields';
import { useVisitForm } from './useVisitForm';
import styles from './VisitForm.module.css';

function VisitForm({ dataset, initialPlaceId }: { dataset: Dataset; initialPlaceId: string | null }) {
  const navigate = useNavigate();
  const form = useVisitForm(initialPlaceId, (placeId) => navigate(routes.place(placeId), { replace: true }));
  const { state, errors } = form;
  const placeId = state.place.kind === 'existing' ? state.place.placeId : null;

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit();
      }}
    >
      <PlacePicker
        dataset={dataset}
        value={state.place}
        onChange={form.setPlace}
        error={errors?.place ? 'Elegí un lugar o creá uno nuevo.' : undefined}
      />

      <TextField
        label="Fecha"
        type="date"
        value={state.date}
        onChange={(event) => form.update({ date: event.target.value })}
        error={errors?.date ? 'Elegí una fecha válida.' : undefined}
      />

      <Stack>
        {state.tastings.map((entry, index) => (
          <TastingFields
            key={entry.key}
            dataset={dataset}
            placeId={placeId}
            index={index}
            entry={entry}
            errors={errors?.tastingFields[index]}
            canRemove={state.tastings.length > 1}
            onChange={(patch) => form.updateTasting(entry.key, patch)}
            onRemove={() => form.removeTasting(entry.key)}
            onPickPhoto={(file) => void form.pickPhoto(entry.key, file)}
            onRemovePhoto={() => form.removePhoto(entry.key)}
          />
        ))}
        {errors?.tastings ? <Notice tone="error">Agregá al menos un ítem.</Notice> : null}
        <Button onClick={form.addTasting}>Agregar otro ítem</Button>
      </Stack>

      <TextAreaField
        label="Nota de la visita (opcional)"
        placeholder="Con quién fueron, cómo atendieron…"
        value={state.note}
        onChange={(event) => form.update({ note: event.target.value })}
      />

      {errors ? <Notice tone="error">Faltan datos: revisá lo marcado en rojo.</Notice> : null}
      {form.saveError ? <Notice tone="error">{form.saveError}</Notice> : null}

      <Button type="submit" variant="primary" block disabled={form.saving}>
        {form.saving ? 'Guardando…' : 'Guardar visita'}
      </Button>
    </form>
  );
}

export function VisitFormScreen() {
  const [params] = useSearchParams();
  const requestedPlace = params.get('place');
  const back = useBack(requestedPlace ? routes.place(requestedPlace) : routes.home());
  return (
    <Page title="Registrar visita" onBack={back}>
      <LoadGate>
        {(dataset) => {
          const exists = requestedPlace !== null && dataset.places.some((place) => place.id === requestedPlace);
          return <VisitForm dataset={dataset} initialPlaceId={exists ? requestedPlace : null} />;
        }}
      </LoadGate>
    </Page>
  );
}
