import { useCallback, useEffect, useRef, useState } from 'react';
import { todayIsoDate } from '../../config/locale';
import type { ValidVisitDraft } from '../../data/repository';
import type { Coordinates } from '../../domain/maps';
import { cleanText } from '../../domain/text';
import type { Id } from '../../domain/types';
import { emptyTastingDraft, validateVisitDraft } from '../../domain/visits';
import type { TastingDraft, VisitDraftErrors } from '../../domain/visits';
import { useData } from '../app/DataProvider';
import { errorMessage } from '../app/errors';
import { compressImage } from '../photos/compressImage';

export interface TastingEntry extends TastingDraft {
  /** Stable React key; not persisted. */
  key: string;
  /** Compressed photo waiting for upload on save. */
  photo: Blob | null;
  previewUrl: string | null;
  photoBusy: boolean;
  photoError: string | null;
}

export type PlaceChoice =
  | { kind: 'none' }
  | { kind: 'existing'; placeId: Id }
  | { kind: 'new'; name: string; type: string; address: string; location: Coordinates | null };

export interface VisitFormState {
  place: PlaceChoice;
  date: string;
  note: string;
  tastings: TastingEntry[];
}

/** Stand-in id so the domain validation accepts a place that is about to be created. */
const PENDING_PLACE_ID = 'pending-place';

/** State and actions of the "registrar visita" form. The screen only renders it. */
export function useVisitForm(initialPlaceId: Id | null, onSaved: (placeId: Id) => void) {
  const { repository, refresh } = useData();
  const nextKey = useRef(0);
  const newEntry = useCallback(
    (): TastingEntry => ({
      ...emptyTastingDraft(),
      key: `tasting-${nextKey.current++}`,
      photo: null,
      previewUrl: null,
      photoBusy: false,
      photoError: null,
    }),
    [],
  );

  const [state, setState] = useState<VisitFormState>(() => ({
    place: initialPlaceId ? { kind: 'existing', placeId: initialPlaceId } : { kind: 'none' },
    date: todayIsoDate(),
    note: '',
    tastings: [newEntry()],
  }));
  const [errors, setErrors] = useState<VisitDraftErrors | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Release preview URLs when the form goes away.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const update = (patch: Partial<VisitFormState>) => setState((current) => ({ ...current, ...patch }));

  const updateTasting = (key: string, patch: Partial<TastingEntry>) =>
    setState((current) => ({
      ...current,
      tastings: current.tastings.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)),
    }));

  const setPlace = (place: PlaceChoice) =>
    setState((current) => {
      const samePlace =
        place.kind === 'existing' && current.place.kind === 'existing' && place.placeId === current.place.placeId;
      return {
        ...current,
        place,
        // Items belong to a place: picking another place unlinks the chosen ones.
        tastings: samePlace ? current.tastings : current.tastings.map((entry) => ({ ...entry, itemId: null })),
      };
    });

  const addTasting = () => setState((current) => ({ ...current, tastings: [...current.tastings, newEntry()] }));

  const removeTasting = (key: string) =>
    setState((current) => ({ ...current, tastings: current.tastings.filter((entry) => entry.key !== key) }));

  async function pickPhoto(key: string, file: File) {
    updateTasting(key, { photoBusy: true, photoError: null });
    try {
      const photo = await compressImage(file);
      const previewUrl = URL.createObjectURL(photo);
      previews.current.add(previewUrl);
      updateTasting(key, { photo, previewUrl, photoBusy: false });
    } catch (error) {
      updateTasting(key, { photoBusy: false, photoError: errorMessage(error) });
    }
  }

  const removePhoto = (key: string) => updateTasting(key, { photo: null, previewUrl: null });

  async function submit() {
    const { place } = state;
    const hasPlace = place.kind === 'existing' || (place.kind === 'new' && cleanText(place.name) !== '');
    const draft = {
      placeId: hasPlace ? (place.kind === 'existing' ? place.placeId : PENDING_PLACE_ID) : null,
      date: state.date,
      note: state.note,
      tastings: state.tastings.map((entry) => ({
        itemId: entry.itemId,
        itemName: entry.itemName,
        category: entry.category,
        rating: entry.rating,
        priceTotal: entry.priceTotal,
        quantity: entry.quantity,
        comment: entry.comment,
        wouldReorder: entry.wouldReorder,
        photoPath: null as string | null,
      })),
    };
    const found = validateVisitDraft(draft);
    setErrors(found);
    setSaveError(null);
    if (found) return;

    setSaving(true);
    try {
      let placeId: Id;
      if (place.kind === 'new') {
        const created = await repository.createPlace({
          name: place.name,
          type: place.type,
          address: place.address,
          lat: place.location?.lat ?? null,
          lng: place.location?.lng ?? null,
          status: 'visited',
          notes: '',
        });
        placeId = created.id;
        // If a later step fails, retrying must not create the place twice.
        setPlace({ kind: 'existing', placeId });
      } else if (place.kind === 'existing') {
        placeId = place.placeId;
      } else {
        return;
      }

      for (const [index, entry] of state.tastings.entries()) {
        if (entry.photo) draft.tastings[index]!.photoPath = await repository.uploadPhoto(placeId, entry.photo);
      }
      await repository.recordVisit({ ...draft, placeId } satisfies ValidVisitDraft);
      await refresh();
      onSaved(placeId);
    } catch (error) {
      await refresh();
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return {
    state,
    errors,
    saveError,
    saving,
    update,
    setPlace,
    updateTasting,
    addTasting,
    removeTasting,
    pickPhoto,
    removePhoto,
    submit,
  };
}
