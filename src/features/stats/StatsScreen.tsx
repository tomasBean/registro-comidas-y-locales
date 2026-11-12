import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMonth, formatPrice, todayIsoDate } from '../../config/locale';
import { listCategories } from '../../domain/categories';
import { categoryRanking } from '../../domain/items';
import { mostVisitedPlaces, rankPlacesByAverage } from '../../domain/places';
import { monthOf, spendingByMonth } from '../../domain/stats';
import type { Dataset } from '../../domain/types';
import { Card, Section } from '../../ui/components/Card';
import { Chip, ChipRow } from '../../ui/components/Chip';
import { RatingStars } from '../../ui/components/RatingStars';
import { EmptyState } from '../../ui/layout/EmptyState';
import { Page } from '../../ui/layout/Page';
import { LoadGate } from '../app/LoadGate';
import { routes } from '../app/routes';
import styles from './StatsScreen.module.css';

const TOP = 10;
const visitsLabel = (count: number) => (count === 1 ? '1 visita' : `${count} visitas`);
const timesLabel = (count: number) => (count === 1 ? '1 vez' : `${count} veces`);

type Period = 'month' | 'all';

function PeriodPicker({ label, value, onChange }: { label: string; value: Period; onChange: (value: Period) => void }) {
  return (
    <ChipRow label={label}>
      <Chip selected={value === 'month'} onClick={() => onChange('month')}>
        Este mes
      </Chip>
      <Chip selected={value === 'all'} onClick={() => onChange('all')}>
        Histórico
      </Chip>
    </ChipRow>
  );
}

function StatsContent({ dataset }: { dataset: Dataset }) {
  const currentMonth = monthOf(todayIsoDate());
  const [visitedPeriod, setVisitedPeriod] = useState<Period>('month');
  const [rankingPeriod, setRankingPeriod] = useState<Period>('all');
  const categories = listCategories(dataset.items);
  const [category, setCategory] = useState(categories[0]?.label ?? '');

  if (dataset.visits.length === 0) {
    return <EmptyState title="Todavía no hay datos" description="Las estadísticas aparecen cuando registren visitas." />;
  }

  const filter = (period: Period) => (period === 'month' ? { month: currentMonth } : {});
  const mostVisited = mostVisitedPlaces(dataset, filter(visitedPeriod)).slice(0, TOP);
  const placeRanking = rankPlacesByAverage(dataset, filter(rankingPeriod)).slice(0, TOP);
  const bestItems = category ? categoryRanking(dataset, category).filter((entry) => entry.timesTried > 0).slice(0, TOP) : [];
  const spending = spendingByMonth(dataset);
  const maxSpending = Math.max(...spending.map((month) => month.total), 1);

  return (
    <>
      <Section title="Más visitados">
        <PeriodPicker label="Período de más visitados" value={visitedPeriod} onChange={setVisitedPeriod} />
        {mostVisited.length === 0 ? (
          <p className={styles.muted}>Todavía no hay visitas en {formatMonth(currentMonth)}.</p>
        ) : (
          <Card>
            <ol className={styles.ranking} aria-label="Más visitados">
              {mostVisited.map((summary, index) => (
                <li key={summary.place.id} className={styles.row}>
                  <span className={styles.position}>{index + 1}</span>
                  <Link to={routes.place(summary.place.id)} className={styles.name}>
                    {summary.place.name}
                  </Link>
                  <span className={styles.value}>{visitsLabel(summary.visitCount)}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </Section>

      <Section title="Ranking de lugares">
        <PeriodPicker label="Período del ranking de lugares" value={rankingPeriod} onChange={setRankingPeriod} />
        {placeRanking.length === 0 ? (
          <p className={styles.muted}>Todavía no hay puntajes en {formatMonth(currentMonth)}.</p>
        ) : (
          <Card>
            <ol className={styles.ranking} aria-label="Ranking de lugares">
              {placeRanking.map((summary, index) => (
                <li key={summary.place.id} className={styles.row}>
                  <span className={styles.position}>{index + 1}</span>
                  <Link to={routes.place(summary.place.id)} className={styles.name}>
                    {summary.place.name}
                  </Link>
                  <RatingStars value={summary.average} size={14} />
                </li>
              ))}
            </ol>
          </Card>
        )}
      </Section>

      {categories.length > 0 ? (
        <Section title="Mejores por categoría">
          <ChipRow label="Categoría del ranking">
            {categories.map((option) => (
              <Chip key={option.key} selected={option.label === category} onClick={() => setCategory(option.label)}>
                {option.label}
              </Chip>
            ))}
          </ChipRow>
          {bestItems.length === 0 ? (
            <p className={styles.muted}>Todavía no probaron nada de esta categoría.</p>
          ) : (
            <Card>
              <ol className={styles.ranking} aria-label={`Mejores de ${category}`}>
                {bestItems.map((entry, index) => (
                  <li key={entry.item.id} className={styles.row}>
                    <span className={styles.position}>{index + 1}</span>
                    <Link to={routes.item(entry.item.id)} className={styles.name}>
                      {entry.item.name}
                      <span className={styles.sub}>
                        {entry.place.name} · {timesLabel(entry.timesTried)}
                      </span>
                    </Link>
                    <RatingStars value={entry.average} size={14} />
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </Section>
      ) : null}

      <Section title="Gasto por mes">
        <Card>
          <ul className={styles.ranking} aria-label="Gasto por mes">
            {spending.map((month) => (
              <li key={month.month} className={styles.spending}>
                <div className={styles.spendingTop}>
                  <span className={styles.month}>{formatMonth(month.month)}</span>
                  <span className={styles.amount}>{formatPrice(month.total)}</span>
                </div>
                <div className={styles.bar} aria-hidden="true">
                  <span style={{ width: `${(month.total / maxSpending) * 100}%` }} />
                </div>
                <p className={styles.sub}>
                  {visitsLabel(month.visitCount)}
                  {month.unpricedCount > 0
                    ? ` · ${month.unpricedCount === 1 ? '1 ítem sin precio' : `${month.unpricedCount} ítems sin precio`}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <p className={styles.muted}>Suma solo los ítems que tienen precio cargado.</p>
      </Section>
    </>
  );
}

export function StatsScreen() {
  return (
    <Page title="Resumen">
      <LoadGate>{(dataset) => <StatsContent dataset={dataset} />}</LoadGate>
    </Page>
  );
}
