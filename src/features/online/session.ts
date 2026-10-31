import 'server-only'
import { cookies } from 'next/headers'

/**
 * Each player is identified by a secret token in an httpOnly cookie, one per
 * match (no accounts). The database only stores its hash.
 */
const PREFIX = 'p2m_'
const MAX_AGE = 60 * 60 * 24 * 90 // 90 days

export function matchCookieName(code: string): string {
  return `${PREFIX}${code}`
}

export async function readPlayerToken(code: string): Promise<string | null> {
  return (await cookies()).get(matchCookieName(code))?.value ?? null
}

/** Only callable from Server Actions and Route Handlers. */
export async function savePlayerToken(code: string, token: string) {
  ;(await cookies()).set(matchCookieName(code), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

/** Every match this browser has joined: code -> token. */
export async function readAllPlayerTokens(): Promise<Map<string, string>> {
  const all = (await cookies()).getAll()
  return new Map(
    all
      .filter(c => c.name.startsWith(PREFIX))
      .map(c => [c.name.slice(PREFIX.length), c.value]),
  )
}
