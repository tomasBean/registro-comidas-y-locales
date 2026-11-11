import type { ButtonHTMLAttributes } from 'react';
import styles from './Chip.module.css';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Small tappable pill: suggestions and filters. */
export function Chip({ selected = false, className, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={[styles.chip, selected ? styles.selected : '', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

export function ChipRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className={styles.row} role="group" aria-label={label}>
      {children}
    </div>
  );
}

/** Non-interactive label with the same look. */
export function Tag({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'accent' }) {
  return <span className={[styles.tag, tone === 'accent' ? styles.tagAccent : ''].join(' ')}>{children}</span>;
}
