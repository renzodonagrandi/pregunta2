import 'server-only'
import { NextResponse } from 'next/server'
import { getMatchVersion, getMatchView } from '@/features/online/queries'
import { inviteCodeSchema } from '@/features/online/schemas'
import { readPlayerToken } from '@/features/online/session'

/**
 * Polled while it's the other player's turn. With ?v=<version> it answers
 * { changed: false } from a one-column query when nothing happened, and only
 * sends the full (sanitized) view when the match moved on.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const parsed = inviteCodeSchema.safeParse((await params).code)
  if (!parsed.success)
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  const code = parsed.data
  const known = Number(new URL(request.url).searchParams.get('v'))
  const headers = { 'Cache-Control': 'no-store' }

  if (Number.isInteger(known)) {
    const version = await getMatchVersion(code)
    if (version === null)
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers })
    if (version === known)
      return NextResponse.json({ changed: false }, { headers })
  }
  const view = await getMatchView(code, await readPlayerToken(code))
  if (!view)
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers })
  return NextResponse.json({ changed: true, view }, { headers })
}
