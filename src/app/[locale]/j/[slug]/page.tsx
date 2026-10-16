import type { Metadata } from 'next'
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
  const game = await getPlayableGame(slug)
  if (!game) notFound()
  // The static rules are rendered here instead of shipping in the client
  // bundle. The full game is passed as-is: it's part of the saved match
  // format in localStorage, so trimming fields would discard saved matches.
  return <Match game={game} sidebar={<RulesCard />} />
}
