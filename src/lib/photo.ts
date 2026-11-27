// Photos are shrunk on the phone before upload: longest edge 1,600 px, JPEG
// at quality 0.8. Drawing through a canvas also turns iPhone HEIC photos into
// JPEG and drops their location (EXIF) data.
import { ApiError, NETWORK_MESSAGE } from './api';

export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.8;
/** The server accepts up to 4 MB (Vercel's request limit is 4.5 MB). */
export const MAX_BYTES = 4 * 1024 * 1024;

/** Size that fits within max×max, keeping the aspect ratio; never enlarges. */
export function fitWithin(width: number, height: number, max = MAX_EDGE): { width: number; height: number } {
  if (!(width > 0 && height > 0)) throw new Error('Invalid image size');
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export interface CompressedPhoto {
  blob: Blob;
  width: number;
  height: number;
}

type Decoded = { source: CanvasImageSource; width: number; height: number; close(): void };

/**
 * Decodes the photo upright. Phones often store portrait photos as sideways
 * pixels plus an EXIF "rotate 90°" tag. An <img> applies that tag (its
 * natural size is the upright size, and drawImage draws it upright) in
 * Safari, Chrome and Firefox. createImageBitmap does not in Safari: it ignores
 * imageOrientation for Blobs (WebKit bug 237895), which uploaded iPhone
 * portraits sideways. So <img> comes first; createImageBitmap is only a
 * fallback for files an <img> can't open.
 */
async function decode(file: Blob): Promise<Decoded> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
  }
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // fall through
    }
  }
  throw new Error('That file isn’t a photo this phone can open.');
}

export async function compressImage(file: Blob): Promise<CompressedPhoto> {
  const img = await decode(file);
  try {
    const { width, height } = fitWithin(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Couldn’t process the photo.');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.source, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) throw new Error('Couldn’t process the photo.');
    if (blob.size > MAX_BYTES) throw new Error('That photo is still too big after shrinking it. Try another.');
    return { blob, width, height };
  } finally {
    img.close();
  }
}

/** Uploads a compressed photo, reporting progress from 0 to 1. */
export function uploadPhoto(
  watchId: string,
  photo: CompressedPhoto,
  onProgress: (fraction: number) => void,
): Promise<{ id: string; url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const qs = new URLSearchParams({ watchId, w: String(photo.width), h: String(photo.height) });
    xhr.open('POST', `/api/photo-upload?${qs}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', 'image/jpeg');
    xhr.setRequestHeader('X-Requested-With', 'watch-app');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new ApiError('network', 0, NETWORK_MESSAGE));
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as { data?: { id: string; url: string }; error?: { code: string; message: string } };
        if (body.data) return resolve(body.data);
        reject(new ApiError(body.error?.code ?? 'server_error', xhr.status, body.error?.message ?? 'Upload failed.'));
      } catch {
        reject(new ApiError('server_error', xhr.status, 'Upload failed. Please try again.'));
      }
    };
    xhr.send(photo.blob);
  });
}
