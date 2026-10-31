'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition, type FormEvent } from 'react'
import { Button, buttonClass } from '@/components/ui/button'
import { MAX_NAME_LENGTH } from '@/features/match/engine'
import type { MatchView } from '@/features/online/types'
import { Link } from '@/i18n/navigation'
import { joinMatchAction, type OnlineActionResult } from '../actions'

/** The invited player names themselves and takes the second seat. */
export function JoinScreen({
  view,
  onResult,
}: {
  view: MatchView
  onResult: (result: OnlineActionResult) => void
}) {
  const t = useTranslations('Online.join')
  const tm = useTranslations('Match.setup')
  const [name, setName] = useState('')
  const [showError, setShowError] = useState(false)
  const [pending, startTransition] = useTransition()
  const inviter = view.players.find(p => p.seat === 0)?.name ?? ''
  const valid = name.trim().length > 0 && name.trim().length <= MAX_NAME_LENGTH

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) {
      setShowError(true)
      return
    }
    startTransition(async () =>
      onResult(await joinMatchAction(view.code, name)),
    )
  }

  return (
    <form
      method='post'
      onSubmit={onSubmit}
      className='flex flex-1 flex-col gap-6 pt-8'
      noValidate
    >
      <div>
        <h2 className='font-display text-4xl font-bold'>
          {t('title', { name: inviter })}
        </h2>
        <p className='mt-2 font-display text-xl text-amber'>{view.title}</p>
      </div>
      <label className='flex flex-col gap-2'>
        <span className='font-display text-sm font-semibold text-mist'>
          {t('yourName')}
        </span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder={tm('placeholder')}
          autoComplete='off'
          enterKeyHint='go'
          aria-invalid={showError && !valid}
          className='min-h-14 rounded-xl border-2 border-night-700 bg-night-800 px-4 font-display text-xl text-chalk outline-none placeholder:text-night-600 focus:border-amber aria-invalid:border-bad'
        />
        {showError && !valid && (
          <span className='text-sm text-[#ff8a8e]'>
            {tm('nameError', { max: MAX_NAME_LENGTH })}
          </span>
        )}
      </label>
      <Button
        type='submit'
        className='mt-auto w-full text-lg'
        disabled={pending}
      >
        {pending ? t('joining') : t('join')}
      </Button>
    </form>
  )
}

/** Someone else opened an invite that was already used. */
export function MatchFullScreen() {
  const t = useTranslations('Online.join')
  return (
    <div className='flex flex-1 flex-col justify-center gap-4'>
      <h2 className='font-display text-3xl font-bold'>{t('full')}</h2>
      <p className='text-mist'>{t('fullHint')}</p>
      <Link href='/' className={buttonClass('primary', 'w-full sm:w-auto')}>
        {t('home')}
      </Link>
    </div>
  )
}
