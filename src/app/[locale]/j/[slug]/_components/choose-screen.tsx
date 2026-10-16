'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CategoryAvatar } from '@/components/category-avatar'
import { Button } from '@/components/ui/button'
import { canDuel, claimableCategories, rivalOf } from '@/features/match/engine'
import { categoryById } from './category'
import { randomSeed } from './random'
import type { PhaseOf, ScreenProps } from './types'

export function ChooseScreen({
  state,
  phase,
  dispatch,
}: ScreenProps & { phase: PhaseOf<'CHOOSE'> }) {
  const t = useTranslations('Match.choose')
  const [picking, setPicking] = useState(false)
  const rivalName = state.players[rivalOf(state.current)].name
  const duelAvailable = canDuel(state)
  const claimable = claimableCategories(state)

  if (picking) {
    return (
      <div className='flex flex-1 flex-col gap-5'>
        <h2 className='font-display text-3xl font-bold'>{t('pickCategory')}</h2>
        <ul className='grid grid-cols-2 gap-3 lg:grid-cols-3'>
          {claimable.map(id => {
            const c = categoryById(state, id)
            if (!c) return null
            return (
              <li key={id}>
                <button
                  type='button'
                  onClick={() =>
                    dispatch({
                      type: 'PLAY_FOR_CATEGORY',
                      categoryId: id,
                      seed: randomSeed(),
                    })
                  }
                  className='flex w-full flex-col items-center gap-3 rounded-2xl px-3 py-5 font-display text-lg font-semibold text-white transition-transform active:scale-95'
                  style={{ backgroundColor: c.color }}
                >
                  <CategoryAvatar
                    name={c.name}
                    color={c.color}
                    imageUrl={c.imageUrl}
                    size={76}
                    className='shadow-[0_0_0_4px_rgba(255,255,255,0.3)]'
                  />
                  {c.name}
                </button>
              </li>
            )
          })}
        </ul>
        <Button
          variant='ghost'
          className='mt-auto w-full text-mist'
          onClick={() => setPicking(false)}
        >
          {t('back')}
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col gap-6'>
      <div className='animate-pop'>
        <h2 className='font-display text-4xl font-bold text-amber'>
          {phase.reason === 'crown' ? t('titleCrown') : t('titleStreak')}
        </h2>
        <p className='mt-1 text-mist'>{t('subtitle')}</p>
      </div>
      <div className='grid gap-3 lg:grid-cols-2'>
        <OptionCard
          title={t('playFor')}
          hint={t('playForHint')}
          onClick={() => setPicking(true)}
        />
        <OptionCard
          title={t('duel')}
          hint={
            duelAvailable
              ? t('duelHint', { name: rivalName })
              : t('duelUnavailable', { name: rivalName })
          }
          disabled={!duelAvailable}
          onClick={() => dispatch({ type: 'OPEN_DUEL' })}
        />
      </div>
    </div>
  )
}

function OptionCard({
  title,
  hint,
  disabled = false,
  onClick,
}: {
  title: string
  hint: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onClick}
      className='flex flex-col gap-1.5 rounded-2xl border-2 border-night-700 bg-night-800 p-5 text-left transition-colors hover:border-amber disabled:cursor-not-allowed disabled:border-night-800 disabled:bg-transparent disabled:text-mist/70'
    >
      <span className='font-display text-xl font-bold'>{title}</span>
      <span className='text-sm leading-relaxed text-mist'>{hint}</span>
    </button>
  )
}
