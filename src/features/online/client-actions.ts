import type { GameAction } from '@/features/match/engine'
import type { ClientAction } from './rules'

/**
 * The match screens speak engine actions. Online, the browser only sends the
 * intent: seeds and wheel results are dropped (the server picks them), and
 * SET_PLAYERS doesn't exist (joining is its own step).
 */
export function toClientAction(action: GameAction): ClientAction | null {
  switch (action.type) {
    case 'SET_PLAYERS':
      return null
    case 'SPIN':
      return { type: 'SPIN' }
    case 'CONTINUE':
      return { type: 'CONTINUE' }
    case 'ANSWER':
      return { type: 'ANSWER', optionIndex: action.optionIndex }
    case 'PLAY_FOR_CATEGORY':
      return { type: 'PLAY_FOR_CATEGORY', categoryId: action.categoryId }
    case 'START_DUEL':
      return {
        type: 'START_DUEL',
        stakeId: action.stakeId,
        targetId: action.targetId,
      }
    case 'START_TURN':
    case 'OPEN_DUEL':
    case 'CANCEL_DUEL':
    case 'REMATCH':
      return { type: action.type }
  }
}
