import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getPlayableGame } from '@/features/games/queries'
import { redirect } from '@/i18n/navigation'
import { Match } from './_components/match'
import { MatchSkeleton } from './_components/match-skeleton'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/j/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const game = await getPlayableGame(slug)
  return game ? { title: `${game.title} · Pregunta2` } : {}
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
  const { locale, slug } = await params
  const game = await getPlayableGame(slug)
  if (!game) notFound()
  // The interface follows the game's language, not the visitor's.
  if (game.locale !== locale) {
    redirect({ href: `/j/${slug}`, locale: game.locale })
  }
  return <Match game={game} />
}
