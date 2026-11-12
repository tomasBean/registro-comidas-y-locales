export const LOCALE = 'es-AR';
export const CURRENCY = 'ARS';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

/** Whole pesos: 6000 -> "$ 6.000". */
export function formatPrice(amount: number): string {
  return currencyFormatter.format(amount);
}

/**
 * Calendar dates travel as ISO strings ("2026-11-11") and are never passed through
 * `Date`, so they cannot shift a day because of time zones.
 */
export function formatDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) throw new Error(`Invalid ISO date: ${isoDate}`);
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/** Today's calendar date in the device's time zone, as an ISO string. */
export function todayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const monthFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "2026-11" -> "noviembre de 2026". */
export function formatMonth(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new Error(`Invalid month: ${month}`);
  return monthFormatter.format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
}
