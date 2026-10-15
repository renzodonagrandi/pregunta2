import 'server-only'
import { del } from '@vercel/blob'
import { serverEnv } from '@/lib/env'
import { categoryImagePathname } from './schemas'

/**
 * Only accept URLs that our upload route could have produced for this exact
 * category: public Blob host + the signed pathname (plus Blob's random suffix).
 */
export function isCategoryImageUrl(
  value: string,
  gameId: string,
  categoryId: string,
): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  const expected = categoryImagePathname(gameId, categoryId).replace(
    /\.webp$/,
    '',
  )
  return (
    url.protocol === 'https:' &&
    url.hostname.endsWith('.public.blob.vercel-storage.com') &&
    url.pathname.startsWith(`/${expected}`) &&
    url.pathname.endsWith('.webp')
  )
}

/** Best-effort removal of a replaced or orphaned image (keeps storage small). */
export async function deleteImageQuietly(url: string | null): Promise<void> {
  if (!url) return
  try {
    await del(url, { token: serverEnv().BLOB_READ_WRITE_TOKEN })
  } catch (error) {
    console.error('Failed to delete blob', url, error)
  }
}
