import { useEffect, useState } from 'react';
import { useData } from '../app/DataProvider';
import styles from './Photo.module.css';

/** Resolves a storage path to a displayable URL. Null while loading or on failure. */
function usePhotoUrl(path: string | null): string | null {
  const { repository } = useData();
  const [resolved, setResolved] = useState<{ path: string; url: string } | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    repository.photoUrl(path).then(
      (url) => {
        if (!cancelled) setResolved({ path, url });
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [repository, path]);

  return resolved && resolved.path === path ? resolved.url : null;
}

interface PhotoProps {
  path: string;
  alt: string;
  /** Square thumbnail (cropped) or full image. */
  shape?: 'thumb' | 'full';
}

/** A stored photo. Thumbnails open the full image in a new tab. */
export function Photo({ path, alt, shape = 'thumb' }: PhotoProps) {
  const url = usePhotoUrl(path);
  if (!url) return <span className={[styles.photo, styles[shape], styles.placeholder].join(' ')} aria-hidden="true" />;
  const image = <img className={[styles.photo, styles[shape]].join(' ')} src={url} alt={alt} loading="lazy" />;
  if (shape === 'full') return image;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={styles.link}>
      {image}
    </a>
  );
}
