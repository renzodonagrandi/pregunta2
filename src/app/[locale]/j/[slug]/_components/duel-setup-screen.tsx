'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CategoryAvatar } from '@/components/category-avatar'
import { Button } from '@/components/ui/button'
import {
  duelStakeOptions,
  duelTargetOptions,
  hasCategory,
  rivalOf,
  type CategoryId,
} from '@/features/match/engine'
import { categoryById } from './category'
import { randomSeed } from './random'
import type { ScreenProps } from './types'

export function DuelSetupScreen({ state, dispatch }: ScreenProps) {
  const t = useTranslations('Match.duel')
  const rivalName = state.players[rivalOf(state.current)].name
  const me = state.players[state.current]
  const stakes = duelStakeOptions(state)
  const targets = duelTargetOptions(state)
  const [stake, setStake] = useState<CategoryId | null>(
    stakes.length === 1 ? (stakes[0] ?? null) : null,
  )
  const [target, setTarget] = useState<CategoryId | null>(
    targets.length === 1 ? (targets[0] ?? null) : null,
  )

  return (
    <div className='flex flex-1 flex-col gap-5'>
      <div>
        <h2 className='font-display text-3xl font-bold'>
          {t('title', { name: rivalName })}
        </h2>
        <p className='mt-2 text-sm leading-relaxed text-mist'>
          {t('rules', { name: rivalName })}
        </p>
      </div>

      <Picker
        label={t('stake')}
        ids={stakes}
        selected={stake}
        onSelect={setStake}
        state={state}
      />
      <Picker
        label={t('target')}
        ids={targets}
        selected={target}
        onSelect={setTarget}
        state={state}
      />

      {target && (
        <p className='rounded-xl border-l-4 border-amber bg-night-800 p-3 text-sm font-medium'>
          {hasCategory(me, target)
            ? t('modeRemove', { name: rivalName })
            : t('modeSteal', { name: rivalName })}
        </p>
      )}

      <div className='mt-auto flex flex-col gap-2'>
        <Button
          className='w-full text-lg'
          disabled={!stake || !target}
          onClick={() => {
            if (!stake || !target) return
            dispatch({
              type: 'START_DUEL',
              stakeId: stake,
              targetId: target,
              seed: randomSeed(),
            })
          }}
        >
          {t('start')}
        </Button>
        <Button
          variant='ghost'
          className='w-full text-mist'
          onClick={() => dispatch({ type: 'CANCEL_DUEL' })}
        >
          {t('back')}
        </Button>
      </div>
    </div>
  )
}

function Picker({
  label,
  ids,
  selected,
  onSelect,
  state,
}: {
  label: string
  ids: CategoryId[]
  selected: CategoryId | null
  onSelect: (id: CategoryId) => void
  state: ScreenProps['state']
}) {
  return (
    <fieldset className='flex flex-col gap-2'>
      <legend className='mb-2 font-display text-sm font-semibold text-mist'>
        {label}
      </legend>
      <div className='flex flex-wrap gap-2'>
        {ids.map(id => {
          const c = categoryById(state, id)
          if (!c) return null
          const active = selected === id
          return (
            <button
              key={id}
              type='button'
              aria-pressed={active}
              onClick={() => onSelect(id)}
              className={`flex items-center gap-2 rounded-full border-2 py-1 pr-4 pl-1 font-display font-semibold transition-colors ${active ? 'border-white text-white' : 'border-night-700 bg-night-800 hover:border-night-600'}`}
              style={active ? { backgroundColor: c.color } : undefined}
            >
              <CategoryAvatar
                name={c.name}
                color={c.color}
                imageUrl={c.imageUrl}
                size={36}
              />
              {c.name}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
