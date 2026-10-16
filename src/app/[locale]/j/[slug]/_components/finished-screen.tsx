import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Button, buttonClass } from '@/components/ui/button'
import { CROWN_IMAGE } from '@/features/match/wheel'
import { Link } from '@/i18n/navigation'
import type { PhaseOf, ScreenProps } from './types'

export function FinishedScreen({
  state,
  phase,
  dispatch,
}: ScreenProps & { phase: PhaseOf<'FINISHED'> }) {
  const t = useTranslations('Match.finished')
  const name = state.players[phase.winner].name
  return (
    <div className='flex flex-1 flex-col gap-3'>
      <div className='flex flex-1 animate-pop flex-col items-center justify-center gap-4 text-center'>
        <Image
          src={CROWN_IMAGE}
          alt=''
          width={140}
          height={140}
          priority
          className='drop-shadow-[0_8px_24px_rgba(242,169,59,0.45)]'
        />
        <h2 className='font-display text-5xl leading-tight font-bold break-words text-amber'>
          {t('title', { name })}
        </h2>
        <p className='text-mist'>{t('subtitle')}</p>
      </div>
      <Button
        className='w-full text-lg lg:max-w-sm lg:self-center'
        onClick={() => dispatch({ type: 'REMATCH' })}
      >
        {t('rematch')}
      </Button>
      <Link
        href='/'
        className={buttonClass(
          'outline',
          'w-full text-chalk lg:max-w-sm lg:self-center',
        )}
      >
        {t('home')}
      </Link>
    </div>
  )
}
