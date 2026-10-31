import 'server-only'
import { randomInt } from 'node:crypto'
import { and, eq, lt, sql } from 'drizzle-orm'
import { getPlayableGame } from '@/features/games/queries'
import { generateEditToken, hashEditToken } from '@/features/games/tokens'
import {
  createInitialState,
  gameReducer,
  type GameDefinition,
  type Rng,
} from '@/features/match/engine'
import { getDb } from '@/lib/db'
import { generateInviteCode } from './codes'
import { loadMatch, seatOf, toMatchView } from './queries'
import { applyClientAction, statusOf, type ClientAction } from './rules'
import { matches, matchPlayers } from './schema'
import type { MatchView } from './types'

/** Server-side randomness for wheel results and question picks. */
const serverRng: Rng = () => randomInt(0, 2 ** 32) / 2 ** 32

export type OnlineError =
  | 'GAME_NOT_FOUND'
  | 'MATCH_NOT_FOUND'
  | 'MATCH_FULL'
  | 'NOT_A_PLAYER'
  | 'NOT_YOUR_TURN'
  | 'ILLEGAL'
  | 'STALE'

type Result<T> = { ok: true; value: T } | { ok: false; error: OnlineError }

/** Creates a match for a published game; the creator takes seat 0 and starts. */
export async function createMatch(
  slug: string,
  creatorName: string,
): Promise<Result<{ code: string; token: string }>> {
  const game = await getPlayableGame(slug)
  if (!game) return { ok: false, error: 'GAME_NOT_FOUND' }
  const definition: GameDefinition = {
    id: game.id,
    title: game.title,
    categories: game.categories,
    questions: game.questions,
  }
  const db = getDb()
  const token = generateEditToken()
  // Codes are random over ~850 billion values; retry on the rare collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateInviteCode()
    const matchId = crypto.randomUUID()
    try {
      await db.batch([
        db.insert(matches).values({
          id: matchId,
          code,
          gameId: game.id,
          state: createInitialState(definition),
          status: 'waiting',
        }),
        db.insert(matchPlayers).values({
          matchId,
          seat: 0,
          name: creatorName,
          tokenHash: hashEditToken(token),
        }),
      ])
      return { ok: true, value: { code, token } }
    } catch (error) {
      if (attempt === 2) throw error
    }
  }
  throw new Error('unreachable')
}

/** The invited player takes seat 1 and the match starts. */
export async function joinMatch(
  code: string,
  name: string,
): Promise<Result<{ token: string }>> {
  const loaded = await loadMatch(code)
  if (!loaded) return { ok: false, error: 'MATCH_NOT_FOUND' }
  const { match, players } = loaded
  const creator = players.find(p => p.seat === 0)
  if (match.status !== 'waiting' || players.length !== 1 || !creator) {
    return { ok: false, error: 'MATCH_FULL' }
  }
  const state = gameReducer(match.state, {
    type: 'SET_PLAYERS',
    names: [creator.name, name],
  })
  const token = generateEditToken()
  const db = getDb()
  try {
    // One transaction: the seat insert fails if someone else joined first.
    await db.batch([
      db.insert(matchPlayers).values({
        matchId: match.id,
        seat: 1,
        name,
        tokenHash: hashEditToken(token),
      }),
      db
        .update(matches)
        .set({
          state,
          status: statusOf(state),
          version: sql`${matches.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(eq(matches.id, match.id), eq(matches.version, match.version)),
        ),
    ])
  } catch {
    return { ok: false, error: 'MATCH_FULL' }
  }
  return { ok: true, value: { token } }
}

/**
 * Applies a player's move. Optimistic concurrency: the write only lands if
 * nobody changed the match since it was read.
 */
export async function playMove(
  code: string,
  token: string | null,
  action: ClientAction,
): Promise<Result<MatchView>> {
  const loaded = await loadMatch(code)
  if (!loaded) return { ok: false, error: 'MATCH_NOT_FOUND' }
  const { match, players } = loaded
  const seat = seatOf(players, token)
  if (seat === null) return { ok: false, error: 'NOT_A_PLAYER' }
  const result = applyClientAction(match.state, seat, action, serverRng)
  if (!result.ok) return { ok: false, error: result.error }
  const [updated] = await getDb()
    .update(matches)
    .set({
      state: result.state,
      status: statusOf(result.state),
      version: match.version + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(matches.id, match.id), eq(matches.version, match.version)))
    .returning()
  if (!updated) return { ok: false, error: 'STALE' }
  return { ok: true, value: toMatchView(updated, players, seat) }
}

/** Keeps the free database small: drops matches idle for 30+ days. */
export async function deleteStaleMatches(): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  await getDb().delete(matches).where(lt(matches.updatedAt, cutoff))
}
