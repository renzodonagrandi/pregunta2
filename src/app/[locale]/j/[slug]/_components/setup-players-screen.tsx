'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition, type Dispatch, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { MAX_NAME_LENGTH, type GameAction } from '@/features/match/engine'
import { createMatchAction } from '../actions'

const NAME_INPUT_CLASS =
  'min-h-14 rounded-xl border-2 border-night-700 bg-night-800 px-4 font-display text-xl text-chalk outline-none placeholder:text-night-600 focus:border-amber aria-invalid:border-bad'

function isValidName(name: string): boolean {
  const n = name.trim()
  return n.length > 0 && n.length <= MAX_NAME_LENGTH
}

export function SetupPlayersScreen({
  dispatch,
  slug,
}: {
  dispatch: Dispatch<GameAction>
  /** When set, offers online play for this published game. */
  slug?: string | undefined
}) {
  const t = useTranslations('Match.setup')
  const to = useTranslations('Online.setup')
  const [mode, setMode] = useState<'local' | 'online'>('local')

  return (
    <div className='flex flex-1 flex-col gap-6 pt-8'>
      <div>
        <h2 className='font-display text-4xl font-bold'>{t('title')}</h2>
        <p className='mt-2 text-mist'>
          {mode === 'local' ? t('subtitle') : to('onlineHint')}
        </p>
      </div>
      {slug && (
        <div
          role='radiogroup'
          aria-label={to('modeLabel')}
          className='flex gap-1 rounded-xl bg-night-800 p-1'
        >
          {(['local', 'online'] as const).map(value => (
            <button
              key={value}
              type='button'
              role='radio'
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className={`min-h-11 flex-1 rounded-lg font-display text-sm font-semibold transition-colors ${mode === value ? 'bg-amber text-night' : 'text-mist hover:text-chalk'}`}
            >
              {value === 'local' ? to('modeLocal') : to('modeOnline')}
            </button>
          ))}
        </div>
      )}
      {mode === 'online' && slug ? (
        <OnlineSetupForm slug={slug} />
      ) : (
        <LocalSetupForm dispatch={dispatch} />
      )}
    </div>
  )
}

function LocalSetupForm({ dispatch }: { dispatch: Dispatch<GameAction> }) {
  const t = useTranslations('Match.setup')
  const [names, setNames] = useState<[string, string]>(['', ''])
  const [showErrors, setShowErrors] = useState(false)
  const invalid = names.map(n => !isValidName(n))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (invalid.some(Boolean)) {
      setShowErrors(true)
      return
    }
    dispatch({ type: 'SET_PLAYERS', names })
  }

  return (
    <form
      method='post'
      onSubmit={onSubmit}
      className='flex flex-1 flex-col gap-6'
      noValidate
    >
      {([0, 1] as const).map(i => (
        <label key={i} className='flex flex-col gap-2'>
          <span className='font-display text-sm font-semibold text-mist'>
            {i === 0 ? t('player1') : t('player2')}
          </span>
          <input
            value={names[i]}
            onChange={e => {
              const next: [string, string] = [...names]
              next[i] = e.target.value
              setNames(next)
            }}
            maxLength={MAX_NAME_LENGTH}
            placeholder={t('placeholder')}
            autoComplete='off'
            enterKeyHint={i === 0 ? 'next' : 'go'}
            aria-invalid={showErrors && invalid[i]}
            className={NAME_INPUT_CLASS}
          />
          {showErrors && invalid[i] && (
            <span className='text-sm text-[#ff8a8e]'>
              {t('nameError', { max: MAX_NAME_LENGTH })}
            </span>
          )}
        </label>
      ))}
      <Button type='submit' className='mt-auto w-full text-lg'>
        {t('start')}
      </Button>
    </form>
  )
}

function OnlineSetupForm({ slug }: { slug: string }) {
  const t = useTranslations('Match.setup')
  const to = useTranslations('Online')
  const [name, setName] = useState('')
  const [showError, setShowError] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValidName(name)) {
      setShowError(true)
      return
    }
    startTransition(async () => {
      // Redirects to the match on success; only failures come back.
      const result = await createMatchAction(slug, name)
      setServerError(to(`errors.${result.error}`))
    })
  }

  return (
    <form
      method='post'
      onSubmit={onSubmit}
      className='flex flex-1 flex-col gap-6'
      noValidate
    >
      <label className='flex flex-col gap-2'>
        <span className='font-display text-sm font-semibold text-mist'>
          {to('setup.yourName')}
        </span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder={t('placeholder')}
          autoComplete='off'
          enterKeyHint='go'
          aria-invalid={showError && !isValidName(name)}
          className={NAME_INPUT_CLASS}
        />
        {showError && !isValidName(name) && (
          <span className='text-sm text-[#ff8a8e]'>
            {t('nameError', { max: MAX_NAME_LENGTH })}
          </span>
        )}
      </label>
      {serverError && (
        <p className='text-sm text-[#ff8a8e]' role='alert'>
          {serverError}
        </p>
      )}
      <Button
        type='submit'
        className='mt-auto w-full text-lg'
        disabled={pending}
      >
        {pending ? to('setup.creating') : to('setup.create')}
      </Button>
    </form>
  )
}
