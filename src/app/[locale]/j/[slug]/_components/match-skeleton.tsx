import { useTranslations } from 'next-intl'

/** Same footprint as the match layout, shown until the browser state loads. */
export function MatchSkeleton() {
  const t = useTranslations('Match')
  return (
    <div
      className='mx-auto flex w-full max-w-md flex-1 animate-pulse flex-col gap-4 px-4 pt-3 pb-6'
      aria-busy
    >
      <div className='h-10 rounded-xl bg-zinc-200' />
      <div className='h-28 rounded-2xl bg-zinc-200' />
      <div className='aspect-square w-full rounded-full bg-zinc-200' />
      <span className='sr-only'>{t('loading')}</span>
    </div>
  )
}
