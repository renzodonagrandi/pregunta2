'use server'

import {
  joinMatch,
  playMove,
  type OnlineError,
} from '@/features/online/mutations'
import { getMatchView } from '@/features/online/queries'
import { clientActionSchema } from '@/features/online/rules'
import { inviteCodeSchema, playerNameSchema } from '@/features/online/schemas'
import { readPlayerToken, savePlayerToken } from '@/features/online/session'
import type { MatchView } from '@/features/online/types'

export type OnlineActionError = OnlineError | 'INVALID_INPUT' | 'INVALID_NAME'

/** Every result carries the freshest view the server has, when there is one. */
export type OnlineActionResult =
  | { ok: true; view: MatchView }
  | { ok: false; error: OnlineActionError; view: MatchView | null }

export async function joinMatchAction(
  code: string,
  name: string,
): Promise<OnlineActionResult> {
  const parsedCode = inviteCodeSchema.safeParse(code)
  if (!parsedCode.success)
    return { ok: false, error: 'MATCH_NOT_FOUND', view: null }
  const parsedName = playerNameSchema.safeParse(name)
  if (!parsedName.success) {
    return {
      ok: false,
      error: 'INVALID_NAME',
      view: await getMatchView(parsedCode.data, null),
    }
  }
  const joined = await joinMatch(parsedCode.data, parsedName.data)
  if (!joined.ok) {
    return {
      ok: false,
      error: joined.error,
      view: await getMatchView(parsedCode.data, null),
    }
  }
  await savePlayerToken(parsedCode.data, joined.value.token)
  const view = await getMatchView(parsedCode.data, joined.value.token)
  return view
    ? { ok: true, view }
    : { ok: false, error: 'MATCH_NOT_FOUND', view: null }
}

/**
 * A move in an online match. The server decides everything random and checks
 * that it's the caller's turn; the cookie token is the only authorization.
 */
export async function playMoveAction(
  code: string,
  action: unknown,
): Promise<OnlineActionResult> {
  const parsedCode = inviteCodeSchema.safeParse(code)
  if (!parsedCode.success)
    return { ok: false, error: 'MATCH_NOT_FOUND', view: null }
  const token = await readPlayerToken(parsedCode.data)
  const parsedAction = clientActionSchema.safeParse(action)
  if (!parsedAction.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      view: await getMatchView(parsedCode.data, token),
    }
  }
  const result = await playMove(parsedCode.data, token, parsedAction.data)
  if (result.ok) return { ok: true, view: result.value }
  return {
    ok: false,
    error: result.error,
    view: await getMatchView(parsedCode.data, token),
  }
}
