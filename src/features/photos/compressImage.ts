import { fitWithin, PHOTO_JPEG_QUALITY, PHOTO_MAX_SIDE } from '../../domain/photos';

export class ImageError extends Error {}

async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Some formats decode only through <img>; fall through.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, close: () => undefined };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Resizes to at most 1600 px on the longest side and re-encodes as JPEG, in the browser. */
export async function compressImage(file: Blob): Promise<Blob> {
  let decoded;
  try {
    decoded = await decode(file);
  } catch (cause) {
    throw new ImageError('No pudimos leer esa imagen. Probá con otra.', { cause });
  }
  try {
    const size = fitWithin({ width: decoded.width, height: decoded.height }, PHOTO_MAX_SIDE);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) throw new ImageError('No pudimos procesar la imagen en este dispositivo.');
    // JPEG has no transparency: paint white behind PNGs.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(decoded.source, 0, 0, size.width, size.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', PHOTO_JPEG_QUALITY),
    );
    if (!blob) throw new ImageError('No pudimos procesar la imagen en este dispositivo.');
    return blob;
  } finally {
    decoded.close();
  }
}
