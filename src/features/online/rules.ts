import * as z from 'zod/mini'
import {
  gameReducer,
  getSegments,
  makeSeed,
  randomInt,
  type GameAction,
  type GameState,
  type PlayerIndex,
  type Rng,
} from '@/features/match/engine'

// Pure rules for online matches: shared by server actions and tests. The
// browser sends intents only; randomness and validation happen on the server.

export type MatchStatus = 'waiting' | 'active' | 'finished'

const id = z.string().check(z.minLength(1), z.maxLength(64))

/** What a player's browser may ask for. No seeds, no wheel results. */
export const clientActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('START_TURN') }),
  z.object({ type: z.literal('SPIN') }),
  z.object({ type: z.literal('CONTINUE') }),
  z.object({
    type: z.literal('ANSWER'),
    optionIndex: z.int().check(z.minimum(0), z.maximum(3)),
  }),
  z.object({ type: z.literal('PLAY_FOR_CATEGORY'), categoryId: id }),
  z.object({ type: z.literal('OPEN_DUEL') }),
  z.object({ type: z.literal('CANCEL_DUEL') }),
  z.object({ type: z.literal('START_DUEL'), stakeId: id, targetId: id }),
  z.object({ type: z.literal('REMATCH') }),
])

export type ClientAction = z.infer<typeof clientActionSchema>

/** Adds the random parts on the server; the client never chooses them. */
export function toEngineAction(
  action: ClientAction,
  state: GameState,
  rng: Rng,
): GameAction {
  switch (action.type) {
    case 'SPIN':
      return {
        type: 'SPIN',
        segmentIndex: randomInt(rng, getSegments(state.game).length),
      }
    case 'CONTINUE':
      return { type: 'CONTINUE', seed: makeSeed(rng) }
    case 'PLAY_FOR_CATEGORY':
      return { ...action, seed: makeSeed(rng) }
    case 'START_DUEL':
      return { ...action, seed: makeSeed(rng) }
    default:
      return action
  }
}

/** Only the player whose turn it is acts; either player may ask for a rematch. */
export function canAct(
  state: GameState,
  seat: PlayerIndex,
  action: ClientAction,
): boolean {
  if (state.phase.name === 'SETUP_PLAYERS') return false
  if (state.phase.name === 'FINISHED') return action.type === 'REMATCH'
  return state.current === seat && action.type !== 'REMATCH'
}

export type ApplyResult =
  | { ok: true; state: GameState }
  | { ok: false; error: 'NOT_YOUR_TURN' | 'ILLEGAL' }

export function applyClientAction(
  state: GameState,
  seat: PlayerIndex,
  action: ClientAction,
  rng: Rng,
): ApplyResult {
  if (!canAct(state, seat, action)) return { ok: false, error: 'NOT_YOUR_TURN' }
  const next = gameReducer(state, toEngineAction(action, state, rng))
  // The reducer returns the same object for illegal actions.
  if (next === state) return { ok: false, error: 'ILLEGAL' }
  return { ok: true, state: next }
}

export function statusOf(state: GameState): MatchStatus {
  if (state.phase.name === 'SETUP_PLAYERS') return 'waiting'
  if (state.phase.name === 'FINISHED') return 'finished'
  return 'active'
}

/**
 * What a player's browser may see: the question being asked (without its
 * answer until it's answered) and nothing else from the question bank.
 */
export function sanitizeForPlayer(state: GameState): GameState {
  const { phase } = state
  let questions: GameState['game']['questions'] = []
  if (phase.name === 'QUESTION') {
    const current = state.game.questions.find(
      q => q.id === phase.question.questionId,
    )
    if (current) {
      questions = [
        phase.question.answer ? current : { ...current, correctIndex: -1 },
      ]
    }
  }
  return {
    ...state,
    game: { ...state.game, questions },
    questionLastUsed: {},
  }
}
