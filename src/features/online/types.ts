import type { GameState, PlayerIndex } from '@/features/match/engine'
import type { MatchStatus } from './rules'

export interface MatchPlayerView {
  seat: PlayerIndex
  name: string
}

/** What a browser gets for a match: the state is sanitized (no answers). */
export interface MatchView {
  code: string
  title: string
  status: MatchStatus
  version: number
  /** The viewer's seat, or null when they're not a player of this match. */
  seat: PlayerIndex | null
  players: MatchPlayerView[]
  state: GameState
}

/** A row of "Tus partidas" on the home page. */
export interface MatchSummary {
  code: string
  title: string
  status: MatchStatus
  myTurn: boolean
  rivalName: string | null
}
