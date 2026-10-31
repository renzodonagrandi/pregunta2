import 'server-only'
import { desc, eq, inArray, sql } from 'drizzle-orm'
import { hashEditToken } from '@/features/games/tokens'
import type { PlayerIndex } from '@/features/match/engine'
import { getDb } from '@/lib/db'
import { sanitizeForPlayer } from './rules'
import { matches, matchPlayers } from './schema'
import type { MatchSummary, MatchView } from './types'

export type MatchRow = typeof matches.$inferSelect
export type PlayerRow = typeof matchPlayers.$inferSelect

/** A match and its players, in one round trip. */
export async function loadMatch(
  code: string,
): Promise<{ match: MatchRow; players: PlayerRow[] } | null> {
  const db = getDb()
  const ids = db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.code, code))
  const [rows, players] = await db.batch([
    db.select().from(matches).where(eq(matches.code, code)).limit(1),
    db
      .select()
      .from(matchPlayers)
      .where(inArray(matchPlayers.matchId, ids))
      .orderBy(matchPlayers.seat),
  ])
  const [match] = rows
  return match ? { match, players } : null
}

export function seatOf(
  players: PlayerRow[],
  token: string | null,
): PlayerIndex | null {
  if (!token) return null
  const hash = hashEditToken(token)
  return players.find(p => p.tokenHash === hash)?.seat ?? null
}

export function toMatchView(
  match: MatchRow,
  players: PlayerRow[],
  seat: PlayerIndex | null,
): MatchView {
  return {
    code: match.code,
    title: match.state.game.title,
    status: match.status,
    version: match.version,
    seat,
    players: players.map(p => ({ seat: p.seat, name: p.name })),
    state: sanitizeForPlayer(match.state),
  }
}

export async function getMatchView(
  code: string,
  token: string | null,
): Promise<MatchView | null> {
  const loaded = await loadMatch(code)
  if (!loaded) return null
  const { match, players } = loaded
  return toMatchView(match, players, seatOf(players, token))
}

/** Cheap check for polling: only the version, no state. */
export async function getMatchVersion(code: string): Promise<number | null> {
  const [row] = await getDb()
    .select({ version: matches.version })
    .from(matches)
    .where(eq(matches.code, code))
    .limit(1)
  return row?.version ?? null
}

/** Matches this browser plays in, newest activity first. */
export async function listMyMatches(
  tokens: Map<string, string>,
): Promise<MatchSummary[]> {
  if (tokens.size === 0) return []
  const db = getDb()
  const hashes = [...tokens.values()].map(hashEditToken)
  const mine = await db
    .select({
      seat: matchPlayers.seat,
      matchId: matchPlayers.matchId,
      code: matches.code,
      status: matches.status,
      // Just the two fields the list shows, not the whole game snapshot.
      title: sql<string>`${matches.state}->'game'->>'title'`,
      current: sql<number>`(${matches.state}->>'current')::int`,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(inArray(matchPlayers.tokenHash, hashes))
    .orderBy(desc(matches.updatedAt))
    .limit(30)
  if (mine.length === 0) return []
  const all = await db
    .select({
      matchId: matchPlayers.matchId,
      seat: matchPlayers.seat,
      name: matchPlayers.name,
    })
    .from(matchPlayers)
    .where(
      inArray(
        matchPlayers.matchId,
        mine.map(m => m.matchId),
      ),
    )
  return mine.map(m => ({
    code: m.code,
    title: m.title,
    status: m.status,
    myTurn: m.status === 'active' && m.current === m.seat,
    rivalName:
      all.find(p => p.matchId === m.matchId && p.seat !== m.seat)?.name ?? null,
  }))
}
