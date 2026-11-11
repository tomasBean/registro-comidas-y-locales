import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export const cardClassName = styles.card!;
export const cardLinkClassName = `${styles.card} ${styles.link}`;

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={[styles.card, className].filter(Boolean).join(' ')} {...rest} />;
}

/** Titled group of content inside a screen. */
export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stack({ children, gap = 'md' }: { children: ReactNode; gap?: 'sm' | 'md' }) {
  return <div className={[styles.stack, gap === 'sm' ? styles.stackSm : ''].join(' ')}>{children}</div>;
}
