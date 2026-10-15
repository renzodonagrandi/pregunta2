import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from './types'

export function TurnChangeScreen({ state, dispatch }: ScreenProps) {
  const t = useTranslations('Match.turn')
  const name = state.players[state.current].name
  return (
    <div className='flex flex-1 animate-pop flex-col items-center justify-center gap-4 text-center'>
      <h2 className='text-4xl font-extrabold'>{t('title', { name })}</h2>
      <p className='text-zinc-600'>{t('subtitle', { name })}</p>
      <Button
        className='mt-6 w-full text-lg'
        onClick={() => dispatch({ type: 'START_TURN' })}
      >
        {t('ready')}
      </Button>
    </div>
  )
}
