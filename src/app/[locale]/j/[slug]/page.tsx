import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getPlayableGame } from '@/features/games/queries'
import { Match } from './_components/match'
import { MatchSkeleton } from './_components/match-skeleton'
import { RulesCard } from './_components/rules-card'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/j/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const game = await getPlayableGame(slug)
  return game ? { title: game.title } : {}
}

export default function PlayPage({ params }: PageProps<'/[locale]/j/[slug]'>) {
  return (
    <Suspense fallback={<MatchSkeleton />}>
      <PlayLoader params={params} />
    </Suspense>
  )
}

async function PlayLoader({
  params,
}: {
  params: PageProps<'/[locale]/j/[slug]'>['params']
}) {
  const { slug } = await params
  const [game, { Match: matchMessages, Common }] = await Promise.all([
    getPlayableGame(slug),
    getMessages(),
  ])
  if (!game) notFound()
  // The rules render on the server (sidebar slot): their text needn't ship.
  const clientMatchMessages = Object.fromEntries(
    Object.entries(matchMessages).filter(([key]) => key !== 'rules'),
  )
  // The static rules are rendered here instead of shipping in the client
  // bundle. The full game is passed as-is: it's part of the saved match
  // format in localStorage, so trimming fields would discard saved matches.
  return (
    <NextIntlClientProvider messages={{ Match: clientMatchMessages, Common }}>
      <Match game={game} sidebar={<RulesCard />} />
    </NextIntlClientProvider>
  )
}
