'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wheel } from '@/components/wheel'
import {
  MAX_CATEGORIES,
  MAX_TITLE_LENGTH,
  MIN_CATEGORIES,
} from '@/features/games/constants'
import { wheelSlices } from '@/features/match/wheel'
import { addCategoryAction, updateGameMetaAction } from '../actions'
import { CategoryCard } from './category-card'
import { useEditor } from './editor-context'
import { INPUT_CLASS } from './styles'

export function CategoriesStep() {
  const t = useTranslations('Editor')
  const tReveal = useTranslations('Match.reveal')
  const { token, game, run } = useEditor()
  const [title, setTitle] = useState(game.title)
  // Names being typed, so the wheel preview updates live (saved on blur).
  const [draftNames, setDraftNames] = useState<Record<string, string>>({})

  const saveTitle = () => run(() => updateGameMetaAction(token, { title }))

  const slices = wheelSlices(
    {
      categories: game.categories.map((c, i) => ({
        ...c,
        name:
          (draftNames[c.id] ?? c.name).trim() ||
          t('categories.unnamed', { position: i + 1 }),
      })),
    },
    tReveal('crown'),
  )

  return (
    // Desktop: game name and live wheel pinned on the left, categories on the right.
    <div className='grid gap-8 lg:grid-cols-[20rem_1fr] lg:gap-12'>
      <aside className='flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start'>
        <label className='flex flex-col gap-2'>
          <span className='font-display text-sm font-semibold'>
            {t('meta.title')}
          </span>
          <input
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            placeholder={t('meta.titlePlaceholder')}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() !== game.title) void saveTitle()
            }}
            className={INPUT_CLASS}
          />
        </label>
        <section className='flex flex-col gap-3'>
          <h2 className='font-display text-sm font-semibold text-night/70'>
            {t('categories.preview')}
          </h2>
          <div className='mx-auto w-full max-w-64 lg:max-w-none'>
            <Wheel slices={slices} label={t('categories.preview')} />
          </div>
        </section>
      </aside>

      <section className='flex flex-col gap-4'>
        <div>
          <h2 className='font-display text-2xl font-bold'>
            {t('categories.heading', {
              count: game.categories.length,
              max: MAX_CATEGORIES,
            })}
          </h2>
          <p className='mt-1 text-sm text-night/70'>
            {t('categories.hint', { min: MIN_CATEGORIES, max: MAX_CATEGORIES })}
          </p>
        </div>
        <div className='grid gap-4 xl:grid-cols-2'>
          {game.categories.map((c, i) => (
            <CategoryCard
              key={c.id}
              category={c}
              position={i + 1}
              onNameChange={name =>
                setDraftNames(prev => ({ ...prev, [c.id]: name }))
              }
            />
          ))}
        </div>
        <Button
          variant='outline'
          className='w-full border-dashed'
          disabled={game.categories.length >= MAX_CATEGORIES}
          onClick={() => void run(() => addCategoryAction(token))}
        >
          {t('categories.add')}
        </Button>
        {game.categories.length >= MAX_CATEGORIES && (
          <p className='text-center text-sm text-night/60'>
            {t('categories.maxReached', { max: MAX_CATEGORIES })}
          </p>
        )}
      </section>
    </div>
  )
}
