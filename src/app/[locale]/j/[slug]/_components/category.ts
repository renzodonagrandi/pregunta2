import type { CategoryDef, GameState } from '@/features/match/engine'

export function categoryById(
  state: GameState,
  id: string,
): CategoryDef | undefined {
  return state.game.categories.find(c => c.id === id)
}

export function categoryName(state: GameState, id: string): string {
  return categoryById(state, id)?.name ?? ''
}
