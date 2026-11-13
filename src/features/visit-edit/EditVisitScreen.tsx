import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '../../config/locale';
import type { Dataset } from '../../domain/types';
import { visitDetail } from '../../domain/visits';
import { Button } from '../../ui/components/Button';
import { Stack } from '../../ui/components/Card';
import { TextAreaField, TextField } from '../../ui/components/Field';
import { Notice } from '../../ui/components/Notice';
import { Page } from '../../ui/layout/Page';
import { LoadGate } from '../app/LoadGate';
import { routes } from '../app/routes';
import { useBack } from '../app/useBack';
import { TastingFields } from '../visit-form/TastingFields';
import styles from '../visit-form/VisitForm.module.css';
import { useEditVisit } from './useEditVisit';

function EditVisitForm({ dataset, visitId }: { dataset: Dataset; visitId: string }) {
  const navigate = useNavigate();
  const detail = visitDetail(dataset, visitId);
  if (!detail) return <Navigate to={routes.home()} replace />;
  return (
    <Form dataset={dataset} detail={detail} onSaved={(placeId) => navigate(routes.place(placeId), { replace: true })} />
  );
}

function Form({
  dataset,
  detail,
  onSaved,
}: {
  dataset: Dataset;
  detail: NonNullable<ReturnType<typeof visitDetail>>;
  onSaved: (placeId: string) => void;
}) {
  const form = useEditVisit(detail, onSaved);
  const { state, errors } = form;

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit();
      }}
    >
      <p className={styles.lockedItem}>
        <strong>{detail.place.name}</strong>
        <span className={styles.lockedCategory}>Visita del {formatDate(detail.visit.date)}</span>
      </p>

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
            placeId={detail.place.id}
            index={index}
            entry={entry}
            errors={errors?.tastingFields[index]}
            canRemove={false}
            lockItem
            onChange={(patch) => form.updateTasting(entry.key, patch)}
            onRemove={() => undefined}
            onPickPhoto={(file) => void form.pickPhoto(entry.key, file)}
            onRemovePhoto={() => form.removePhoto(entry.key)}
          />
        ))}
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
        {form.saving ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}

export function EditVisitScreen() {
  const { visitId } = useParams();
  const back = useBack(routes.home());
  return (
    <Page title="Editar visita" onBack={back}>
      <LoadGate>
        {(dataset) =>
          visitId ? <EditVisitForm dataset={dataset} visitId={visitId} /> : <Navigate to={routes.home()} replace />
        }
      </LoadGate>
    </Page>
  );
}
