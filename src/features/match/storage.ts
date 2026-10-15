import { STATE_VERSION, type GameDefinition, type GameState } from './engine'

// Client-side persistence so a reload resumes the match. Every access is
// guarded: storage can be unavailable (private mode, blocked, quota).

function key(gameId: string): string {
  return `pregunta2:match:${gameId}`
}

/** Returns the saved match if it belongs to this exact game version. */
export function loadMatch(game: GameDefinition): GameState | null {
  try {
    const raw = window.localStorage.getItem(key(game.id))
    if (!raw) return null
    const saved = JSON.parse(raw) as Partial<GameState>
    if (saved.version !== STATE_VERSION) return null
    // If the game was edited since, the saved state may reference stale data.
    if (JSON.stringify(saved.game) !== JSON.stringify(game)) return null
    return saved as GameState
  } catch {
    return null
  }
}

export function saveMatch(state: GameState): void {
  try {
    window.localStorage.setItem(key(state.game.id), JSON.stringify(state))
  } catch {
    // Ignore: the match keeps working, it just won't survive a reload.
  }
}

export function clearMatch(gameId: string): void {
  try {
    window.localStorage.removeItem(key(gameId))
  } catch {
    // Ignore.
  }
}
