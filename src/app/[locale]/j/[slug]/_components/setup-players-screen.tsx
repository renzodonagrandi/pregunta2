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
      className='flex flex-1 flex-col gap-5 pt-6'
      noValidate
    >
      <div className='text-center'>
        <h2 className='text-3xl font-bold'>{t('title')}</h2>
        <p className='mt-1 text-zinc-600'>{t('subtitle')}</p>
      </div>
      {([0, 1] as const).map(i => (
        <label key={i} className='flex flex-col gap-1'>
          <span className='text-sm font-semibold'>
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
            className='min-h-12 rounded-2xl border border-zinc-300 bg-white px-4 text-lg outline-none focus:border-zinc-900 aria-invalid:border-red-600'
          />
          {showErrors && invalid[i] && (
            <span className='text-sm text-red-700'>
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
