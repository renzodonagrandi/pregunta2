'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { EditorGame } from '@/features/games/types'
import { Link } from '@/i18n/navigation'
import type { EditorActionError, EditorActionResult } from '../actions'
import { CategoriesStep } from './categories-step'
import { CopyField } from './copy-field'
import { EditorContext, type SaveStatus } from './editor-context'
import { PublishStep } from './publish-step'
import { QuestionsStep } from './questions-step'
import { useEditLink } from './use-links'

const TABS = ['categories', 'questions', 'publish'] as const
type Tab = (typeof TABS)[number]

function isTab(value: string | null): value is Tab {
  return (TABS as readonly string[]).includes(value ?? '')
}

export function Editor({
  token,
  initialGame,
}: {
  token: string
  initialGame: EditorGame
}) {
  const t = useTranslations('Editor')
  const [game, setGame] = useState(initialGame)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<EditorActionError | 'UNKNOWN' | null>(null)
  const [, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab = isTab(tabParam) ? tabParam : 'categories'
  const editLink = useEditLink(token)

  // The tab lives in the URL so a reload or a shared screenshot keeps it.
  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  const run = (action: () => Promise<EditorActionResult>) =>
    new Promise<boolean>(resolve => {
      setStatus('saving')
      startTransition(async () => {
        try {
          const result = await action()
          if (result.ok) {
            setGame(result.game)
            setStatus('saved')
            setError(null)
            resolve(true)
          } else {
            setStatus('error')
            setError(result.error)
            resolve(false)
          }
        } catch {
          setStatus('error')
          setError('UNKNOWN')
          resolve(false)
        }
      })
    })

  const backToDraft = initialGame.published && !game.published

  return (
    <EditorContext value={{ token, game, run, setGame }}>
      <div className='mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-3 pb-10'>
        <header className='flex items-center justify-between gap-2'>
          <Link
            href='/'
            className='rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-200/60'
          >
            ← Pregunta2
          </Link>
          <div className='flex items-center gap-2'>
            <span
              className='text-xs font-medium text-zinc-500'
              role='status'
              aria-live='polite'
            >
              {status === 'saving' && t('status.saving')}
              {status === 'saved' && t('status.saved')}
              {status === 'error' && t('status.error')}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${game.published ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'}`}
            >
              {game.published ? t('published') : t('draft')}
            </span>
          </div>
        </header>

        <h1 className='text-2xl font-bold'>{game.title || t('untitled')}</h1>

        <details className='rounded-2xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200'>
          <summary className='cursor-pointer font-semibold'>
            🔑 {t('saveLinkTitle')}
          </summary>
          <p className='mt-2'>{t('saveLinkHint')}</p>
          <div className='mt-2'>
            <CopyField value={editLink} label={t('publish.editLink')} />
          </div>
        </details>

        {error && (
          <p
            className='rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800'
            role='alert'
          >
            {t(`errors.${error}`)}
          </p>
        )}
        {backToDraft && (
          <p className='rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900'>
            {t('publish.backToDraft')}
          </p>
        )}

        <nav
          className='sticky top-0 z-20 -mx-4 flex gap-1 bg-zinc-50/95 px-4 py-2 backdrop-blur'
          role='tablist'
        >
          {TABS.map(name => (
            <button
              key={name}
              type='button'
              role='tab'
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={`min-h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${tab === name ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700 ring-1 ring-zinc-200'}`}
            >
              {t(`tabs.${name}`)}
            </button>
          ))}
        </nav>

        <div role='tabpanel'>
          {tab === 'categories' && <CategoriesStep />}
          {tab === 'questions' && <QuestionsStep />}
          {tab === 'publish' && <PublishStep />}
        </div>
      </div>
    </EditorContext>
  )
}
