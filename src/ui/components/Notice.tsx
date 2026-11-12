import type { ReactNode } from 'react';
import styles from './Notice.module.css';

/** Inline message. `error` is announced to screen readers right away. */
export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error'; children: ReactNode }) {
  return (
    <p className={[styles.notice, styles[tone]].join(' ')} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
