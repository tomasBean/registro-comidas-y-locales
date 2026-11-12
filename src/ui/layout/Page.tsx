import type { ReactNode } from 'react';
import styles from './Page.module.css';

interface PageProps {
  title: string;
  /** Renders a back control when provided. */
  onBack?: () => void;
  /** Optional control on the right side of the header. */
  action?: ReactNode;
  children: ReactNode;
}

/** Screen frame: sticky header plus content, respecting iOS safe areas. */
export function Page({ title, onBack, action, children }: PageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {onBack ? (
            <button type="button" className={styles.back} onClick={onBack} aria-label="Volver">
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
          <h1 className={styles.title}>{title}</h1>
          {action ? <div className={styles.action}>{action}</div> : null}
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
