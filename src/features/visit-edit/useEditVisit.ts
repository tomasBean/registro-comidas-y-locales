import { useCallback, useEffect, useRef, useState } from 'react';
import type { TastingPatch } from '../../data/repository';
import type { Id } from '../../domain/types';
import { validateVisitDraft } from '../../domain/visits';
import type { VisitDetail, VisitDraftErrors } from '../../domain/visits';
import { useData } from '../app/DataProvider';
import { errorMessage } from '../app/errors';
import { compressImage } from '../photos/compressImage';
import type { TastingEntry } from '../visit-form/useVisitForm';

/** A saved tasting being edited. `photoPath` is the stored photo; `photo` is a replacement waiting for upload. */
export interface EditEntry extends TastingEntry {
  tastingId: Id;
}

export interface EditVisitState {
  date: string;
  note: string;
  tastings: EditEntry[];
}

function initialState(detail: VisitDetail): EditVisitState {
  return {
    date: detail.visit.date,
    note: detail.visit.note,
    tastings: detail.tastings.map(({ tasting, item }) => ({
      tastingId: tasting.id,
      key: tasting.id,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      rating: tasting.rating,
      priceTotal: tasting.priceTotal,
      quantity: tasting.quantity,
      comment: tasting.comment,
      wouldReorder: tasting.wouldReorder,
      photoPath: tasting.photoPath,
      photo: null,
      previewUrl: null,
      photoBusy: false,
      photoError: null,
    })),
  };
}

/**
 * State and actions of the "editar visita" form. Date, note and the details of each item
 * can change; the place and which items were ordered stay as recorded.
 */
export function useEditVisit(detail: VisitDetail, onSaved: (placeId: Id) => void) {
  const { repository, refresh } = useData();
  const [state, setState] = useState<EditVisitState>(() => initialState(detail));
  const [errors, setErrors] = useState<VisitDraftErrors | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Blob URLs we create for new photos; stored photos get their URL from the repository.
  const ownPreviews = useRef(new Set<string>());
  useEffect(() => {
    const urls = ownPreviews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // Show the photos already stored.
  useEffect(() => {
    let cancelled = false;
    for (const { tasting } of detail.tastings) {
      if (!tasting.photoPath) continue;
      repository.photoUrl(tasting.photoPath).then(
        (url) => {
          if (cancelled) return;
          setState((current) => ({
            ...current,
            tastings: current.tastings.map((entry) =>
              entry.tastingId === tasting.id && entry.previewUrl === null && entry.photoPath === tasting.photoPath
                ? { ...entry, previewUrl: url }
                : entry,
            ),
          }));
        },
        () => undefined,
      );
    }
    return () => {
      cancelled = true;
    };
  }, [repository, detail]);

  const update = (patch: Partial<Pick<EditVisitState, 'date' | 'note'>>) =>
    setState((current) => ({ ...current, ...patch }));

  const updateTasting = useCallback(
    (key: string, patch: Partial<EditEntry>) =>
      setState((current) => ({
        ...current,
        tastings: current.tastings.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)),
      })),
    [],
  );

  async function pickPhoto(key: string, file: File) {
    updateTasting(key, { photoBusy: true, photoError: null });
    try {
      const photo = await compressImage(file);
      const previewUrl = URL.createObjectURL(photo);
      ownPreviews.current.add(previewUrl);
      updateTasting(key, { photo, previewUrl, photoBusy: false });
    } catch (error) {
      updateTasting(key, { photoBusy: false, photoError: errorMessage(error) });
    }
  }

  const removePhoto = (key: string) => updateTasting(key, { photo: null, photoPath: null, previewUrl: null });

  async function submit() {
    const draft = {
      placeId: detail.place.id,
      date: state.date,
      note: state.note,
      tastings: state.tastings,
    };
    const found = validateVisitDraft(draft);
    setErrors(found);
    setSaveError(null);
    if (found) return;

    setSaving(true);
    try {
      for (const entry of state.tastings) {
        let photoPath = entry.photoPath;
        if (entry.photo) {
          photoPath = await repository.uploadPhoto(detail.place.id, entry.photo);
          // If a later step fails, retrying must not upload the same photo again.
          updateTasting(entry.key, { photo: null, photoPath });
        }
        const patch: TastingPatch = {
          rating: entry.rating!,
          priceTotal: entry.priceTotal,
          quantity: entry.quantity,
          comment: entry.comment,
          wouldReorder: entry.wouldReorder,
          photoPath,
        };
        await repository.updateTasting(entry.tastingId, patch);
      }
      await repository.updateVisit(detail.visit.id, {
        date: state.date,
        note: state.note,
      });
      await refresh();
      onSaved(detail.place.id);
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
    updateTasting,
    pickPhoto,
    removePhoto,
    submit,
  };
}
