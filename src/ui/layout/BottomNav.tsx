import type { ReactNode } from 'react';
import styles from './BottomNav.module.css';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: ReactNode;
  /** Rendered by the caller as a router link; BottomNav stays routing-agnostic. */
  render: (props: { className: string; children: ReactNode }) => ReactNode;
  active: boolean;
  /** The main action, drawn as a filled button. */
  primary?: boolean;
}

export function BottomNav({ items }: { items: BottomNavItem[] }) {
  return (
    <nav className={styles.nav} aria-label="Principal">
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.key} className={styles.entry}>
            {item.render({
              className: [styles.link, item.active ? styles.active : '', item.primary ? styles.primary : '']
                .filter(Boolean)
                .join(' '),
              children: (
                <>
                  <span className={styles.icon} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className={styles.label}>{item.label}</span>
                </>
              ),
            })}
          </li>
        ))}
      </ul>
    </nav>
  );
}
