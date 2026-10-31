import type { Dispatch } from 'react'
import type { GameAction, GameState, Phase } from '@/features/match/engine'

export interface ScreenProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

export type PhaseOf<N extends Phase['name']> = Extract<Phase, { name: N }>
