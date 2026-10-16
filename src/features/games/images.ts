import 'server-only'
import { del } from '@vercel/blob'
import { blobToken } from '@/lib/env'
import { categoryImagePathname, questionImagePathname } from './schemas'

/**
 * Only accept URLs that our upload route could have produced: public Blob
 * host + the signed pathname (plus Blob's random suffix before `.webp`).
 */
function isSignedBlobUrl(value: string, signedPathname: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  const prefix = `/${signedPathname.replace(/\.webp$/, '')}`
  return (
    url.protocol === 'https:' &&
    url.hostname.endsWith('.public.blob.vercel-storage.com') &&
    url.pathname.startsWith(prefix) &&
    url.pathname.endsWith('.webp') &&
    !url.pathname.slice(prefix.length).includes('/')
  )
}

export function isCategoryImageUrl(
  value: string,
  gameId: string,
  categoryId: string,
): boolean {
  return isSignedBlobUrl(value, categoryImagePathname(gameId, categoryId))
}

export function isQuestionImageUrl(value: string, gameId: string): boolean {
  return isSignedBlobUrl(value, questionImagePathname(gameId))
}

/** Best-effort removal of replaced or orphaned images (keeps storage small). */
export async function deleteImagesQuietly(
  urls: (string | null | undefined)[],
): Promise<void> {
  const list = urls.filter((u): u is string => Boolean(u))
  if (list.length === 0) return
  try {
    await del(list, { token: blobToken() })
  } catch (error) {
    console.error('Failed to delete blobs', list, error)
  }
}
