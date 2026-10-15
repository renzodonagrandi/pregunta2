import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getEditorGameByToken } from '@/features/games/queries'
import { editTokenSchema } from '@/features/games/schemas'
import { Editor } from './_components/editor'
import { EditorSkeleton } from './_components/editor-skeleton'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Editor')
  return {
    title: `${t('pageTitle')} · Pregunta2`,
    // The URL carries the secret token: keep it out of search engines and
    // out of the Referer header sent to other origins (e.g. image hosts).
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  }
}

export default function EditPage({
  params,
}: PageProps<'/[locale]/edit/[token]'>) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditorLoader params={params} />
    </Suspense>
  )
}

async function EditorLoader({
  params,
}: {
  params: PageProps<'/[locale]/edit/[token]'>['params']
}) {
  const { token } = await params
  const parsed = editTokenSchema.safeParse(token)
  if (!parsed.success) notFound()
  const game = await getEditorGameByToken(parsed.data)
  if (!game) notFound()
  return <Editor token={parsed.data} initialGame={game} />
}
