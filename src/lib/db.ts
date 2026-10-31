import 'server-only'
import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as gamesSchema from '@/features/games/schema'
import * as onlineSchema from '@/features/online/schema'
import { databaseUrl } from './env'

const schema = { ...gamesSchema, ...onlineSchema }

export type Db = NeonHttpDatabase<typeof schema>

let db: Db | undefined

/** Lazily created Drizzle client over Neon's HTTP driver. */
export function getDb(): Db {
  db ??= drizzle(neon(databaseUrl()), { schema })
  return db
}
