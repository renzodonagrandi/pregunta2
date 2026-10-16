import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getEditorGameByToken } from '@/features/games/queries'
import { editTokenSchema } from '@/features/games/schemas'
import { Editor } from './_components/editor'
import { EditorSkeleton } from './_components/editor-skeleton'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Editor')
  return {
    title: t('pageTitle'),
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
  const [game, messages] = await Promise.all([
    getEditorGameByToken(parsed.data),
    getMessages(),
  ])
  if (!game) notFound()
  const { Editor: editorMessages, Common, Match } = messages
  return (
    <NextIntlClientProvider
      messages={{
        Editor: editorMessages,
        Common,
        Match: { reveal: Match.reveal },
      }}
    >
      <Editor token={parsed.data} initialGame={game} />
    </NextIntlClientProvider>
  )
}
