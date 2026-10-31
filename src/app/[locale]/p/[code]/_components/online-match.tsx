'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState, type ReactNode } from 'react'
import { rivalOf, type GameAction } from '@/features/match/engine'
import { ChooseScreen } from '@/features/match/ui/choose-screen'
import { DuelSetupScreen } from '@/features/match/ui/duel-setup-screen'
import { FinishedScreen } from '@/features/match/ui/finished-screen'
import { MatchHeader } from '@/features/match/ui/match-header'
import { QuestionScreen } from '@/features/match/ui/question-screen'
import { RevealScreen } from '@/features/match/ui/reveal-screen'
import { Scoreboard } from '@/features/match/ui/scoreboard'
import { SpinScreen } from '@/features/match/ui/spin-screen'
import { toClientAction } from '@/features/online/client-actions'
import type { MatchView } from '@/features/online/types'
import { playMoveAction, type OnlineActionResult } from '../actions'
import { InviteScreen } from './invite-screen'
import { JoinScreen, MatchFullScreen } from './join-screen'
import { TurnStartScreen, WaitingTurnScreen } from './turn-screens'
import { useMatchPolling } from './use-match-polling'

const NETWORK_ERROR: OnlineActionResult = {
  ok: false,
  error: 'UNKNOWN' as never,
  view: null,
}

export function OnlineMatch({
  initialView,
  sidebar,
}: {
  initialView: MatchView
  sidebar?: ReactNode
}) {
  const t = useTranslations('Online')
  const [view, setView] = useState(initialView)
  const [error, setError] = useState<string | null>(null)
  const [wheelRotation, setWheelRotation] = useState(0)
  // Shown while a move travels to the server, so taps aren't silently lost.
  const [pending, setPending] = useState(false)
  // A move in flight: ignore extra taps instead of sending duplicates.
  const sending = useRef(false)
  // After a spin, the server's result waits here until the wheel stops.
  const pendingAfterSpin = useRef<MatchView | null>(null)

  const { state, seat, status, code } = view
  const myTurn = seat !== null && status === 'active' && state.current === seat
  const rivalName = seat === null ? '' : state.players[rivalOf(seat)].name

  const apply = (result: OnlineActionResult) => {
    if (result.view) setView(result.view)
    setError(result.ok ? null : t(`errors.${result.error}`))
  }

  const send = async (intent: Parameters<typeof playMoveAction>[1]) => {
    if (sending.current) return null
    sending.current = true
    setPending(true)
    try {
      return await playMoveAction(code, intent)
    } catch {
      return NETWORK_ERROR
    } finally {
      sending.current = false
      setPending(false)
    }
  }

  const dispatch = (action: GameAction) => {
    const intent = toClientAction(action)
    if (!intent) return
    void send(intent).then(result => result && apply(result))
  }

  const remoteSpin = {
    request: async () => {
      const result = await send({ type: 'SPIN' })
      if (!result) return null
      if (!result.ok || result.view.state.phase.name !== 'REVEAL') {
        apply(result)
        return null
      }
      pendingAfterSpin.current = result.view
      return result.view.state.phase.segmentIndex
    },
    done: () => {
      const next = pendingAfterSpin.current
      pendingAfterSpin.current = null
      if (next) apply({ ok: true, view: next })
    },
  }

  // Poll while waiting for someone else: the rival's turn, the invitee
  // joining, or a rematch after the end.
  useMatchPolling({
    code,
    version: view.version,
    enabled:
      seat !== null &&
      (status === 'waiting' || status === 'finished' || !myTurn),
    onUpdate: next => {
      setView(next)
      setError(null)
    },
  })

  if (seat === null) {
    return (
      <Shell title={view.title}>
        <main className='flex flex-1 flex-col'>
          {status === 'waiting' ? (
            <JoinScreen view={view} onResult={apply} />
          ) : (
            <MatchFullScreen />
          )}
          <ErrorNote error={error} />
        </main>
      </Shell>
    )
  }

  if (status === 'waiting') {
    return (
      <Shell title={view.title}>
        <main className='flex flex-1 flex-col'>
          <InviteScreen code={code} title={view.title} />
        </main>
      </Shell>
    )
  }

  const { phase } = state
  const screen = (() => {
    if (phase.name === 'FINISHED') {
      return <FinishedScreen state={state} phase={phase} dispatch={dispatch} />
    }
    if (!myTurn) return <WaitingTurnScreen rivalName={rivalName} />
    switch (phase.name) {
      case 'TURN_CHANGE':
        return (
          <TurnStartScreen
            rivalName={rivalName}
            onStart={() => dispatch({ type: 'START_TURN' })}
          />
        )
      case 'SPINNING':
        return (
          <SpinScreen
            state={state}
            dispatch={dispatch}
            rotation={wheelRotation}
            onRotationChange={setWheelRotation}
            remote={remoteSpin}
          />
        )
      case 'REVEAL':
        return <RevealScreen state={state} phase={phase} dispatch={dispatch} />
      case 'QUESTION':
        return (
          <QuestionScreen
            key={phase.question.questionId}
            state={state}
            phase={phase}
            dispatch={dispatch}
          />
        )
      case 'CHOOSE':
        return <ChooseScreen state={state} phase={phase} dispatch={dispatch} />
      case 'DUEL_SETUP':
        return <DuelSetupScreen state={state} dispatch={dispatch} />
      default:
        return null
    }
  })()

  return (
    <Shell title={view.title} wide>
      <aside className='relative z-10 lg:sticky lg:top-6 lg:self-start'>
        <Scoreboard state={state} you={seat} youLabel={t('turn.you')} />
        {sidebar}
      </aside>
      <main
        aria-busy={pending}
        className={`flex flex-1 flex-col transition-opacity lg:w-full lg:max-w-2xl lg:pt-2 ${pending ? 'pointer-events-none opacity-70' : ''}`}
      >
        {screen}
        <ErrorNote error={error} />
      </main>
    </Shell>
  )
}

/** Same frame as the local match: one column on phones, two on desktop. */
function Shell({
  title,
  wide = false,
  children,
}: {
  title: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:pt-6 lg:pb-10 ${wide ? 'lg:grid lg:max-w-6xl lg:grid-cols-[19rem_1fr] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8 lg:px-8' : ''}`}
    >
      <div className={wide ? 'lg:col-span-2' : ''}>
        <MatchHeader title={title} onRestart={undefined} />
      </div>
      {children}
    </div>
  )
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p
      className='mt-4 rounded-xl border-l-4 border-bad bg-night-800 p-3 text-sm'
      role='alert'
    >
      {error}
    </p>
  )
}
