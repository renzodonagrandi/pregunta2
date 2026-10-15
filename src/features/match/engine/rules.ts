import type {
  CategoryId,
  GameDefinition,
  GameState,
  Player,
  PlayerIndex,
  Segment,
} from './types'
import { MAX_CATEGORIES, MIN_CATEGORIES, OPTION_COUNT } from './types'

export type GameDefinitionError =
  | { code: 'CATEGORY_COUNT'; count: number }
  | { code: 'DUPLICATE_CATEGORY'; categoryId: CategoryId }
  | { code: 'NO_QUESTIONS'; categoryId: CategoryId }
  | { code: 'BAD_QUESTION'; questionId: string }

/** Checks the invariants the engine relies on. Empty array means playable. */
export function validateGameDefinition(
  game: GameDefinition,
): GameDefinitionError[] {
  const errors: GameDefinitionError[] = []
  const count = game.categories.length
  if (count < MIN_CATEGORIES || count > MAX_CATEGORIES) {
    errors.push({ code: 'CATEGORY_COUNT', count })
  }
  const ids = new Set<CategoryId>()
  for (const c of game.categories) {
    if (ids.has(c.id))
      errors.push({ code: 'DUPLICATE_CATEGORY', categoryId: c.id })
    ids.add(c.id)
  }
  for (const q of game.questions) {
    const valid =
      ids.has(q.categoryId) &&
      q.options.length === OPTION_COUNT &&
      Number.isInteger(q.correctIndex) &&
      q.correctIndex >= 0 &&
      q.correctIndex < OPTION_COUNT
    if (!valid) errors.push({ code: 'BAD_QUESTION', questionId: q.id })
  }
  for (const c of game.categories) {
    if (!game.questions.some(q => q.categoryId === c.id)) {
      errors.push({ code: 'NO_QUESTIONS', categoryId: c.id })
    }
  }
  return errors
}

/** Wheel slices: one per category (in order), then the crown. */
export function getSegments(game: GameDefinition): Segment[] {
  return [
    ...game.categories.map((c): Segment => ({
      kind: 'category',
      categoryId: c.id,
    })),
    { kind: 'crown' },
  ]
}

export function rivalOf(index: PlayerIndex): PlayerIndex {
  return index === 0 ? 1 : 0
}

export function hasCategory(player: Player, id: CategoryId): boolean {
  return player.categories.includes(id)
}

export function hasAllCategories(
  game: GameDefinition,
  player: Player,
): boolean {
  return game.categories.every(c => hasCategory(player, c.id))
}

/** Categories the current player can play for directly. */
export function claimableCategories(state: GameState): CategoryId[] {
  const me = state.players[state.current]
  return state.game.categories.map(c => c.id).filter(id => !hasCategory(me, id))
}

/** Own categories the rival lacks: what the challenger can put at stake. */
export function duelStakeOptions(state: GameState): CategoryId[] {
  const me = state.players[state.current]
  const rival = state.players[rivalOf(state.current)]
  return me.categories.filter(id => !hasCategory(rival, id))
}

/** Rival categories the challenger can target. */
export function duelTargetOptions(state: GameState): CategoryId[] {
  return [...state.players[rivalOf(state.current)].categories]
}

export function canDuel(state: GameState): boolean {
  return (
    duelStakeOptions(state).length > 0 && duelTargetOptions(state).length > 0
  )
}

export function findWinner(state: GameState): PlayerIndex | null {
  // The active player is checked first; only one player can complete the set
  // per transition, but the rival can win on the challenger's turn.
  const order: PlayerIndex[] = [state.current, rivalOf(state.current)]
  for (const index of order) {
    if (hasAllCategories(state.game, state.players[index])) return index
  }
  return null
}
