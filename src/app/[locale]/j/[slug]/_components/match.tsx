'use client'

import { useEffect, useReducer, useState, useSyncExternalStore } from 'react'
import {
  createInitialState,
  gameReducer,
  type GameAction,
  type GameState,
} from '@/features/match/engine'
import type { PlayableGame } from '@/features/games/types'
import { clearMatch, loadMatch, saveMatch } from '@/features/match/storage'
import { ChooseScreen } from './choose-screen'
import { DuelSetupScreen } from './duel-setup-screen'
import { FinishedScreen } from './finished-screen'
import { MatchHeader } from './match-header'
import { MatchSkeleton } from './match-skeleton'
import { QuestionScreen } from './question-screen'
import { RevealScreen } from './reveal-screen'
import { RulesCard } from './rules-card'
import { Scoreboard } from './scoreboard'
import { SetupPlayersScreen } from './setup-players-screen'
import { SpinScreen } from './spin-screen'
import { TurnChangeScreen } from './turn-change-screen'

const noopSubscribe = () => () => {}

/**
 * Renders the skeleton on the server and during hydration, then the match
 * restored from localStorage (it only exists in the browser).
 */
export function Match({ game }: { game: PlayableGame }) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
  if (!isClient) return <MatchSkeleton />
  return <MatchGame game={game} />
}

type MatchAction = GameAction | { type: 'RESET' }

function MatchGame({ game }: { game: PlayableGame }) {
  const [state, dispatch] = useReducer(
    (s: GameState, a: MatchAction) =>
      a.type === 'RESET' ? createInitialState(game) : gameReducer(s, a),
    game,
    g => loadMatch(g) ?? createInitialState(g),
  )
  // Wheel rotation survives screen changes so every spin continues forward.
  const [wheelRotation, setWheelRotation] = useState(0)

  useEffect(() => {
    saveMatch(state)
  }, [state])

  const reset = () => {
    clearMatch(game.id)
    dispatch({ type: 'RESET' })
  }

  const { phase } = state
  const inGame = phase.name !== 'SETUP_PLAYERS'

  return (
    // Phone: one column. Desktop: scoreboard pinned on the left, the stage
    // centered on the right with room for a bigger wheel and a 2x2 grid.
    <div className='mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:grid lg:max-w-6xl lg:grid-cols-[19rem_1fr] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8 lg:px-8 lg:pt-6 lg:pb-10'>
      <div className='lg:col-span-2'>
        <MatchHeader
          title={game.title}
          onRestart={inGame ? reset : undefined}
        />
      </div>
      {inGame && (
        <aside className='relative z-10 lg:sticky lg:top-6 lg:self-start'>
          <Scoreboard state={state} />
          <RulesCard />
        </aside>
      )}
      <main
        className={`flex flex-1 flex-col lg:w-full lg:pt-2 ${inGame ? 'lg:max-w-2xl' : 'lg:col-span-2 lg:mx-auto lg:max-w-md'}`}
      >
        {(() => {
          switch (phase.name) {
            case 'SETUP_PLAYERS':
              return <SetupPlayersScreen dispatch={dispatch} />
            case 'TURN_CHANGE':
              return <TurnChangeScreen state={state} dispatch={dispatch} />
            case 'SPINNING':
              return (
                <SpinScreen
                  state={state}
                  dispatch={dispatch}
                  rotation={wheelRotation}
                  onRotationChange={setWheelRotation}
                />
              )
            case 'REVEAL':
              return (
                <RevealScreen state={state} phase={phase} dispatch={dispatch} />
              )
            case 'QUESTION':
              return (
                <QuestionScreen
                  key={`${phase.question.questionId}-${state.questionClock}`}
                  state={state}
                  phase={phase}
                  dispatch={dispatch}
                />
              )
            case 'CHOOSE':
              return (
                <ChooseScreen state={state} phase={phase} dispatch={dispatch} />
              )
            case 'DUEL_SETUP':
              return <DuelSetupScreen state={state} dispatch={dispatch} />
            case 'FINISHED':
              return (
                <FinishedScreen
                  state={state}
                  phase={phase}
                  dispatch={dispatch}
                />
              )
          }
        })()}
      </main>
    </div>
  )
}
