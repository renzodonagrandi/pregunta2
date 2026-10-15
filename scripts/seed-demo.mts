// Inserts the sample game as a published game with slug "demo".
// Usage: pnpm db:seed   (reads DATABASE_URL from .env.local)
import { createHash, randomBytes } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { SAMPLE_GAME } from '../src/features/games/sample-game.ts'
import * as schema from '../src/features/games/schema.ts'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')
const db = drizzle(neon(url), { schema })

const existing = await db
  .select({ id: schema.games.id })
  .from(schema.games)
  .where(eq(schema.games.slug, SAMPLE_GAME.slug))
if (existing.length > 0) {
  console.log(`Game "${SAMPLE_GAME.slug}" already exists, nothing to do.`)
  process.exit(0)
}

const token = randomBytes(32).toString('base64url')
const gameId = crypto.randomUUID()
const categoryIds = new Map(
  SAMPLE_GAME.categories.map(c => [c.id, crypto.randomUUID()]),
)

await db.batch([
  db.insert(schema.games).values({
    id: gameId,
    slug: SAMPLE_GAME.slug,
    editTokenHash: createHash('sha256').update(token).digest('hex'),
    title: SAMPLE_GAME.title,
    published: true,
  }),
  db.insert(schema.categories).values(
    SAMPLE_GAME.categories.map((c, i) => ({
      id: categoryIds.get(c.id) as string,
      gameId,
      name: c.name,
      color: c.color,
      imageUrl: c.imageUrl,
      sortOrder: i,
    })),
  ),
  db.insert(schema.questions).values(
    SAMPLE_GAME.questions.map(q => ({
      categoryId: categoryIds.get(q.categoryId) as string,
      text: q.text,
      options: [...q.options] as [string, string, string, string],
      correctIndex: q.correctIndex,
    })),
  ),
])

console.log(`Seeded "${SAMPLE_GAME.title}" → /j/${SAMPLE_GAME.slug}`)
console.log(`Edit link (keep it secret): /edit/${token}`)
