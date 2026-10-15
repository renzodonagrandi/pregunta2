'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CategoryAvatar } from '@/components/category-avatar'
import { Button } from '@/components/ui/button'
import { MIN_QUESTIONS_TO_PUBLISH } from '@/features/games/constants'
import type { EditorQuestion } from '@/features/games/types'
import { deleteQuestionAction } from '../actions'
import { useEditor } from './editor-context'
import { QuestionForm } from './question-form'

export function QuestionsStep() {
  const t = useTranslations('Editor')
  const { game } = useEditor()
  const [selectedId, setSelectedId] = useState(game.categories[0]?.id ?? '')
  const category =
    game.categories.find(c => c.id === selectedId) ?? game.categories[0]
  if (!category) return null

  return (
    <div className='flex flex-col gap-4'>
      <div
        className='-mx-4 flex gap-2 overflow-x-auto px-4 pb-1'
        role='tablist'
      >
        {game.categories.map((c, i) => {
          const active = c.id === category.id
          const name = c.name || t('categories.unnamed', { position: i + 1 })
          const enough = c.questions.length >= MIN_QUESTIONS_TO_PUBLISH
          return (
            <button
              key={c.id}
              type='button'
              role='tab'
              aria-selected={active}
              onClick={() => setSelectedId(c.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-semibold transition-all ${active ? 'text-white shadow-md' : 'bg-white ring-1 ring-zinc-200'}`}
              style={active ? { backgroundColor: c.color } : undefined}
            >
              <CategoryAvatar
                name={name}
                color={c.color}
                imageUrl={c.imageUrl}
                size={32}
              />
              {name}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${enough ? 'bg-emerald-100 text-emerald-800' : active ? 'bg-white/25' : 'bg-zinc-100 text-zinc-600'}`}
              >
                {c.questions.length}/{MIN_QUESTIONS_TO_PUBLISH}
              </span>
            </button>
          )
        })}
      </div>

      <CategoryQuestions
        key={category.id}
        categoryId={category.id}
        name={
          category.name ||
          t('categories.unnamed', {
            position: game.categories.indexOf(category) + 1,
          })
        }
        questions={category.questions}
      />
    </div>
  )
}

function CategoryQuestions({
  categoryId,
  name,
  questions,
}: {
  categoryId: string
  name: string
  questions: EditorQuestion[]
}) {
  const t = useTranslations('Editor.questions')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-end justify-between gap-2'>
        <div>
          <h2 className='text-xl font-bold'>{t('heading', { name })}</h2>
          <p className='text-sm text-zinc-600'>
            {t('total', { count: questions.length })} ·{' '}
            {t('progress', {
              count: Math.min(questions.length, MIN_QUESTIONS_TO_PUBLISH),
              min: MIN_QUESTIONS_TO_PUBLISH,
            })}
          </p>
        </div>
      </div>

      {adding ? (
        <QuestionForm categoryId={categoryId} onDone={() => setAdding(false)} />
      ) : (
        <Button className='w-full' onClick={() => setAdding(true)}>
          + {t('add')}
        </Button>
      )}

      {questions.length === 0 && !adding && (
        <p className='rounded-2xl bg-white p-6 text-center text-zinc-500'>
          {t('empty')}
        </p>
      )}

      <ol className='flex flex-col gap-2'>
        {questions.map((q, i) =>
          editingId === q.id ? (
            <li key={q.id}>
              <QuestionForm
                categoryId={categoryId}
                question={q}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <QuestionItem
              key={q.id}
              index={i + 1}
              question={q}
              onEdit={() => setEditingId(q.id)}
            />
          ),
        )}
      </ol>
    </section>
  )
}

function QuestionItem({
  index,
  question,
  onEdit,
}: {
  index: number
  question: EditorQuestion
  onEdit: () => void
}) {
  const t = useTranslations('Editor.questions')
  const { token, run } = useEditor()
  const [confirming, setConfirming] = useState(false)

  return (
    <li className='flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm'>
      <p className='font-semibold'>
        <span className='text-zinc-400'>{index}. </span>
        {question.text}
      </p>
      <p className='text-sm text-emerald-700'>
        {t('correctAnswer', {
          answer: question.options[question.correctIndex] ?? '',
        })}
      </p>
      <div className='flex justify-end gap-1'>
        {confirming ? (
          <>
            <span className='mr-auto self-center text-sm'>
              {t('deleteConfirm')}
            </span>
            <Button
              variant='ghost'
              className='min-h-10 px-3 text-sm'
              onClick={() => setConfirming(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant='danger'
              className='min-h-10 px-3 text-sm'
              onClick={() =>
                void run(() => deleteQuestionAction(token, question.id))
              }
            >
              {t('confirmDelete')}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant='ghost'
              className='min-h-10 px-3 text-sm'
              onClick={onEdit}
            >
              {t('edit')}
            </Button>
            <Button
              variant='ghost'
              className='min-h-10 px-3 text-sm text-red-700'
              onClick={() => setConfirming(true)}
            >
              {t('delete')}
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
