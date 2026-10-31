import { describe, expect, it } from 'vitest'
import {
  createInitialState,
  createRng,
  gameReducer,
  type GameDefinition,
  type GameState,
} from '@/features/match/engine'
import {
  applyClientAction,
  canAct,
  clientActionSchema,
  sanitizeForPlayer,
  statusOf,
  toEngineAction,
} from './rules'

const game: GameDefinition = {
  id: 'g',
  title: 'T',
  categories: ['a', 'b', 'c'].map(id => ({
    id,
    name: id,
    color: '#000000',
    imageUrl: null,
  })),
  questions: ['a', 'b', 'c'].flatMap(c =>
    [0, 1].map(i => ({
      id: `${c}${i}`,
      categoryId: c,
      text: `${c}${i}?`,
      options: ['r', 'w1', 'w2', 'w3'] as const,
      correctIndex: 0,
    })),
  ),
}

function started(): GameState {
  return gameReducer(createInitialState(game), {
    type: 'SET_PLAYERS',
    names: ['Ana', 'Beto'],
  })
}

describe('status', () => {
  it('is waiting until both players are in, then active, then finished', () => {
    expect(statusOf(createInitialState(game))).toBe('waiting')
    expect(statusOf(started())).toBe('active')
    expect(
      statusOf({ ...started(), phase: { name: 'FINISHED', winner: 0 } }),
    ).toBe('finished')
  })
})

describe('turns', () => {
  it('only the current player can act', () => {
    const s = started()
    expect(canAct(s, 0, { type: 'START_TURN' })).toBe(true)
    expect(canAct(s, 1, { type: 'START_TURN' })).toBe(false)
    const r = applyClientAction(s, 1, { type: 'START_TURN' }, createRng(1))
    expect(r).toEqual({ ok: false, error: 'NOT_YOUR_TURN' })
  })

  it('a wrong answer hands the turn to the other player', () => {
    const rng = createRng(3)
    let s = started()
    for (const action of [{ type: 'START_TURN' }, { type: 'SPIN' }] as const) {
      const r = applyClientAction(s, 0, action, rng)
      if (!r.ok) throw new Error(r.error)
      s = r.state
    }
    // Land on a category (skip the crown) for this test.
    if (s.phase.name === 'REVEAL' && s.phase.segment.kind === 'crown') {
      s = {
        ...s,
        phase: {
          name: 'REVEAL',
          segmentIndex: 0,
          segment: { kind: 'category', categoryId: 'a' },
        },
      }
    }
    for (const action of [
      { type: 'CONTINUE' },
      { type: 'ANSWER', optionIndex: 1 },
      { type: 'CONTINUE' },
    ] as const) {
      const r = applyClientAction(s, 0, action, rng)
      if (!r.ok) throw new Error(r.error)
      s = r.state
    }
    expect(s.current).toBe(1)
    expect(canAct(s, 1, { type: 'START_TURN' })).toBe(true)
    expect(canAct(s, 0, { type: 'START_TURN' })).toBe(false)
  })

  it('rejects illegal actions for the current phase', () => {
    const r = applyClientAction(started(), 0, { type: 'SPIN' }, createRng(1))
    expect(r).toEqual({ ok: false, error: 'ILLEGAL' })
  })

  it('either player can ask for a rematch once finished, nothing else', () => {
    const s: GameState = {
      ...started(),
      phase: { name: 'FINISHED', winner: 1 },
    }
    expect(canAct(s, 0, { type: 'REMATCH' })).toBe(true)
    expect(canAct(s, 1, { type: 'REMATCH' })).toBe(true)
    expect(canAct(s, 0, { type: 'START_TURN' })).toBe(false)
    expect(canAct(started(), 0, { type: 'REMATCH' })).toBe(false)
  })

  it('nobody plays before the second player joins', () => {
    expect(canAct(createInitialState(game), 0, { type: 'START_TURN' })).toBe(
      false,
    )
  })
})

describe('server-side randomness', () => {
  it('the wheel result and seeds come from the server rng', () => {
    const s = { ...started(), phase: { name: 'SPINNING' as const } }
    const a = toEngineAction({ type: 'SPIN' }, s, createRng(7))
    const b = toEngineAction({ type: 'SPIN' }, s, createRng(7))
    expect(a).toEqual(b)
    expect(a).toMatchObject({ type: 'SPIN' })
    expect(
      toEngineAction({ type: 'CONTINUE' }, s, createRng(1)),
    ).toHaveProperty('seed')
  })

  it('the client cannot smuggle a wheel result or seed in', () => {
    const parsed = clientActionSchema.parse({ type: 'SPIN', segmentIndex: 3 })
    expect(parsed).toEqual({ type: 'SPIN' })
    expect(
      clientActionSchema.safeParse({ type: 'ANSWER', optionIndex: 9 }).success,
    ).toBe(false)
    expect(clientActionSchema.safeParse({ type: 'HACK' }).success).toBe(false)
  })
})

describe('what the browser sees', () => {
  it('only the current question, without its answer until answered', () => {
    let s = started()
    s = gameReducer(s, { type: 'START_TURN' })
    s = gameReducer(s, { type: 'SPIN', segmentIndex: 0 })
    s = gameReducer(s, { type: 'CONTINUE', seed: 1 })
    const before = sanitizeForPlayer(s)
    expect(before.game.questions).toHaveLength(1)
    expect(before.game.questions[0]?.correctIndex).toBe(-1)
    expect(before.questionLastUsed).toEqual({})

    const answered = sanitizeForPlayer(
      gameReducer(s, { type: 'ANSWER', optionIndex: 2 }),
    )
    expect(answered.game.questions[0]?.correctIndex).toBe(0)
  })

  it('no questions at all outside the question phase', () => {
    expect(sanitizeForPlayer(started()).game.questions).toEqual([])
  })
})

describe('engine actions to server intents', async () => {
  const { toClientAction } = await import('./client-actions')
  it('drops seeds and wheel results, and every intent passes validation', () => {
    const actions = [
      { type: 'SPIN', segmentIndex: 2 },
      { type: 'CONTINUE', seed: 9 },
      { type: 'ANSWER', optionIndex: 1 },
      { type: 'PLAY_FOR_CATEGORY', categoryId: 'a', seed: 4 },
      { type: 'START_DUEL', stakeId: 'a', targetId: 'b', seed: 4 },
      { type: 'START_TURN' },
      { type: 'OPEN_DUEL' },
      { type: 'CANCEL_DUEL' },
      { type: 'REMATCH' },
    ] as const
    for (const action of actions) {
      const intent = toClientAction(action)
      expect(intent).not.toHaveProperty('seed')
      expect(intent).not.toHaveProperty('segmentIndex')
      expect(clientActionSchema.safeParse(intent).success).toBe(true)
    }
    expect(
      toClientAction({ type: 'SET_PLAYERS', names: ['a', 'b'] }),
    ).toBeNull()
  })
})
