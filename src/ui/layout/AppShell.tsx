import type { ReactNode } from 'react';
import styles from './AppShell.module.css';

interface AppShellProps {
  title: string;
  children: ReactNode;
}

/** Page frame: sticky header plus scrollable content, respecting iOS safe areas. */
export function AppShell({ title, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
