'use client'

import { useTranslations } from 'next-intl'
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
      <div
        className='flex items-center gap-3 rounded-2xl p-3 text-white shadow-sm'
        style={{ backgroundColor: category.color }}
      >
        <CategoryAvatar
          name={category.name}
          color={category.color}
          imageUrl={category.imageUrl}
          size={44}
        />
        <span className='text-sm font-semibold'>{contextLabel}</span>
      </div>

      <h2 className='text-2xl leading-snug font-bold'>{def.text}</h2>

      <ul className='flex flex-col gap-3'>
        {question.optionOrder.map(optionIndex => {
          const isCorrect = optionIndex === def.correctIndex
          const isSelected = answer?.selectedIndex === optionIndex
          let tone = 'bg-white ring-1 ring-zinc-300 hover:bg-zinc-100'
          if (answer) {
            if (isCorrect) tone = 'bg-emerald-600 text-white ring-emerald-700'
            else if (isSelected) tone = 'bg-red-600 text-white ring-red-700'
            else tone = 'bg-white text-zinc-400 ring-1 ring-zinc-200'
          }
          return (
            <li key={optionIndex}>
              <button
                type='button'
                disabled={answer !== null}
                onClick={() => dispatch({ type: 'ANSWER', optionIndex })}
                className={`min-h-14 w-full rounded-2xl px-4 py-3 text-left text-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${tone}`}
              >
                {def.options[optionIndex]}
              </button>
            </li>
          )
        })}
      </ul>

      {answer && (
        <div
          className='mt-auto flex animate-pop flex-col gap-3'
          role='status'
          aria-live='polite'
        >
          <div
            className={`rounded-2xl p-4 ${answer.correct ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}
          >
            <p className='text-xl font-extrabold'>
              {answer.correct ? t('correct') : t('incorrect')}
            </p>
            {!answer.correct && (
              <p className='mt-1'>
                {t('correctAnswer', {
                  answer: def.options[def.correctIndex] ?? '',
                })}
              </p>
            )}
            {outcome && <p className='mt-1 font-medium'>{outcome}</p>}
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
