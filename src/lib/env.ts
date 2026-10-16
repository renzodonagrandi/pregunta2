import 'server-only'
import { z } from 'zod'

/**
 * Validated server env, one getter per capability: a missing Blob token must
 * only break uploads, never pages that just read the database. Values are
 * parsed on first use (not at import) so `next build` works without secrets.
 */
function lazyEnv<T>(name: string, schema: z.ZodType<T>): () => T {
  let cached: T | undefined
  return () => {
    if (cached === undefined) {
      const parsed = schema.safeParse(process.env[name])
      if (!parsed.success) {
        throw new Error(
          `Invalid environment variable ${name}: ${z.prettifyError(parsed.error)}`,
        )
      }
      cached = parsed.data
    }
    return cached
  }
}

export const databaseUrl = lazyEnv('DATABASE_URL', z.url())

/** Read-write token of the PUBLIC Blob store; needed to sign client uploads. */
export const blobToken = lazyEnv('BLOB_READ_WRITE_TOKEN', z.string().min(1))
