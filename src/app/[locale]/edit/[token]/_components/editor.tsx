'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Logo } from '@/components/brand/logo'
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
  const tc = useTranslations('Common')
  const [game, setGame] = useState(initialGame)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<EditorActionError | 'UNKNOWN' | null>(null)
  // Set when an edit takes a published game back to draft.
  const [backToDraft, setBackToDraft] = useState(false)
  const [, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab = isTab(tabParam) ? tabParam : 'categories'
  const editLink = useEditLink(token)

  // The tab lives in the URL so a reload keeps it.
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
            setBackToDraft(game.published && !result.game.published)
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

  return (
    <EditorContext value={{ token, game, run, setGame }}>
      <div className='theme-chalk flex w-full flex-1 flex-col bg-chalk text-night'>
        <div className='mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pt-4 pb-12 lg:px-8 lg:pt-6'>
          <header className='flex items-center justify-between gap-3'>
            <Link
              href='/'
              aria-label={t('home')}
              className='-ml-1 rounded-lg p-1 hover:bg-night/5'
            >
              <Logo label={tc('appName')} className='h-6 w-auto' />
            </Link>
            <div className='flex items-center gap-3'>
              <span
                className='text-sm text-night/60'
                role='status'
                aria-live='polite'
              >
                {status === 'saving' && t('status.saving')}
                {status === 'saved' && t('status.saved')}
                {status === 'error' && t('status.error')}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-display text-sm font-semibold ${game.published ? 'bg-ok/15 text-[#1b6b48]' : 'bg-night/8 text-night/70'}`}
              >
                {game.published ? t('published') : t('draft')}
              </span>
            </div>
          </header>

          <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <h1 className='font-display text-3xl font-bold break-words lg:text-4xl'>
              {game.title || t('untitled')}
            </h1>
            <details className='group rounded-xl border border-chalk-300 bg-white/60 text-sm lg:w-[26rem]'>
              <summary className='flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 font-semibold'>
                <KeyIcon />
                {t('saveLinkTitle')}
                <span className='ml-auto text-night/50 transition-transform group-open:rotate-180'>
                  ▾
                </span>
              </summary>
              <div className='flex flex-col gap-2 px-3 pb-3'>
                <p className='text-night/70'>{t('saveLinkHint')}</p>
                <CopyField value={editLink} label={t('publish.editLink')} />
              </div>
            </details>
          </div>

          {error && (
            <p
              className='rounded-xl border-l-4 border-bad bg-bad/10 p-3 text-sm font-medium text-[#8f1f24]'
              role='alert'
            >
              {t(`errors.${error}`)}
            </p>
          )}
          {backToDraft && (
            <p className='rounded-xl border-l-4 border-amber bg-amber/15 p-3 text-sm font-medium'>
              {t('publish.backToDraft')}
            </p>
          )}

          <nav
            className='sticky top-0 z-20 -mx-4 bg-chalk/95 px-4 py-2 backdrop-blur lg:mx-0 lg:px-0'
            role='tablist'
          >
            <div className='flex gap-1 rounded-xl bg-night/6 p-1 lg:w-fit'>
              {TABS.map(name => (
                <button
                  key={name}
                  type='button'
                  role='tab'
                  aria-selected={tab === name}
                  onClick={() => setTab(name)}
                  className={`min-h-11 flex-1 rounded-lg px-5 font-display text-sm font-semibold transition-colors ${tab === name ? 'bg-night text-chalk' : 'text-night/70 hover:text-night'}`}
                >
                  {t(`tabs.${name}`)}
                </button>
              ))}
            </div>
          </nav>

          <div role='tabpanel'>
            {tab === 'categories' && <CategoriesStep />}
            {tab === 'questions' && <QuestionsStep />}
            {tab === 'publish' && <PublishStep />}
          </div>
        </div>
      </div>
    </EditorContext>
  )
}

function KeyIcon() {
  return (
    <svg viewBox='0 0 24 24' className='size-5 text-amber-600' aria-hidden>
      <circle
        cx='8'
        cy='12'
        r='4'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
      />
      <path
        d='M12 12h9M18 12v3M21 12v2'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
      />
    </svg>
  )
}
