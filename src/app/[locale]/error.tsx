'use client'

import { useTranslations } from 'next-intl'

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Errors')
  return (
    <main className='mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center'>
      <h1 className='text-2xl font-bold'>{t('unexpectedTitle')}</h1>
      <button
        type='button'
        onClick={reset}
        className='rounded-full bg-zinc-900 px-5 py-2 font-medium text-white'
      >
        {t('retry')}
      </button>
    </main>
  )
}
