'use client'

import { useTranslations } from 'next-intl'
import { useSyncExternalStore } from 'react'
import { CopyField } from '@/components/copy-field'
import { Button } from '@/components/ui/button'

const noopSubscribe = () => () => {}

/** Creator's screen while the invited player hasn't joined yet. */
export function InviteScreen({ code, title }: { code: string; title: string }) {
  const t = useTranslations('Online.invite')
  const tc = useTranslations('Common')
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => '',
  )
  const canShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === 'function',
    () => false,
  )
  const link = `${origin}/p/${code}`

  return (
    <div className='flex flex-1 flex-col gap-6 pt-6'>
      <div>
        <h2 className='font-display text-4xl font-bold'>{t('title')}</h2>
        <p className='mt-2 text-mist'>{t('body')}</p>
      </div>
      <CopyField
        value={link}
        label={t('link')}
        copyLabel={tc('copy')}
        copiedLabel={tc('copied')}
      />
      {canShare && (
        <Button
          variant='outline'
          className='w-full text-chalk'
          onClick={() =>
            void navigator
              .share({ title, text: t('shareText', { title }), url: link })
              .catch(() => {})
          }
        >
          {t('share')}
        </Button>
      )}
      <p
        className='mt-auto flex items-center gap-3 text-mist'
        role='status'
        aria-live='polite'
      >
        <span
          className='size-2.5 animate-pulse rounded-full bg-amber'
          aria-hidden
        />
        {t('waiting')}
      </p>
    </div>
  )
}
