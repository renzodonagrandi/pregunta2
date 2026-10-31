import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { MatchSkeleton } from '@/features/match/ui/match-skeleton'
import { RulesCard } from '@/features/match/ui/rules-card'
import { getMatchView } from '@/features/online/queries'
import { inviteCodeSchema } from '@/features/online/schemas'
import { readPlayerToken } from '@/features/online/session'
import { OnlineMatch } from './_components/online-match'

export const metadata: Metadata = {
  // Invite links are private: keep them out of search engines.
  robots: { index: false, follow: false },
}

export default function OnlineMatchPage({
  params,
}: PageProps<'/[locale]/p/[code]'>) {
  return (
    <Suspense fallback={<MatchSkeleton />}>
      <OnlineMatchLoader params={params} />
    </Suspense>
  )
}

async function OnlineMatchLoader({
  params,
}: {
  params: PageProps<'/[locale]/p/[code]'>['params']
}) {
  const parsed = inviteCodeSchema.safeParse((await params).code)
  if (!parsed.success) notFound()
  const code = parsed.data
  const [view, { Match, Common, Online }] = await Promise.all([
    readPlayerToken(code).then(token => getMatchView(code, token)),
    getMessages(),
  ])
  if (!view) notFound()
  const matchMessages = Object.fromEntries(
    Object.entries(Match).filter(([key]) => key !== 'rules'),
  )
  return (
    <NextIntlClientProvider messages={{ Match: matchMessages, Common, Online }}>
      <OnlineMatch initialView={view} sidebar={<RulesCard />} />
    </NextIntlClientProvider>
  )
}
