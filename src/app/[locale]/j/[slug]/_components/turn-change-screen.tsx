import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from './types'

export function TurnChangeScreen({ state, dispatch }: ScreenProps) {
  const t = useTranslations('Match.turn')
  const name = state.players[state.current].name
  return (
    <div className='flex flex-1 flex-col gap-6'>
      <div className='flex flex-1 animate-pop flex-col justify-center gap-3'>
        <p className='font-display text-lg text-mist' aria-hidden>
          {t('kicker')}
        </p>
        <h2 className='font-display text-6xl leading-none font-bold break-words text-amber'>
          <span className='sr-only'>{t('title', { name })}</span>
          <span aria-hidden>{name}</span>
        </h2>
        <p className='mt-2 text-mist'>{t('subtitle', { name })}</p>
      </div>
      <Button
        className='w-full text-lg lg:max-w-sm'
        onClick={() => dispatch({ type: 'START_TURN' })}
      >
        {t('ready')}
      </Button>
    </div>
  )
}
