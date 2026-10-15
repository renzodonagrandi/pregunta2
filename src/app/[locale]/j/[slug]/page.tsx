import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getPlayableGame } from '@/features/games/queries'
import { Match } from './_components/match'
import { MatchSkeleton } from './_components/match-skeleton'

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
  return <Match game={game} />
}
