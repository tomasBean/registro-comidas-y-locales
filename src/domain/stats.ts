import type { Dataset, IsoDate } from './types';

export interface MonthSpending {
  /** "YYYY-MM". */
  month: string;
  /** Sum of the known prices, in whole ARS. */
  total: number;
  visitCount: number;
  /** Tastings that count towards the total. */
  pricedCount: number;
  /** Tastings of the month without a price: the total is a lower bound when above zero. */
  unpricedCount: number;
}

export function monthOf(date: IsoDate): string {
  return date.slice(0, 7);
}

/** Money spent per month, newest first. Months without visits are not listed. */
export function spendingByMonth(dataset: Dataset): MonthSpending[] {
  const months = new Map<string, MonthSpending>();
  const monthByVisit = new Map<string, string>();
  for (const visit of dataset.visits) {
    const month = monthOf(visit.date);
    monthByVisit.set(visit.id, month);
    const entry = months.get(month) ?? { month, total: 0, visitCount: 0, pricedCount: 0, unpricedCount: 0 };
    entry.visitCount += 1;
    months.set(month, entry);
  }
  for (const tasting of dataset.tastings) {
    const month = monthByVisit.get(tasting.visitId);
    const entry = month ? months.get(month) : undefined;
    if (!entry) continue;
    if (tasting.priceTotal === null) {
      entry.unpricedCount += 1;
    } else {
      entry.total += tasting.priceTotal;
      entry.pricedCount += 1;
    }
  }
  return [...months.values()].sort((a, b) => b.month.localeCompare(a.month));
}
