import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit doesn't read Next's env files; load the local one if present.
if (!process.env.DATABASE_URL && existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

export default defineConfig({
  schema: './src/features/*/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Migrations prefer the direct (non-pgbouncer) connection when available.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  },
})
