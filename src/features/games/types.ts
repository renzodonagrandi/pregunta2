import type { GameDefinition } from '@/features/match/engine'

/** A published game as the play page needs it: definition plus routing data. */
export interface PlayableGame extends GameDefinition {
  slug: string
}

/** Card on the home page. */
export interface GameSummary {
  slug: string
  title: string
  categories: {
    id: string
    name: string
    color: string
    imageUrl: string | null
  }[]
}

export interface EditorQuestion {
  id: string
  text: string
  imageUrl: string | null
  options: [string, string, string, string]
  correctIndex: number
}

export interface EditorCategory {
  id: string
  name: string
  color: string
  imageUrl: string | null
  questions: EditorQuestion[]
}

/** Everything the editor shows. Never includes the edit token or its hash. */
export interface EditorGame {
  id: string
  slug: string
  title: string
  published: boolean
  categories: EditorCategory[]
}
