import { ratingScale } from '../../config/rating';
import styles from './Sparkline.module.css';

interface SparklineProps {
  /** Stored ratings, oldest first. */
  values: number[];
  width?: number;
  height?: number;
  label: string;
}

/** Tiny line chart of ratings over time; the last point is highlighted. */
export function Sparkline({ values, width = 96, height = 32, label }: SparklineProps) {
  if (values.length === 0) return null;
  const pad = 4;
  const span = ratingScale.storedMax - ratingScale.storedMin || 1;
  const x = (index: number) =>
    values.length === 1 ? width / 2 : pad + (index * (width - pad * 2)) / (values.length - 1);
  const y = (value: number) => height - pad - ((value - ratingScale.storedMin) * (height - pad * 2)) / span;
  const points = values.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  const last = values.length - 1;

  return (
    <svg className={styles.sparkline} width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {values.length > 1 ? <polyline className={styles.line} points={points} /> : null}
      {values.slice(0, last).map((value, index) => (
        <circle key={index} className={styles.dot} cx={x(index)} cy={y(value)} r="2" />
      ))}
      <circle className={styles.last} cx={x(last)} cy={y(values[last]!)} r="3.5" />
    </svg>
  );
}
