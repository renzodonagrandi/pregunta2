'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Mark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export function MatchHeader({
  title,
  onRestart,
}: {
  title: string
  onRestart: (() => void) | undefined
}) {
  const t = useTranslations('Match.header')
  const [confirming, setConfirming] = useState(false)

  if (confirming && onRestart) {
    return (
      <header className='relative z-10 flex min-h-11 items-center justify-between gap-2 rounded-xl bg-night-800 py-1 pr-1 pl-4'>
        <span className='text-sm font-medium'>{t('restartConfirm')}</span>
        <div className='flex gap-1'>
          <Button
            variant='ghost'
            className='min-h-10 px-3 text-sm'
            onClick={() => setConfirming(false)}
          >
            {t('restartNo')}
          </Button>
          <Button
            variant='danger'
            className='min-h-10 px-3 text-sm'
            onClick={() => {
              setConfirming(false)
              onRestart()
            }}
          >
            {t('restartYes')}
          </Button>
        </div>
      </header>
    )
  }

  return (
    <header className='relative z-10 flex min-h-11 items-center gap-3'>
      <Link
        href='/'
        aria-label={t('exit')}
        title={t('exit')}
        className='-ml-1 flex size-11 shrink-0 items-center justify-center rounded-xl text-chalk hover:bg-night-800'
      >
        <Mark className='h-6 w-8' />
      </Link>
      <h1 className='min-w-0 flex-1 truncate font-display text-base font-semibold text-chalk/90'>
        {title}
      </h1>
      {onRestart && (
        <Button
          variant='ghost'
          className='min-h-10 px-3 text-sm text-chalk/80'
          onClick={() => setConfirming(true)}
        >
          {t('restart')}
        </Button>
      )}
    </header>
  )
}
