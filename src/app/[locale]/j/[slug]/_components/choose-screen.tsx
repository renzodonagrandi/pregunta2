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
      <div className='flex flex-1 flex-col gap-4'>
        <h2 className='text-2xl font-bold'>{t('pickCategory')}</h2>
        <ul className='grid grid-cols-2 gap-3'>
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
                  className='flex w-full flex-col items-center gap-2 rounded-2xl p-4 font-bold text-white shadow-sm transition-transform active:scale-95'
                  style={{ backgroundColor: c.color }}
                >
                  <CategoryAvatar
                    name={c.name}
                    color={c.color}
                    imageUrl={c.imageUrl}
                    size={72}
                  />
                  {c.name}
                </button>
              </li>
            )
          })}
        </ul>
        <Button
          variant='ghost'
          className='mt-auto w-full'
          onClick={() => setPicking(false)}
        >
          {t('back')}
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='animate-pop text-center'>
        <h2 className='text-3xl font-extrabold'>
          {phase.reason === 'crown' ? t('titleCrown') : t('titleStreak')}
        </h2>
        <p className='text-zinc-600'>{t('subtitle')}</p>
      </div>
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
      className='flex flex-col gap-1 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400'
    >
      <span className='text-xl font-bold'>{title}</span>
      <span className='text-sm'>{hint}</span>
    </button>
  )
}
