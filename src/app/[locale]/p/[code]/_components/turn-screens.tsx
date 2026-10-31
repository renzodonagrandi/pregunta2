import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

/** Your turn starts: like Preguntados, you play until you miss. */
export function TurnStartScreen({
  rivalName,
  onStart,
}: {
  rivalName: string
  onStart: () => void
}) {
  const t = useTranslations('Online.turn')
  return (
    <div className='flex flex-1 flex-col gap-6'>
      <div className='flex flex-1 animate-pop flex-col justify-center gap-3'>
        <h2 className='font-display text-6xl leading-none font-bold text-amber'>
          {t('yourTurn')}
        </h2>
        <p className='text-mist'>{t('yourTurnHint', { name: rivalName })}</p>
      </div>
      <Button className='w-full text-lg lg:max-w-sm' onClick={onStart}>
        {t('start')}
      </Button>
    </div>
  )
}

/** The other player is playing; this screen refreshes on its own. */
export function WaitingTurnScreen({ rivalName }: { rivalName: string }) {
  const t = useTranslations('Online.turn')
  return (
    <div
      className='flex flex-1 flex-col justify-center gap-4'
      role='status'
      aria-live='polite'
    >
      <h2 className='flex items-center gap-4 font-display text-4xl font-bold break-words'>
        <span
          className='size-3 shrink-0 animate-pulse rounded-full bg-amber'
          aria-hidden
        />
        {t('theirTurn', { name: rivalName })}
      </h2>
      <p className='max-w-md text-mist'>{t('theirTurnHint')}</p>
    </div>
  )
}
