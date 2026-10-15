'use client'

import { useTranslations } from 'next-intl'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  MAX_OPTION_LENGTH,
  MAX_QUESTION_LENGTH,
} from '@/features/games/constants'
import { questionInputSchema } from '@/features/games/schemas'
import type { EditorQuestion } from '@/features/games/types'
import { createQuestionAction, updateQuestionAction } from '../actions'
import { useEditor } from './editor-context'

type Options = [string, string, string, string]

export function QuestionForm({
  categoryId,
  question,
  onDone,
}: {
  categoryId: string
  question?: EditorQuestion
  onDone: () => void
}) {
  const t = useTranslations('Editor.questions')
  const { token, run } = useEditor()
  const [text, setText] = useState(question?.text ?? '')
  const [options, setOptions] = useState<Options>(
    question ? [...question.options] : ['', '', '', ''],
  )
  const [correctIndex, setCorrectIndex] = useState(question?.correctIndex ?? 0)
  const [error, setError] = useState<
    'requiredFields' | 'duplicateOptions' | null
  >(null)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = questionInputSchema.safeParse({
      text,
      options,
      correctIndex,
    })
    if (!parsed.success) {
      const duplicate = parsed.error.issues.some(
        i => i.message === 'DUPLICATE_OPTIONS',
      )
      setError(duplicate ? 'duplicateOptions' : 'requiredFields')
      return
    }
    setError(null)
    setSaving(true)
    const ok = await run(() =>
      question
        ? updateQuestionAction(token, question.id, parsed.data)
        : createQuestionAction(token, categoryId, parsed.data),
    )
    setSaving(false)
    if (ok) onDone()
  }

  return (
    <form
      onSubmit={e => void onSubmit(e)}
      className='flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-md ring-2 ring-zinc-900/10'
      noValidate
    >
      <label className='flex flex-col gap-1'>
        <span className='text-sm font-semibold'>{t('text')}</span>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder={t('textPlaceholder')}
          rows={2}
          autoFocus
          className='rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900'
        />
      </label>
      <fieldset className='flex flex-col gap-2'>
        {options.map((option, i) => (
          <div key={i} className='flex items-center gap-2'>
            <input
              type='radio'
              name={`correct-${question?.id ?? 'new'}`}
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
              aria-label={t('markCorrect', { n: i + 1 })}
              className='size-6 shrink-0 accent-emerald-600'
            />
            <input
              value={option}
              onChange={e => {
                const next: Options = [...options]
                next[i] = e.target.value
                setOptions(next)
              }}
              maxLength={MAX_OPTION_LENGTH}
              placeholder={t('option', { n: i + 1 })}
              aria-label={t('option', { n: i + 1 })}
              className={`min-h-11 min-w-0 flex-1 rounded-xl border px-3 outline-none focus:border-zinc-900 ${correctIndex === i ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-300'}`}
            />
          </div>
        ))}
        <p className='text-xs text-zinc-500'>{t('correct')}: ◉</p>
      </fieldset>
      {error && (
        <p className='text-sm text-red-700' role='alert'>
          {t(error)}
        </p>
      )}
      <div className='flex justify-end gap-2'>
        <Button variant='ghost' onClick={onDone} disabled={saving}>
          {t('cancel')}
        </Button>
        <Button type='submit' disabled={saving}>
          {t('save')}
        </Button>
      </div>
    </form>
  )
}
