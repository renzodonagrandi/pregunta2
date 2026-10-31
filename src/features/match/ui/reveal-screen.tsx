'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { CategoryAvatar } from '@/components/category-avatar'
import { buttonClass } from '@/components/ui/button'
import { CROWN_IMAGE } from '@/features/match/wheel'
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
  const next = () => dispatch({ type: 'CONTINUE', seed: randomSeed() })

  return (
    <div className='flex flex-1 flex-col gap-6 text-center'>
      {/* The one loud moment: the result floods the screen from the pointer. */}
      <div
        aria-hidden
        className='fixed inset-0 animate-flood'
        style={{
          background: category
            ? category.color
            : 'radial-gradient(circle at 50% 38%, #3a3220 0%, var(--color-night) 62%)',
        }}
      />
      <div className='relative flex flex-1 animate-pop flex-col items-center justify-center gap-6'>
        {category ? (
          <>
            <CategoryAvatar
              name={category.name}
              color={category.color}
              imageUrl={category.imageUrl}
              size={208}
              className='shadow-[0_0_0_8px_rgba(255,255,255,0.25)]'
            />
            <h2 className='font-display text-4xl font-bold text-white'>
              {t('category', { name: category.name })}
            </h2>
          </>
        ) : (
          <>
            <Image
              src={CROWN_IMAGE}
              alt=''
              width={176}
              height={176}
              priority
              className='drop-shadow-[0_8px_24px_rgba(242,169,59,0.45)]'
            />
            <h2 className='font-display text-4xl font-bold text-amber'>
              {t('crown')}
            </h2>
            <p className='max-w-xs text-chalk/80'>{t('crownHint')}</p>
          </>
        )}
      </div>
      <button
        type='button'
        onClick={next}
        className={buttonClass(
          category ? 'ink' : 'primary',
          'relative w-full text-lg lg:max-w-sm lg:self-center',
        )}
      >
        {t('continue')}
      </button>
    </div>
  )
}
