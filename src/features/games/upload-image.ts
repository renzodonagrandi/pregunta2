import { upload } from '@vercel/blob/client'
import type { UploadPayload } from './schemas'

/**
 * Compresses an image in the browser (WebP, longest side <= maxSide) and
 * uploads it straight to Vercel Blob; our route only signs the request.
 * Returns the public URL.
 */
export async function compressAndUpload(
  file: File,
  {
    pathname,
    maxSide,
    payload,
  }: { pathname: string; maxSide: number; payload: UploadPayload },
): Promise<string> {
  // Loaded on demand: only editors who upload pay for the library.
  const { default: imageCompression } =
    await import('browser-image-compression')
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: maxSide,
    maxSizeMB: maxSide > 600 ? 0.35 : 0.3,
    fileType: 'image/webp',
    initialQuality: 0.85,
    useWebWorker: true,
  })
  const blob = await upload(pathname, compressed, {
    access: 'public',
    handleUploadUrl: '/api/blob/upload',
    clientPayload: JSON.stringify(payload),
    contentType: 'image/webp',
  })
  return blob.url
}
