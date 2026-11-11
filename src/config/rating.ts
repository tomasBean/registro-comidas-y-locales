/**
 * Rating scale: the ONLY place that knows how ratings are stored and shown.
 *
 * Stored: integers from `storedMin` to `storedMax` (half-star steps).
 * Shown: stored / `displayDivisor`, so 1–10 stored reads as 0,5–5 stars.
 *
 * To show a 0–10 scale instead, set `displayDivisor` to 1 and `displayMax` to 10.
 */
export const ratingScale = {
  storedMin: 1,
  storedMax: 10,
  displayDivisor: 2,
  displayMax: 5,
  locale: 'es-AR',
} as const;

export function isValidStoredRating(value: number): boolean {
  return Number.isInteger(value) && value >= ratingScale.storedMin && value <= ratingScale.storedMax;
}

/** Converts a stored rating (or an average of stored ratings) to the display scale. */
export function toDisplayRating(stored: number): number {
  return stored / ratingScale.displayDivisor;
}

export function toStoredRating(display: number): number {
  return Math.round(display * ratingScale.displayDivisor);
}

/** "3,5", "4": at most one decimal, comma as decimal separator. */
export function formatRating(stored: number): string {
  return new Intl.NumberFormat(ratingScale.locale, { maximumFractionDigits: 1 }).format(
    toDisplayRating(stored),
  );
}
