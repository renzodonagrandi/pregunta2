import { useTranslations } from 'next-intl'

/** Same footprint as the match layout, shown until the browser state loads. */
export function MatchSkeleton() {
  const t = useTranslations('Match')
  return (
    <div
      className='mx-auto flex w-full max-w-md flex-1 animate-pulse flex-col gap-4 px-4 pt-3 pb-6'
      aria-busy
    >
      <div className='h-11 rounded-xl bg-night-800' />
      <div className='h-[6.5rem] rounded-2xl bg-night-800' />
      <div className='mx-auto mt-10 aspect-square w-full max-w-xs rounded-full bg-night-800' />
      <span className='sr-only'>{t('loading')}</span>
    </div>
  )
}
