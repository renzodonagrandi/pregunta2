'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
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
      <header className='flex items-center justify-between gap-2 rounded-2xl bg-white p-2 pl-4 shadow-sm'>
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
    <header className='flex items-center justify-between gap-2'>
      <Link
        href='/'
        className='rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-200/60'
      >
        ← {t('exit')}
      </Link>
      <h1 className='truncate text-base font-bold'>{title}</h1>
      {onRestart ? (
        <Button
          variant='ghost'
          className='min-h-10 px-3 text-sm'
          onClick={() => setConfirming(true)}
        >
          {t('restart')}
        </Button>
      ) : (
        <span className='w-16' />
      )}
    </header>
  )
}
