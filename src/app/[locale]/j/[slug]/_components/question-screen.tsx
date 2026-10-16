'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { CategoryAvatar } from '@/components/category-avatar'
import { Button } from '@/components/ui/button'
import { rivalOf, STREAK_TARGET } from '@/features/match/engine'
import { categoryById, categoryName } from './category'
import { randomSeed } from './random'
import type { PhaseOf, ScreenProps } from './types'

export function QuestionScreen({
  state,
  phase,
  dispatch,
}: ScreenProps & { phase: PhaseOf<'QUESTION'> }) {
  const t = useTranslations('Match.question')
  const { question, context } = phase
  const def = state.game.questions.find(q => q.id === question.questionId)
  const category = categoryById(state, question.categoryId)
  if (!def || !category) return null

  const answer = question.answer
  const rivalName = state.players[rivalOf(state.current)].name

  const contextLabel =
    context.kind === 'spin'
      ? t('contextSpin', { category: category.name })
      : context.kind === 'claim'
        ? t('contextClaim', { category: category.name })
        : t('contextDuel', { step: context.step, category: category.name })

  const outcome = (() => {
    if (!answer) return null
    if (context.kind === 'spin') {
      if (!answer.correct) return t('outcome.passTurn', { name: rivalName })
      const streak = state.players[state.current].streak + 1
      return streak >= STREAK_TARGET
        ? t('outcome.spinStreak')
        : t('outcome.spinCorrect')
    }
    if (context.kind === 'claim') {
      return answer.correct
        ? t('outcome.claimWon', { category: category.name })
        : t('outcome.passTurn', { name: rivalName })
    }
    const { duel } = context
    if (!answer.correct) {
      return t('outcome.duelLost', {
        category: categoryName(state, duel.stakeId),
        name: rivalName,
      })
    }
    if (context.step === 1) {
      return t('outcome.duelNext', {
        category: categoryName(state, duel.targetId),
      })
    }
    const target = categoryName(state, duel.targetId)
    return duel.mode === 'steal'
      ? t('outcome.duelSteal', { category: target, name: rivalName })
      : t('outcome.duelRemove', { category: target, name: rivalName })
  })()

  return (
    <div className='flex flex-1 flex-col gap-5'>
      <div className='flex items-center gap-3'>
        <CategoryAvatar
          name={category.name}
          color={category.color}
          imageUrl={category.imageUrl}
          size={40}
        />
        <span className='font-display text-sm font-semibold'>
          {contextLabel}
        </span>
      </div>
      <div
        className='h-1 w-full rounded-full'
        style={{ backgroundColor: category.color }}
        aria-hidden
      />

      {def.imageUrl && (
        // Fixed-height frame: the layout doesn't jump while the image loads.
        <div className='relative h-48 w-full overflow-hidden rounded-2xl bg-night-800 sm:h-60 lg:h-72'>
          <Image
            src={def.imageUrl}
            alt={t('imageAlt')}
            fill
            priority
            sizes='(min-width: 1024px) 42rem, 100vw'
            unoptimized
            className='object-contain'
          />
        </div>
      )}

      <h2 className='text-2xl leading-snug font-bold text-balance lg:text-3xl'>
        {def.text}
      </h2>

      <ul className='grid gap-3 lg:grid-cols-2'>
        {question.optionOrder.map(optionIndex => {
          const isCorrect = optionIndex === def.correctIndex
          const isSelected = answer?.selectedIndex === optionIndex
          let tone =
            'border-night-700 bg-night-800 hover:border-night-600 active:scale-[0.99]'
          if (answer) {
            if (isCorrect) tone = 'border-ok bg-ok text-night'
            else if (isSelected) tone = 'border-bad bg-bad text-white'
            else tone = 'border-night-800 bg-night-800/50 text-mist/60'
          }
          return (
            <li key={optionIndex}>
              <button
                type='button'
                disabled={answer !== null}
                onClick={() => dispatch({ type: 'ANSWER', optionIndex })}
                className={`flex h-full min-h-15 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-medium transition-[background-color,border-color,color,transform] ${tone}`}
              >
                <span className='flex-1'>{def.options[optionIndex]}</span>
                {answer && (isCorrect || isSelected) && (
                  <ResultIcon correct={isCorrect} />
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {answer && (
        <div
          className='mt-auto flex animate-pop flex-col gap-3 lg:mt-4 lg:max-w-md'
          role='status'
          aria-live='polite'
        >
          <div>
            <p
              className={`font-display text-2xl font-bold ${answer.correct ? 'text-ok' : 'text-[#ff8a8e]'}`}
            >
              {answer.correct ? t('correct') : t('incorrect')}
            </p>
            {!answer.correct && (
              <p className='mt-1 text-chalk/85'>
                {t('correctAnswer', {
                  answer: def.options[def.correctIndex] ?? '',
                })}
              </p>
            )}
            {outcome && <p className='mt-1 text-mist'>{outcome}</p>}
          </div>
          <Button
            className='w-full text-lg'
            onClick={() => dispatch({ type: 'CONTINUE', seed: randomSeed() })}
            autoFocus
          >
            {t('continue')}
          </Button>
        </div>
      )}
    </div>
  )
}

function ResultIcon({ correct }: { correct: boolean }) {
  return (
    <svg viewBox='0 0 24 24' className='size-6 shrink-0' aria-hidden>
      <path
        d={correct ? 'M5 12.5l4.5 4.5L19 7.5' : 'M7 7l10 10M17 7L7 17'}
        fill='none'
        stroke='currentColor'
        strokeWidth='3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
