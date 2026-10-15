import { describe, expect, it } from 'vitest'
import {
  canDuel,
  createInitialState,
  createRng,
  gameReducer,
  getSegments,
  shuffle,
  validateGameDefinition,
  type ActiveQuestion,
  type GameAction,
  type GameDefinition,
  type GameState,
  type Phase,
  type QuestionDef,
} from './index'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CATS = ['a', 'b', 'c'] as const
const CROWN = CATS.length // crown is the last wheel segment

/** Every question has the correct answer at index 0. */
function makeQuestions(categoryId: string, count: number): QuestionDef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${categoryId}${i}`,
    categoryId,
    text: `Question ${categoryId}${i}`,
    options: ['right', 'wrong1', 'wrong2', 'wrong3'] as const,
    correctIndex: 0,
  }))
}

function makeGame(questionsPerCategory = 3): GameDefinition {
  return {
    id: 'g1',
    title: 'Test',
    categories: CATS.map((id, i) => ({
      id,
      name: id.toUpperCase(),
      color: `#00000${i}`,
      imageUrl: null,
    })),
    questions: CATS.flatMap(id => makeQuestions(id, questionsPerCategory)),
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) deepFreeze(v)
    Object.freeze(value)
  }
  return value
}

/** Applies actions one by one, freezing each intermediate state. */
function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(
    (s, a) => gameReducer(deepFreeze(s), a),
    deepFreeze(state),
  )
}

/** A game at the SPINNING phase of player 0, with optional ownership/streaks. */
function spinningState(
  overrides: {
    p0?: string[]
    p1?: string[]
    streak0?: number
    streak1?: number
    current?: 0 | 1
    game?: GameDefinition
  } = {},
): GameState {
  const base = run(createInitialState(overrides.game ?? makeGame()), {
    type: 'SET_PLAYERS',
    names: ['Ana', 'Beto'],
  })
  return {
    ...base,
    current: overrides.current ?? 0,
    players: [
      {
        ...base.players[0],
        categories: overrides.p0 ?? [],
        streak: overrides.streak0 ?? 0,
      },
      {
        ...base.players[1],
        categories: overrides.p1 ?? [],
        streak: overrides.streak1 ?? 0,
      },
    ],
    phase: { name: 'SPINNING' },
  }
}

/** A state at CHOOSE for the current player. */
function chooseState(
  overrides: Parameters<typeof spinningState>[0] = {},
): GameState {
  return {
    ...spinningState(overrides),
    phase: { name: 'CHOOSE', reason: 'crown' },
  }
}

const continueAction: GameAction = { type: 'CONTINUE', seed: 1 }
const right: GameAction = { type: 'ANSWER', optionIndex: 0 }
const wrong: GameAction = { type: 'ANSWER', optionIndex: 1 }

function spinTo(index: number): GameAction {
  return { type: 'SPIN', segmentIndex: index }
}

function question(state: GameState): ActiveQuestion {
  if (state.phase.name !== 'QUESTION') {
    throw new Error(`Expected QUESTION, got ${state.phase.name}`)
  }
  return state.phase.question
}

function phaseName(state: GameState): Phase['name'] {
  return state.phase.name
}

/** Spins a category and answers. Starts and ends wherever the turn takes it. */
function spinAndAnswer(
  state: GameState,
  segment: number,
  answer: GameAction,
): GameState {
  return run(state, spinTo(segment), continueAction, answer, continueAction)
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe('setup', () => {
  it('rejects invalid game definitions', () => {
    const tooFew: GameDefinition = {
      ...makeGame(),
      categories: makeGame().categories.slice(0, 2),
    }
    expect(validateGameDefinition(tooFew)).toContainEqual({
      code: 'CATEGORY_COUNT',
      count: 2,
    })
    const noQuestions: GameDefinition = {
      ...makeGame(),
      questions: makeGame().questions.filter(q => q.categoryId !== 'b'),
    }
    expect(validateGameDefinition(noQuestions)).toContainEqual({
      code: 'NO_QUESTIONS',
      categoryId: 'b',
    })
    expect(() => createInitialState(noQuestions)).toThrow()
    expect(validateGameDefinition(makeGame())).toEqual([])
  })

  it('accepts up to 6 categories and rejects 7', () => {
    const withCount = (n: number): GameDefinition => {
      const ids = Array.from({ length: n }, (_, i) => `c${i}`)
      return {
        id: 'g',
        title: 't',
        categories: ids.map(id => ({
          id,
          name: id,
          color: '#000',
          imageUrl: null,
        })),
        questions: ids.flatMap(id => makeQuestions(id, 1)),
      }
    }
    expect(validateGameDefinition(withCount(6))).toEqual([])
    expect(validateGameDefinition(withCount(7))).toHaveLength(1)
  })

  it('builds a wheel with one segment per category plus the crown', () => {
    const segments = getSegments(makeGame())
    expect(segments).toEqual([
      { kind: 'category', categoryId: 'a' },
      { kind: 'category', categoryId: 'b' },
      { kind: 'category', categoryId: 'c' },
      { kind: 'crown' },
    ])
  })

  it('starts at SETUP_PLAYERS and moves to player 1 turn screen after names', () => {
    const initial = createInitialState(makeGame())
    expect(phaseName(initial)).toBe('SETUP_PLAYERS')
    const s = run(initial, { type: 'SET_PLAYERS', names: [' Ana ', 'Beto'] })
    expect(s.players.map(p => p.name)).toEqual(['Ana', 'Beto'])
    expect(s.current).toBe(0)
    expect(phaseName(s)).toBe('TURN_CHANGE')
    expect(phaseName(run(s, { type: 'START_TURN' }))).toBe('SPINNING')
  })

  it('rejects empty or overly long names', () => {
    const initial = createInitialState(makeGame())
    expect(run(initial, { type: 'SET_PLAYERS', names: ['Ana', '  '] })).toBe(
      initial,
    )
    expect(
      run(initial, { type: 'SET_PLAYERS', names: ['Ana', 'x'.repeat(25)] }),
    ).toBe(initial)
  })
})

// ---------------------------------------------------------------------------
// Spinning, reveal and questions
// ---------------------------------------------------------------------------

describe('spin and reveal', () => {
  it('reveals the category landed on, then asks a question from it', () => {
    const s = run(spinningState(), spinTo(1))
    expect(s.phase).toEqual({
      name: 'REVEAL',
      segmentIndex: 1,
      segment: { kind: 'category', categoryId: 'b' },
    })
    const q = question(run(s, continueAction))
    expect(q.categoryId).toBe('b')
    expect(q.questionId).toMatch(/^b/)
    expect(q.answer).toBeNull()
  })

  it('shuffles options deterministically from the seed and keeps the order in state', () => {
    const atReveal = run(spinningState(), spinTo(0))
    const q1 = question(run(atReveal, { type: 'CONTINUE', seed: 42 }))
    const q2 = question(run(atReveal, { type: 'CONTINUE', seed: 42 }))
    expect(q1).toEqual(q2)
    expect([...q1.optionOrder].sort()).toEqual([0, 1, 2, 3])
  })

  it('actually varies the option order across seeds', () => {
    const atReveal = run(spinningState(), spinTo(0))
    const orders = new Set(
      Array.from({ length: 30 }, (_, seed) =>
        question(run(atReveal, { type: 'CONTINUE', seed })).optionOrder.join(),
      ),
    )
    expect(orders.size).toBeGreaterThan(1)
  })

  it('grades the answer by original option index, not display position', () => {
    const s = run(spinningState(), spinTo(0), continueAction, right)
    expect(question(s).answer).toEqual({ selectedIndex: 0, correct: true })
    const w = run(spinningState(), spinTo(0), continueAction, wrong)
    expect(question(w).answer).toEqual({ selectedIndex: 1, correct: false })
  })
})

describe('correct-answer streak', () => {
  it('a correct answer adds 1 to the streak and the player keeps spinning', () => {
    const s = spinAndAnswer(spinningState(), 0, right)
    expect(s.players[0].streak).toBe(1)
    expect(s.current).toBe(0)
    expect(phaseName(s)).toBe('SPINNING')
  })

  it('a wrong answer passes the turn via the turn-change screen', () => {
    const s = spinAndAnswer(spinningState({ streak0: 2 }), 0, wrong)
    expect(s.current).toBe(1)
    expect(phaseName(s)).toBe('TURN_CHANGE')
    expect(phaseName(run(s, { type: 'START_TURN' }))).toBe('SPINNING')
  })

  it('the streak persists across turns', () => {
    let s = spinAndAnswer(spinningState(), 0, right) // Ana: 1
    s = spinAndAnswer(s, 1, wrong) // Ana fails, Beto's turn
    s = run(s, { type: 'START_TURN' })
    s = spinAndAnswer(s, 2, right) // Beto: 1
    s = spinAndAnswer(s, 2, wrong) // back to Ana
    expect(s.players[0].streak).toBe(1)
    expect(s.players[1].streak).toBe(1)
    s = spinAndAnswer(run(s, { type: 'START_TURN' }), 0, right)
    expect(s.players[0].streak).toBe(2)
  })

  it('reaching 3 resets the streak to 0 and goes to CHOOSE', () => {
    let s = spinningState()
    s = spinAndAnswer(s, 0, right)
    s = spinAndAnswer(s, 1, right)
    expect(s.players[0].streak).toBe(2)
    s = spinAndAnswer(s, 2, right)
    expect(s.players[0].streak).toBe(0)
    expect(s.phase).toEqual({ name: 'CHOOSE', reason: 'streak' })
  })

  it('wrong answers never change the streak', () => {
    const s = spinAndAnswer(spinningState({ streak0: 2 }), 0, wrong)
    expect(s.players[0].streak).toBe(2)
  })
})

describe('crown', () => {
  it('reveals the crown, then goes to CHOOSE and resets the streak', () => {
    let s = run(spinningState({ streak0: 2 }), spinTo(CROWN))
    expect(s.phase).toEqual({
      name: 'REVEAL',
      segmentIndex: CROWN,
      segment: { kind: 'crown' },
    })
    s = run(s, continueAction)
    expect(s.phase).toEqual({ name: 'CHOOSE', reason: 'crown' })
    expect(s.players[0].streak).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Playing for a category
// ---------------------------------------------------------------------------

describe('play for a category', () => {
  it('a correct answer wins the category and the player keeps spinning', () => {
    let s = run(chooseState(), {
      type: 'PLAY_FOR_CATEGORY',
      categoryId: 'b',
      seed: 1,
    })
    expect(s.phase).toMatchObject({
      name: 'QUESTION',
      context: { kind: 'claim', categoryId: 'b' },
    })
    expect(question(s).categoryId).toBe('b')
    s = run(s, right, continueAction)
    expect(s.players[0].categories).toEqual(['b'])
    expect(s.players[0].streak).toBe(0)
    expect(phaseName(s)).toBe('SPINNING')
    expect(s.current).toBe(0)
  })

  it('a wrong answer passes the turn without winning anything', () => {
    const s = run(
      chooseState(),
      { type: 'PLAY_FOR_CATEGORY', categoryId: 'b', seed: 1 },
      wrong,
      continueAction,
    )
    expect(s.players[0].categories).toEqual([])
    expect(s.current).toBe(1)
    expect(phaseName(s)).toBe('TURN_CHANGE')
  })

  it('cannot play for a category already owned', () => {
    const s = chooseState({ p0: ['a'] })
    expect(
      run(s, { type: 'PLAY_FOR_CATEGORY', categoryId: 'a', seed: 1 }),
    ).toBe(s)
  })

  it('can play for a category the rival owns (both may hold it)', () => {
    const s = run(
      chooseState({ p1: ['a'] }),
      { type: 'PLAY_FOR_CATEGORY', categoryId: 'a', seed: 1 },
      right,
      continueAction,
    )
    expect(s.players[0].categories).toEqual(['a'])
    expect(s.players[1].categories).toEqual(['a'])
  })
})

// ---------------------------------------------------------------------------
// Duel
// ---------------------------------------------------------------------------

describe('duel availability', () => {
  it('is unavailable when the challenger has no categories', () => {
    const s = chooseState({ p0: [], p1: ['a'] })
    expect(canDuel(s)).toBe(false)
    expect(run(s, { type: 'OPEN_DUEL' })).toBe(s)
  })

  it('is unavailable when the rival has no categories', () => {
    const s = chooseState({ p0: ['a'], p1: [] })
    expect(canDuel(s)).toBe(false)
    expect(run(s, { type: 'OPEN_DUEL' })).toBe(s)
  })

  it('is unavailable when every challenger category is also the rival’s', () => {
    const s = chooseState({ p0: ['a'], p1: ['a', 'b'] })
    expect(canDuel(s)).toBe(false)
    expect(run(s, { type: 'OPEN_DUEL' })).toBe(s)
  })

  it('is available when the challenger has one the rival lacks and the rival has any', () => {
    const s = chooseState({ p0: ['a'], p1: ['b'] })
    expect(canDuel(s)).toBe(true)
    expect(run(s, { type: 'OPEN_DUEL' }).phase).toEqual({
      name: 'DUEL_SETUP',
      reason: 'crown',
    })
  })

  it('can be cancelled back to CHOOSE', () => {
    const s = run(chooseState({ p0: ['a'], p1: ['b'] }), { type: 'OPEN_DUEL' })
    expect(run(s, { type: 'CANCEL_DUEL' }).phase).toEqual({
      name: 'CHOOSE',
      reason: 'crown',
    })
  })

  it('cannot be opened outside CHOOSE', () => {
    const s = spinningState({ p0: ['a'], p1: ['b'] })
    expect(run(s, { type: 'OPEN_DUEL' })).toBe(s)
  })
})

describe('duel setup validation', () => {
  const setup = run(chooseState({ p0: ['a', 'b'], p1: ['b'] }), {
    type: 'OPEN_DUEL',
  })

  it('rejects a stake the rival also owns', () => {
    expect(
      run(setup, { type: 'START_DUEL', stakeId: 'b', targetId: 'b', seed: 1 }),
    ).toBe(setup)
  })

  it('rejects a stake the challenger does not own', () => {
    expect(
      run(setup, { type: 'START_DUEL', stakeId: 'c', targetId: 'b', seed: 1 }),
    ).toBe(setup)
  })

  it('rejects a target the rival does not own', () => {
    expect(
      run(setup, { type: 'START_DUEL', stakeId: 'a', targetId: 'c', seed: 1 }),
    ).toBe(setup)
  })

  it('first asks a question from the staked category', () => {
    const s = run(setup, {
      type: 'START_DUEL',
      stakeId: 'a',
      targetId: 'b',
      seed: 1,
    })
    expect(question(s).categoryId).toBe('a')
    expect(s.phase).toMatchObject({
      context: { kind: 'duel', step: 1, duel: { stakeId: 'a', targetId: 'b' } },
    })
  })
})

describe('duel: steal mode', () => {
  // Ana owns a; Beto owns b and c. Ana lacks b, so targeting b is "steal".
  const start = run(chooseState({ p0: ['a'], p1: ['b', 'c'] }), {
    type: 'OPEN_DUEL',
  })
  const duel = run(start, {
    type: 'START_DUEL',
    stakeId: 'a',
    targetId: 'b',
    seed: 1,
  })

  it('detects steal mode when the challenger lacks the target', () => {
    expect(duel.phase).toMatchObject({ context: { duel: { mode: 'steal' } } })
  })

  it('winning both questions moves the target to the challenger, who keeps spinning', () => {
    let s = run(duel, right, continueAction)
    expect(question(s).categoryId).toBe('b')
    expect(s.phase).toMatchObject({ context: { kind: 'duel', step: 2 } })
    s = run(s, right, continueAction)
    expect(s.players[0].categories).toEqual(['a', 'b'])
    expect(s.players[1].categories).toEqual(['c'])
    expect(s.current).toBe(0)
    expect(phaseName(s)).toBe('SPINNING')
  })
})

describe('duel: remove mode', () => {
  // Ana owns a and b; Beto owns b. Ana already has b, so targeting b is "remove".
  const duel = run(
    chooseState({ p0: ['a', 'b'], p1: ['b'] }),
    { type: 'OPEN_DUEL' },
    { type: 'START_DUEL', stakeId: 'a', targetId: 'b', seed: 1 },
  )

  it('detects remove mode when the challenger already has the target', () => {
    expect(duel.phase).toMatchObject({ context: { duel: { mode: 'remove' } } })
  })

  it('winning both questions just removes the target from the rival', () => {
    const s = run(duel, right, continueAction, right, continueAction)
    expect(s.players[0].categories).toEqual(['a', 'b'])
    expect(s.players[1].categories).toEqual([])
    expect(s.current).toBe(0)
    expect(phaseName(s)).toBe('SPINNING')
  })
})

describe('duel: failing', () => {
  const duel = run(
    chooseState({ p0: ['a'], p1: ['b'] }),
    { type: 'OPEN_DUEL' },
    { type: 'START_DUEL', stakeId: 'a', targetId: 'b', seed: 1 },
  )

  it('failing the first question ends the duel without a second question', () => {
    const answered = run(duel, wrong)
    const clockBefore = answered.questionClock
    const s = run(answered, continueAction)
    // No second question was drawn.
    expect(s.questionClock).toBe(clockBefore)
    expect(phaseName(s)).toBe('TURN_CHANGE')
    // Stake passes to the rival, the turn passes.
    expect(s.players[0].categories).toEqual([])
    expect(s.players[1].categories).toEqual(['b', 'a'])
    expect(s.current).toBe(1)
  })

  it('failing the second question also loses the stake and the turn', () => {
    const s = run(duel, right, continueAction, wrong, continueAction)
    expect(s.players[0].categories).toEqual([])
    expect(s.players[1].categories).toEqual(['b', 'a'])
    expect(s.current).toBe(1)
    expect(phaseName(s)).toBe('TURN_CHANGE')
  })
})

// ---------------------------------------------------------------------------
// Victory
// ---------------------------------------------------------------------------

describe('victory', () => {
  it('winning the last category by playing for it finishes the game', () => {
    const s = run(
      chooseState({ p0: ['a', 'b'] }),
      { type: 'PLAY_FOR_CATEGORY', categoryId: 'c', seed: 1 },
      right,
      continueAction,
    )
    expect(s.phase).toEqual({ name: 'FINISHED', winner: 0 })
  })

  it('stealing the last category finishes the game', () => {
    const s = run(
      chooseState({ p0: ['a', 'b'], p1: ['c'] }),
      { type: 'OPEN_DUEL' },
      { type: 'START_DUEL', stakeId: 'a', targetId: 'c', seed: 1 },
      right,
      continueAction,
      right,
      continueAction,
    )
    expect(s.phase).toEqual({ name: 'FINISHED', winner: 0 })
  })

  it('a failed duel can hand the rival the win on the challenger’s turn', () => {
    // Beto has b and c; Ana stakes a (the one Beto lacks) and loses it.
    const s = run(
      chooseState({ p0: ['a'], p1: ['b', 'c'] }),
      { type: 'OPEN_DUEL' },
      { type: 'START_DUEL', stakeId: 'a', targetId: 'b', seed: 1 },
      wrong,
      continueAction,
    )
    expect(s.phase).toEqual({ name: 'FINISHED', winner: 1 })
  })

  it('ignores gameplay actions once finished', () => {
    const s: GameState = {
      ...spinningState(),
      phase: { name: 'FINISHED', winner: 0 },
    }
    expect(run(s, spinTo(0))).toBe(s)
    expect(run(s, continueAction)).toBe(s)
  })

  it('rematch keeps the game and names but resets everything else', () => {
    const played = run(
      chooseState({ p0: ['a', 'b'], p1: ['c'], streak1: 2, current: 0 }),
      { type: 'PLAY_FOR_CATEGORY', categoryId: 'c', seed: 1 },
      right,
      continueAction,
    )
    expect(played.questionClock).toBe(1)
    const s = run(played, { type: 'REMATCH' })
    expect(s.game).toBe(played.game)
    expect(s.players).toEqual([
      { name: 'Ana', streak: 0, categories: [] },
      { name: 'Beto', streak: 0, categories: [] },
    ])
    expect(s.current).toBe(0)
    expect(s.questionLastUsed).toEqual({})
    expect(s.questionClock).toBe(0)
    expect(phaseName(s)).toBe('TURN_CHANGE')
  })
})

// ---------------------------------------------------------------------------
// Question recycling
// ---------------------------------------------------------------------------

describe('question recycling', () => {
  /** Draws n questions from category a (wrong answers, alternating players). */
  function drawMany(state: GameState, n: number, seed = 7): string[] {
    const rng = createRng(seed)
    const ids: string[] = []
    let s = state
    for (let i = 0; i < n; i++) {
      s = run(s, spinTo(0), {
        type: 'CONTINUE',
        seed: Math.floor(rng() * 1e9),
      })
      ids.push(question(s).questionId)
      s = run(s, wrong, continueAction, { type: 'START_TURN' })
    }
    return ids
  }

  it('does not repeat a question until the category is exhausted', () => {
    const ids = drawMany(spinningState({ game: makeGame(5) }), 5)
    expect(new Set(ids).size).toBe(5)
  })

  it('then recycles starting with the least recently used', () => {
    const ids = drawMany(spinningState({ game: makeGame(4) }), 12)
    const firstRound = ids.slice(0, 4)
    // Every later draw repeats the order of the first round.
    expect(ids.slice(4, 8)).toEqual(firstRound)
    expect(ids.slice(8, 12)).toEqual(firstRound)
  })

  it('keeps per-category usage independent', () => {
    let s = spinningState({ game: makeGame(1) })
    s = run(s, spinTo(0), continueAction)
    expect(question(s).questionId).toBe('a0')
    s = run(s, right, continueAction, spinTo(1), continueAction)
    expect(question(s).questionId).toBe('b0')
  })

  it('a category with a single question just keeps repeating it', () => {
    const ids = drawMany(spinningState({ game: makeGame(1) }), 3)
    expect(ids).toEqual(['a0', 'a0', 'a0'])
  })
})

// ---------------------------------------------------------------------------
// Edge cases & robustness
// ---------------------------------------------------------------------------

describe('player without possible choices', () => {
  it('a player missing any category can always play for it, so CHOOSE is never a dead end', () => {
    // Worst case for choices: rival owns the only category the player lacks,
    // and the player has nothing the rival lacks, so no duel.
    const s = run(
      spinningState({ p0: ['a', 'b'], p1: ['a', 'b', 'c'].slice(0, 2) }),
      spinTo(CROWN),
      continueAction,
    )
    expect(s.phase).toEqual({ name: 'CHOOSE', reason: 'crown' })
    expect(canDuel(s)).toBe(false)
    const next = run(s, { type: 'PLAY_FOR_CATEGORY', categoryId: 'c', seed: 1 })
    expect(phaseName(next)).toBe('QUESTION')
  })

  it('if a player somehow reaches CHOOSE with nothing to claim, the game is already won', () => {
    // Inconsistent state (should not happen): player owns everything yet is still playing.
    const s = run(
      spinningState({ p0: ['a', 'b', 'c'], p1: ['a'] }),
      spinTo(CROWN),
      continueAction,
    )
    expect(s.phase).toEqual({ name: 'FINISHED', winner: 0 })
  })
})

describe('illegal actions leave the state untouched', () => {
  it('rejects out-of-range or fractional spin results', () => {
    const s = spinningState()
    expect(run(s, spinTo(-1))).toBe(s)
    expect(run(s, spinTo(CROWN + 1))).toBe(s)
    expect(run(s, spinTo(0.5))).toBe(s)
  })

  it('rejects answers outside 0..3 and a second answer', () => {
    const s = run(spinningState(), spinTo(0), continueAction)
    expect(run(s, { type: 'ANSWER', optionIndex: 4 })).toBe(s)
    expect(run(s, { type: 'ANSWER', optionIndex: -1 })).toBe(s)
    const answered = run(s, wrong)
    expect(run(answered, right)).toBe(answered)
  })

  it('rejects CONTINUE before answering', () => {
    const s = run(spinningState(), spinTo(0), continueAction)
    expect(run(s, continueAction)).toBe(s)
  })

  it('rejects actions in the wrong phase', () => {
    const s = spinningState()
    expect(run(s, right)).toBe(s)
    expect(run(s, continueAction)).toBe(s)
    expect(run(s, { type: 'START_TURN' })).toBe(s)
    expect(run(s, { type: 'REMATCH' })).toBe(s)
    expect(
      run(s, { type: 'PLAY_FOR_CATEGORY', categoryId: 'a', seed: 1 }),
    ).toBe(s)
    expect(
      run(s, { type: 'START_DUEL', stakeId: 'a', targetId: 'b', seed: 1 }),
    ).toBe(s)
    expect(run(s, { type: 'SET_PLAYERS', names: ['X', 'Y'] })).toBe(s)
  })
})

describe('purity', () => {
  it('never mutates its input (frozen states) and is deterministic', () => {
    const start = spinningState({ p0: ['a'], p1: ['b'] })
    const actions: GameAction[] = [
      spinTo(CROWN),
      continueAction,
      { type: 'OPEN_DUEL' },
      { type: 'START_DUEL', stakeId: 'a', targetId: 'b', seed: 99 },
      right,
      continueAction,
      wrong,
      continueAction,
    ]
    const snapshot = JSON.stringify(start)
    const a = run(start, ...actions)
    const b = run(start, ...actions)
    expect(a).toEqual(b)
    expect(JSON.stringify(start)).toBe(snapshot)
  })

  it('state survives a JSON round-trip (for localStorage)', () => {
    const s = run(spinningState(), spinTo(0), continueAction)
    const restored = JSON.parse(JSON.stringify(s)) as GameState
    expect(restored).toEqual(s)
    expect(run(restored, right)).toEqual(run(s, right))
  })
})

describe('random helpers', () => {
  it('createRng is deterministic and in [0, 1)', () => {
    const a = createRng(123)
    const b = createRng(123)
    for (let i = 0; i < 100; i++) {
      const x = a()
      expect(x).toBe(b())
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })

  it('shuffle returns a permutation', () => {
    const out = shuffle([1, 2, 3, 4, 5], createRng(5))
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
  })
})
