/** Limits for photos before upload (BRIEF.md §4.9). */
export const PHOTO_MAX_SIDE = 1600;
export const PHOTO_JPEG_QUALITY = 0.8;

export interface Size {
  width: number;
  height: number;
}

/** Scales a size down so its longest side fits `maxSide`. Never scales up. */
export function fitWithin(size: Size, maxSide: number = PHOTO_MAX_SIDE): Size {
  const longest = Math.max(size.width, size.height);
  if (longest <= maxSide || longest === 0) return { ...size };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}
