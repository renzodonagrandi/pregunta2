import { createRng, randomInt, shuffle, type Rng } from './random'
import {
  canDuel,
  claimableCategories,
  duelStakeOptions,
  duelTargetOptions,
  findWinner,
  getSegments,
  hasCategory,
  rivalOf,
  validateGameDefinition,
} from './rules'
import type {
  ActiveQuestion,
  CategoryId,
  ChooseReason,
  Duel,
  GameAction,
  GameDefinition,
  GameState,
  Player,
  PlayerIndex,
  QuestionContext,
} from './types'
import { OPTION_COUNT, STATE_VERSION, STREAK_TARGET } from './types'

export const MAX_NAME_LENGTH = 24

function newPlayer(name: string): Player {
  return { name, streak: 0, categories: [] }
}

export function createInitialState(game: GameDefinition): GameState {
  const errors = validateGameDefinition(game)
  if (errors.length > 0) {
    throw new Error(`Invalid game definition: ${JSON.stringify(errors)}`)
  }
  return {
    version: STATE_VERSION,
    game,
    players: [newPlayer(''), newPlayer('')],
    current: 0,
    phase: { name: 'SETUP_PLAYERS' },
    questionLastUsed: {},
    questionClock: 0,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const phase = state.phase
  switch (action.type) {
    case 'SET_PLAYERS': {
      if (phase.name !== 'SETUP_PLAYERS') return state
      const names = action.names.map(n => n.trim())
      if (names.some(n => n.length === 0 || n.length > MAX_NAME_LENGTH)) {
        return state
      }
      return {
        ...state,
        players: [newPlayer(names[0] ?? ''), newPlayer(names[1] ?? '')],
        current: 0,
        phase: { name: 'TURN_CHANGE' },
      }
    }

    case 'START_TURN':
      if (phase.name !== 'TURN_CHANGE') return state
      return { ...state, phase: { name: 'SPINNING' } }

    case 'SPIN': {
      if (phase.name !== 'SPINNING') return state
      const segment = getSegments(state.game)[action.segmentIndex]
      if (!segment || !Number.isInteger(action.segmentIndex)) return state
      return {
        ...state,
        phase: { name: 'REVEAL', segmentIndex: action.segmentIndex, segment },
      }
    }

    case 'CONTINUE': {
      if (phase.name === 'REVEAL') {
        if (phase.segment.kind === 'crown') {
          return enterChoose(resetStreak(state), 'crown')
        }
        return askQuestion(
          state,
          phase.segment.categoryId,
          { kind: 'spin' },
          createRng(action.seed),
        )
      }
      if (phase.name === 'QUESTION' && phase.question.answer) {
        return resolveAnswer(
          state,
          phase.context,
          phase.question.answer.correct,
          createRng(action.seed),
        )
      }
      return state
    }

    case 'ANSWER': {
      if (phase.name !== 'QUESTION' || phase.question.answer) return state
      const { optionIndex } = action
      if (
        !Number.isInteger(optionIndex) ||
        optionIndex < 0 ||
        optionIndex >= OPTION_COUNT
      ) {
        return state
      }
      const def = state.game.questions.find(
        q => q.id === phase.question.questionId,
      )
      if (!def) return state
      return {
        ...state,
        phase: {
          ...phase,
          question: {
            ...phase.question,
            answer: {
              selectedIndex: optionIndex,
              correct: optionIndex === def.correctIndex,
            },
          },
        },
      }
    }

    case 'PLAY_FOR_CATEGORY': {
      if (phase.name !== 'CHOOSE') return state
      if (!claimableCategories(state).includes(action.categoryId)) return state
      return askQuestion(
        state,
        action.categoryId,
        { kind: 'claim', categoryId: action.categoryId },
        createRng(action.seed),
      )
    }

    case 'OPEN_DUEL':
      if (phase.name !== 'CHOOSE' || !canDuel(state)) return state
      return { ...state, phase: { name: 'DUEL_SETUP', reason: phase.reason } }

    case 'CANCEL_DUEL':
      if (phase.name !== 'DUEL_SETUP') return state
      return { ...state, phase: { name: 'CHOOSE', reason: phase.reason } }

    case 'START_DUEL': {
      if (phase.name !== 'DUEL_SETUP') return state
      const { stakeId, targetId } = action
      if (!duelStakeOptions(state).includes(stakeId)) return state
      if (!duelTargetOptions(state).includes(targetId)) return state
      const me = state.players[state.current]
      const duel: Duel = {
        stakeId,
        targetId,
        mode: hasCategory(me, targetId) ? 'remove' : 'steal',
      }
      return askQuestion(
        state,
        stakeId,
        { kind: 'duel', step: 1, duel },
        createRng(action.seed),
      )
    }

    case 'REMATCH': {
      if (phase.name !== 'FINISHED') return state
      return {
        ...state,
        players: [
          newPlayer(state.players[0].name),
          newPlayer(state.players[1].name),
        ],
        current: 0,
        phase: { name: 'TURN_CHANGE' },
        questionLastUsed: {},
        questionClock: 0,
      }
    }
  }
}

function resolveAnswer(
  state: GameState,
  context: QuestionContext,
  correct: boolean,
  rng: Rng,
): GameState {
  switch (context.kind) {
    case 'spin': {
      if (!correct) return passTurn(state)
      const streak = state.players[state.current].streak + 1
      if (streak >= STREAK_TARGET) {
        return enterChoose(resetStreak(state), 'streak')
      }
      return {
        ...updatePlayer(state, state.current, p => ({ ...p, streak })),
        phase: { name: 'SPINNING' },
      }
    }

    case 'claim': {
      if (!correct) return passTurn(state)
      const won = updatePlayer(state, state.current, p =>
        addCategory(p, context.categoryId),
      )
      return finishOr(won, { ...won, phase: { name: 'SPINNING' } })
    }

    case 'duel': {
      const { duel } = context
      if (!correct) {
        // Stake goes to the rival; this can hand the rival the win.
        const rival = rivalOf(state.current)
        const lost = updatePlayer(
          updatePlayer(state, state.current, p =>
            removeCategory(p, duel.stakeId),
          ),
          rival,
          p => addCategory(p, duel.stakeId),
        )
        return finishOr(lost, passTurn(lost))
      }
      if (context.step === 1) {
        return askQuestion(
          state,
          duel.targetId,
          { kind: 'duel', step: 2, duel },
          rng,
        )
      }
      const rival = rivalOf(state.current)
      let won = updatePlayer(state, rival, p =>
        removeCategory(p, duel.targetId),
      )
      if (duel.mode === 'steal') {
        won = updatePlayer(won, state.current, p =>
          addCategory(p, duel.targetId),
        )
      }
      return finishOr(won, { ...won, phase: { name: 'SPINNING' } })
    }
  }
}

/**
 * Enters the choice screen. Under the rules this is never a dead end: a player
 * missing any category can always play for it, and a player missing none has
 * already won. The fallback keeps the engine from stalling if that changes.
 */
function enterChoose(state: GameState, reason: ChooseReason): GameState {
  const choosing: GameState = { ...state, phase: { name: 'CHOOSE', reason } }
  if (claimableCategories(state).length === 0 && !canDuel(state)) {
    return finishOr(state, { ...state, phase: { name: 'SPINNING' } })
  }
  return finishOr(state, choosing)
}

function finishOr(state: GameState, otherwise: GameState): GameState {
  const winner = findWinner(state)
  if (winner === null) return otherwise
  return { ...state, phase: { name: 'FINISHED', winner } }
}

function passTurn(state: GameState): GameState {
  return {
    ...state,
    current: rivalOf(state.current),
    phase: { name: 'TURN_CHANGE' },
  }
}

function resetStreak(state: GameState): GameState {
  return updatePlayer(state, state.current, p => ({ ...p, streak: 0 }))
}

/**
 * Picks an unused question of the category at random; once all have been
 * asked, recycles the one asked longest ago.
 */
function askQuestion(
  state: GameState,
  categoryId: CategoryId,
  context: QuestionContext,
  rng: Rng,
): GameState {
  const pool = state.game.questions.filter(q => q.categoryId === categoryId)
  if (pool.length === 0) return state
  const unused = pool.filter(q => state.questionLastUsed[q.id] === undefined)
  let picked
  if (unused.length > 0) {
    picked = unused[randomInt(rng, unused.length)]
  } else {
    const lastUsed = (id: string) => state.questionLastUsed[id] ?? 0
    picked = pool.reduce((oldest, q) =>
      lastUsed(q.id) < lastUsed(oldest.id) ? q : oldest,
    )
  }
  if (!picked) return state

  const question: ActiveQuestion = {
    questionId: picked.id,
    categoryId,
    optionOrder: shuffle(
      Array.from({ length: OPTION_COUNT }, (_, i) => i),
      rng,
    ),
    answer: null,
  }
  return {
    ...state,
    questionLastUsed: {
      ...state.questionLastUsed,
      [picked.id]: state.questionClock,
    },
    questionClock: state.questionClock + 1,
    phase: { name: 'QUESTION', context, question },
  }
}

function updatePlayer(
  state: GameState,
  index: PlayerIndex,
  update: (player: Player) => Player,
): GameState {
  const players: [Player, Player] = [state.players[0], state.players[1]]
  players[index] = update(players[index])
  return { ...state, players }
}

function addCategory(player: Player, id: CategoryId): Player {
  if (player.categories.includes(id)) return player
  return { ...player, categories: [...player.categories, id] }
}

function removeCategory(player: Player, id: CategoryId): Player {
  return { ...player, categories: player.categories.filter(c => c !== id) }
}
