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
    <div className='flex flex-1 flex-col items-center gap-4 text-center'>
      <div className='flex flex-1 animate-pop flex-col items-center justify-center gap-3'>
        <Image src={CROWN_IMAGE} alt='' width={120} height={120} priority />
        <h2 className='text-4xl font-extrabold'>{t('title', { name })}</h2>
        <p className='text-zinc-600'>{t('subtitle')}</p>
      </div>
      <Button
        className='w-full text-lg'
        onClick={() => dispatch({ type: 'REMATCH' })}
      >
        {t('rematch')}
      </Button>
      <Link href='/' className={buttonClass('secondary', 'w-full')}>
        {t('home')}
      </Link>
    </div>
  )
}
