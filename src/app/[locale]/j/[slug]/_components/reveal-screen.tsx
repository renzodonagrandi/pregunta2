'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { CategoryAvatar } from '@/components/category-avatar'
import { Button } from '@/components/ui/button'
import { CROWN_COLOR, CROWN_IMAGE } from '@/features/match/wheel'
import { categoryById } from './category'
import { randomSeed } from './random'
import type { PhaseOf, ScreenProps } from './types'

export function RevealScreen({
  state,
  phase,
  dispatch,
}: ScreenProps & { phase: PhaseOf<'REVEAL'> }) {
  const t = useTranslations('Match.reveal')
  const { segment } = phase
  const category =
    segment.kind === 'category'
      ? categoryById(state, segment.categoryId)
      : undefined

  return (
    <div className='flex flex-1 flex-col items-center gap-6 text-center'>
      <div className='flex flex-1 animate-pop flex-col items-center justify-center gap-5'>
        {category ? (
          <>
            <CategoryAvatar
              name={category.name}
              color={category.color}
              imageUrl={category.imageUrl}
              size={200}
              className='shadow-xl ring-8'
            />
            <h2
              className='rounded-2xl px-6 py-3 text-3xl font-extrabold text-white shadow-md'
              style={{ backgroundColor: category.color }}
            >
              {t('category', { name: category.name })}
            </h2>
          </>
        ) : (
          <>
            <span
              className='flex size-[200px] items-center justify-center rounded-full shadow-xl ring-8 ring-white'
              style={{ backgroundColor: CROWN_COLOR }}
            >
              <Image
                src={CROWN_IMAGE}
                alt=''
                width={130}
                height={130}
                priority
              />
            </span>
            <h2
              className='rounded-2xl px-6 py-3 text-3xl font-extrabold text-white shadow-md'
              style={{ backgroundColor: CROWN_COLOR }}
            >
              {t('crown')}
            </h2>
            <p className='text-zinc-600'>{t('crownHint')}</p>
          </>
        )}
      </div>
      <Button
        className='w-full text-lg'
        onClick={() => dispatch({ type: 'CONTINUE', seed: randomSeed() })}
      >
        {t('continue')}
      </Button>
    </div>
  )
}
