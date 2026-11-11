import { suggestCategories } from '../../domain/categories';
import { findItemByName, suggestItems } from '../../domain/items';
import { textKey } from '../../domain/text';
import type { Dataset, Id } from '../../domain/types';
import type { VisitDraftErrors } from '../../domain/visits';
import { Button } from '../../ui/components/Button';
import { Card } from '../../ui/components/Card';
import { Chip, ChipRow } from '../../ui/components/Chip';
import { ChoiceField } from '../../ui/components/ChoiceField';
import { TextAreaField, TextField } from '../../ui/components/Field';
import { Notice } from '../../ui/components/Notice';
import { PhotoInput } from '../../ui/components/PhotoInput';
import { RatingInput } from '../../ui/components/RatingInput';
import { Stepper } from '../../ui/components/Stepper';
import type { TastingEntry } from './useVisitForm';
import styles from './VisitForm.module.css';

const MAX_SUGGESTIONS = 6;

interface TastingFieldsProps {
  dataset: Dataset;
  /** Null while the place is new: there are no previous items to suggest. */
  placeId: Id | null;
  index: number;
  entry: TastingEntry;
  errors?: VisitDraftErrors['tastingFields'][number];
  canRemove: boolean;
  onChange: (patch: Partial<TastingEntry>) => void;
  onRemove: () => void;
  onPickPhoto: (file: File) => void;
  onRemovePhoto: () => void;
}

function parsePrice(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : null;
}

/** Everything about one item tried in the visit. */
export function TastingFields({
  dataset,
  placeId,
  index,
  entry,
  errors = {},
  canRemove,
  onChange,
  onRemove,
  onPickPhoto,
  onRemovePhoto,
}: TastingFieldsProps) {
  const known = placeId
    ? ((entry.itemId ? dataset.items.find((item) => item.id === entry.itemId) : null) ??
      findItemByName(dataset, placeId, entry.itemName))
    : null;
  const itemSuggestions = placeId && !known ? suggestItems(dataset, placeId, entry.itemName).slice(0, MAX_SUGGESTIONS) : [];
  const categorySuggestions = known ? [] : suggestCategories(dataset.items, entry.category).slice(0, MAX_SUGGESTIONS);
  const title = `Ítem ${index + 1}`;

  return (
    <Card>
      <fieldset className={styles.tasting}>
        <legend className={styles.tastingTitle}>{title}</legend>

        <TextField
          label="¿Qué pediste?"
          placeholder="Chipá, triple, papas…"
          value={entry.itemName}
          onChange={(event) => onChange({ itemName: event.target.value, itemId: null })}
          error={errors.item ? 'Decinos qué pediste.' : undefined}
          hint={known ? `Ya lo pidieron antes: se suma al historial de ${known.name}.` : undefined}
          autoComplete="off"
        />
        {itemSuggestions.length > 0 ? (
          <ChipRow label={`Pedidos anteriores, ${title}`}>
            {itemSuggestions.map((item) => (
              <Chip key={item.id} onClick={() => onChange({ itemId: item.id, itemName: item.name, category: item.category })}>
                {item.name}
              </Chip>
            ))}
          </ChipRow>
        ) : null}

        {!known ? (
          <>
            <TextField
              label="Categoría"
              placeholder="Chipá, hamburguesa…"
              hint="Sirve para comparar el mismo tipo de plato entre lugares."
              value={entry.category}
              onChange={(event) => onChange({ category: event.target.value })}
              autoComplete="off"
              autoCapitalize="none"
            />
            {categorySuggestions.length > 0 ? (
              <ChipRow label={`Categorías usadas, ${title}`}>
                {categorySuggestions.map((category) => (
                  <Chip
                    key={category.key}
                    selected={category.key === textKey(entry.category)}
                    onClick={() => onChange({ category: category.label })}
                  >
                    {category.label}
                  </Chip>
                ))}
              </ChipRow>
            ) : null}
          </>
        ) : null}

        <RatingInput
          label={errors.rating ? 'Puntaje (falta elegirlo)' : 'Puntaje'}
          value={entry.rating}
          onChange={(rating) => onChange({ rating })}
          invalid={Boolean(errors.rating)}
        />

        <div className={styles.row}>
          <TextField
            label="Precio total ($)"
            placeholder="6000"
            inputMode="numeric"
            value={entry.priceTotal === null ? '' : String(entry.priceTotal)}
            onChange={(event) => onChange({ priceTotal: parsePrice(event.target.value) })}
            error={errors.priceTotal ? 'Tiene que ser un número entero.' : undefined}
            autoComplete="off"
          />
          <Stepper label="Cantidad" value={entry.quantity} onChange={(quantity) => onChange({ quantity })} />
        </div>

        <ChoiceField
          label="¿Volverías a pedirlo?"
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'no', label: 'No' },
          ]}
          value={entry.wouldReorder === null ? null : entry.wouldReorder ? 'yes' : 'no'}
          onChange={(choice) => onChange({ wouldReorder: choice === null ? null : choice === 'yes' })}
        />

        <TextAreaField
          label="Comentario"
          placeholder="Toppings, punto de cocción, lo que quieras recordar"
          value={entry.comment}
          onChange={(event) => onChange({ comment: event.target.value })}
        />

        <PhotoInput label={entry.previewUrl ? 'Cambiar foto' : 'Agregar foto'} busy={entry.photoBusy} onPick={onPickPhoto}>
          {entry.previewUrl ? (
            <div className={styles.preview}>
              <img src={entry.previewUrl} alt={`Foto de ${entry.itemName || title}`} className={styles.previewImage} />
              <Button variant="ghost" onClick={onRemovePhoto}>
                Quitar foto
              </Button>
            </div>
          ) : null}
        </PhotoInput>
        {entry.photoError ? <Notice tone="error">{entry.photoError}</Notice> : null}

        {canRemove ? (
          <Button variant="danger" onClick={onRemove}>
            Quitar {title.toLowerCase()}
          </Button>
        ) : null}
      </fieldset>
    </Card>
  );
}
