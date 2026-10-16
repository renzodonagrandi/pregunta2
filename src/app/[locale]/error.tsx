'use client'

import { useTranslations } from 'next-intl'
import { Mark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Errors')
  return (
    <main className='mx-auto flex w-full max-w-md flex-1 flex-col items-start justify-center gap-5 px-5'>
      <Mark className='h-10 w-14 text-chalk' />
      <h1 className='font-display text-3xl font-bold'>
        {t('unexpectedTitle')}
      </h1>
      <Button onClick={reset}>{t('retry')}</Button>
    </main>
  )
}
