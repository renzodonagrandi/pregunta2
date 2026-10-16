import 'server-only'
import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '@/features/games/schema'
import { databaseUrl } from './env'

export type Db = NeonHttpDatabase<typeof schema>

let db: Db | undefined

/** Lazily created Drizzle client over Neon's HTTP driver. */
export function getDb(): Db {
  db ??= drizzle(neon(databaseUrl()), { schema })
  return db
}
