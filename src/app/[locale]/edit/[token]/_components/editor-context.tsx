'use client'

import { createContext, use } from 'react'
import type { EditorGame } from '@/features/games/types'
import type { EditorActionResult } from '../actions'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface EditorContextValue {
  token: string
  game: EditorGame
  /** Runs a server action and applies the returned game snapshot. */
  run: (action: () => Promise<EditorActionResult>) => Promise<boolean>
  setGame: (game: EditorGame) => void
}

export const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor(): EditorContextValue {
  const value = use(EditorContext)
  if (!value) throw new Error('useEditor must be used inside <Editor>')
  return value
}
