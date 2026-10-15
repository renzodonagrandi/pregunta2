'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wheel } from '@/components/wheel'
import { randomInt } from '@/features/match/engine'
import { rotationForSlice, wheelSlices } from '@/features/match/wheel'
import { cryptoRng } from './random'
import type { ScreenProps } from './types'

const SPIN_MS = 3800
const REDUCED_SPIN_MS = 700

interface SpinScreenProps extends ScreenProps {
  rotation: number
  onRotationChange: (rotation: number) => void
}

export function SpinScreen({
  state,
  dispatch,
  rotation,
  onRotationChange,
}: SpinScreenProps) {
  const t = useTranslations('Match.spin')
  const tReveal = useTranslations('Match.reveal')
  const slices = wheelSlices(state.game, tReveal('crown'))
  const [spin, setSpin] = useState<{ index: number; ms: number } | null>(null)

  // Report the result to the engine once the animation has finished.
  useEffect(() => {
    if (!spin) return
    const id = setTimeout(
      () => dispatch({ type: 'SPIN', segmentIndex: spin.index }),
      spin.ms + 150,
    )
    return () => clearTimeout(id)
  }, [spin, dispatch])

  const start = () => {
    if (spin) return
    const index = randomInt(cryptoRng, slices.length)
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const ms = reduced ? REDUCED_SPIN_MS : SPIN_MS
    onRotationChange(
      rotationForSlice(
        rotation,
        index,
        slices.length,
        cryptoRng() - 0.5,
        reduced ? 1 : 5,
      ),
    )
    setSpin({ index, ms })
  }

  return (
    <div className='flex flex-1 flex-col items-center gap-6'>
      <h2 className='text-2xl font-bold'>{t('title')}</h2>
      <button
        type='button'
        onClick={start}
        disabled={spin !== null}
        className='w-full max-w-xs rounded-full focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-zinc-900'
        aria-label={t('button')}
      >
        <Wheel
          slices={slices}
          rotation={rotation}
          durationMs={spin?.ms ?? 0}
          label={t('wheelLabel', { count: slices.length })}
        />
      </button>
      <Button
        className='mt-auto w-full text-lg'
        onClick={start}
        disabled={spin !== null}
      >
        {spin ? t('spinning') : t('button')}
      </Button>
    </div>
  )
}
