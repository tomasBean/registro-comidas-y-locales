import styles from './Star.module.css';

const STAR_PATH = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';

/** One star filled from the left by `fill` (0 to 1). */
export function Star({ fill, size = 20 }: { fill: number; size?: number }) {
  const clamped = Math.max(0, Math.min(1, fill));
  return (
    <span className={styles.star} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size} height={size} className={styles.empty}>
        <path d={STAR_PATH} />
      </svg>
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={styles.filled}
        style={{ clipPath: `inset(0 ${(1 - clamped) * 100}% 0 0)` }}
      >
        <path d={STAR_PATH} />
      </svg>
    </span>
  );
}
