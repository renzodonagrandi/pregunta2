export type CategoryId = string
export type QuestionId = string
export type PlayerIndex = 0 | 1

export const MIN_CATEGORIES = 3
export const MAX_CATEGORIES = 6
export const STREAK_TARGET = 3
export const OPTION_COUNT = 4
export const STATE_VERSION = 1

export interface CategoryDef {
  id: CategoryId
  name: string
  color: string
  imageUrl: string | null
}

export interface QuestionDef {
  id: QuestionId
  categoryId: CategoryId
  text: string
  /** Optional picture shown with the question. */
  imageUrl?: string | null
  options: readonly [string, string, string, string]
  correctIndex: number
}

/** Everything needed to play a game: its categories and question bank. */
export interface GameDefinition {
  id: string
  title: string
  categories: readonly CategoryDef[]
  questions: readonly QuestionDef[]
}

export interface Player {
  name: string
  /** Correct answers in a row, 0..STREAK_TARGET. Kept between turns. */
  streak: number
  /** Owned categories, in the order they were won. */
  categories: CategoryId[]
}

export type Segment =
  { kind: 'category'; categoryId: CategoryId } | { kind: 'crown' }

export type DuelMode = 'steal' | 'remove'

export interface Duel {
  /** Challenger's category that the rival lacks. Lost to the rival on failure. */
  stakeId: CategoryId
  /** Rival's category the challenger plays for. */
  targetId: CategoryId
  /** steal: challenger lacks target and takes it. remove: challenger has it, rival just loses it. */
  mode: DuelMode
}

export type QuestionContext =
  | { kind: 'spin' }
  | { kind: 'claim'; categoryId: CategoryId }
  | { kind: 'duel'; step: 1 | 2; duel: Duel }

export interface ActiveQuestion {
  questionId: QuestionId
  categoryId: CategoryId
  /** Display order: optionOrder[displayPos] = original option index. */
  optionOrder: number[]
  /** Set once answered; consequences apply on CONTINUE. */
  answer: { selectedIndex: number; correct: boolean } | null
}

export type ChooseReason = 'streak' | 'crown'

export type Phase =
  | { name: 'SETUP_PLAYERS' }
  | { name: 'TURN_CHANGE' }
  | { name: 'SPINNING' }
  | { name: 'REVEAL'; segmentIndex: number; segment: Segment }
  | { name: 'QUESTION'; context: QuestionContext; question: ActiveQuestion }
  | { name: 'CHOOSE'; reason: ChooseReason }
  | { name: 'DUEL_SETUP'; reason: ChooseReason }
  | { name: 'FINISHED'; winner: PlayerIndex }

/** Plain JSON so it can be persisted (localStorage now, server later). */
export interface GameState {
  version: typeof STATE_VERSION
  game: GameDefinition
  players: [Player, Player]
  current: PlayerIndex
  phase: Phase
  /** questionId -> value of `questionClock` when it was last asked. */
  questionLastUsed: Record<QuestionId, number>
  questionClock: number
}

/**
 * Actions that may draw a question carry a `seed`; all randomness inside the
 * reducer derives from it, so the reducer stays pure and replayable.
 */
export type GameAction =
  | { type: 'SET_PLAYERS'; names: [string, string] }
  | { type: 'START_TURN' }
  | { type: 'SPIN'; segmentIndex: number }
  | { type: 'CONTINUE'; seed: number }
  | { type: 'ANSWER'; optionIndex: number }
  | { type: 'PLAY_FOR_CATEGORY'; categoryId: CategoryId; seed: number }
  | { type: 'OPEN_DUEL' }
  | { type: 'CANCEL_DUEL' }
  | {
      type: 'START_DUEL'
      stakeId: CategoryId
      targetId: CategoryId
      seed: number
    }
  | { type: 'REMATCH' }
