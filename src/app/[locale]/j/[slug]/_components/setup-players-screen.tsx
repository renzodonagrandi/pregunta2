'use client'

import { useTranslations } from 'next-intl'
import { useState, type Dispatch, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { MAX_NAME_LENGTH, type GameAction } from '@/features/match/engine'

export function SetupPlayersScreen({
  dispatch,
}: {
  dispatch: Dispatch<GameAction>
}) {
  const t = useTranslations('Match.setup')
  const [names, setNames] = useState<[string, string]>(['', ''])
  const [showErrors, setShowErrors] = useState(false)

  const invalid = names.map(
    n => n.trim().length === 0 || n.trim().length > MAX_NAME_LENGTH,
  )

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
      onSubmit={onSubmit}
      className='flex flex-1 flex-col gap-6 pt-8'
      noValidate
    >
      <div>
        <h2 className='font-display text-4xl font-bold'>{t('title')}</h2>
        <p className='mt-2 text-mist'>{t('subtitle')}</p>
      </div>
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
            className='min-h-14 rounded-xl border-2 border-night-700 bg-night-800 px-4 font-display text-xl text-chalk outline-none placeholder:text-night-600 focus:border-amber aria-invalid:border-bad'
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
