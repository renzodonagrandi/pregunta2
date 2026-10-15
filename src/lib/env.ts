import 'server-only'
import { z } from 'zod'

const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | undefined

/**
 * Validated server env. Parsed on first use (not at import) so `next build`
 * works without secrets; fails loudly the first time a request needs them.
 */
export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse(process.env)
    if (!parsed.success) {
      throw new Error(
        `Invalid environment variables:\n${z.prettifyError(parsed.error)}`,
      )
    }
    cached = parsed.data
  }
  return cached
}
