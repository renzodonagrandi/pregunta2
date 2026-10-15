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
    <div className='flex flex-col gap-6'>
      <section className='flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm'>
        <label className='flex flex-col gap-1'>
          <span className='text-sm font-semibold'>{t('meta.title')}</span>
          <input
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            placeholder={t('meta.titlePlaceholder')}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() !== game.title) void saveTitle()
            }}
            className='min-h-12 rounded-xl border border-zinc-300 px-3 text-lg outline-none focus:border-zinc-900'
          />
        </label>
      </section>

      <section className='flex flex-col items-center gap-2'>
        <h2 className='self-start text-sm font-semibold text-zinc-600'>
          {t('categories.preview')}
        </h2>
        <div className='w-full max-w-64'>
          <Wheel slices={slices} label={t('categories.preview')} />
        </div>
      </section>

      <section className='flex flex-col gap-3'>
        <div>
          <h2 className='text-xl font-bold'>
            {t('categories.heading', {
              count: game.categories.length,
              max: MAX_CATEGORIES,
            })}
          </h2>
          <p className='text-sm text-zinc-600'>
            {t('categories.hint', { min: MIN_CATEGORIES, max: MAX_CATEGORIES })}
          </p>
        </div>
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
        <Button
          variant='secondary'
          className='w-full'
          disabled={game.categories.length >= MAX_CATEGORIES}
          onClick={() => void run(() => addCategoryAction(token))}
        >
          + {t('categories.add')}
        </Button>
        {game.categories.length >= MAX_CATEGORIES && (
          <p className='text-center text-sm text-zinc-500'>
            {t('categories.maxReached', { max: MAX_CATEGORIES })}
          </p>
        )}
      </section>
    </div>
  )
}
