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
  /**
   * Online play: the server decides the result. `request` returns the slice
   * index (or null on failure); `done` runs once the wheel has stopped.
   */
  remote?: { request: () => Promise<number | null>; done: () => void }
}

export function SpinScreen({
  state,
  dispatch,
  rotation,
  onRotationChange,
  remote,
}: SpinScreenProps) {
  const t = useTranslations('Match.spin')
  const tReveal = useTranslations('Match.reveal')
  const slices = wheelSlices(state.game, tReveal('crown'))
  const [spin, setSpin] = useState<{ index: number; ms: number } | null>(null)
  const [requesting, setRequesting] = useState(false)

  // Report the result once the animation has finished.
  useEffect(() => {
    if (!spin) return
    const id = setTimeout(() => {
      if (remote) remote.done()
      else dispatch({ type: 'SPIN', segmentIndex: spin.index })
    }, spin.ms + 150)
    return () => clearTimeout(id)
  }, [spin, dispatch, remote])

  const start = async () => {
    if (spin || requesting) return
    let index: number
    if (remote) {
      setRequesting(true)
      const result = await remote.request()
      setRequesting(false)
      if (result === null) return
      index = result
    } else {
      index = randomInt(cryptoRng, slices.length)
    }
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
    <div className='flex flex-1 flex-col items-center gap-6 pt-2'>
      <h2 className='font-display text-xl font-semibold text-mist'>
        {t('title')}
      </h2>
      <button
        type='button'
        onClick={() => void start()}
        disabled={spin !== null || requesting}
        className='w-full max-w-[22rem] rounded-full lg:max-w-[30rem]'
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
        className='mt-auto w-full text-lg lg:mt-2 lg:max-w-sm'
        onClick={() => void start()}
        disabled={spin !== null || requesting}
      >
        {spin || requesting ? t('spinning') : t('button')}
      </Button>
    </div>
  )
}
