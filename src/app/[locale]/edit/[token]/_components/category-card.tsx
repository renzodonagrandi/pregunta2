'use client'

import { upload } from '@vercel/blob/client'
import { useTranslations } from 'next-intl'
import { useRef, useState, type ChangeEvent } from 'react'
import { CategoryAvatar } from '@/components/category-avatar'
import { Button } from '@/components/ui/button'
import {
  IMAGE_MAX_SIDE,
  MAX_CATEGORY_NAME_LENGTH,
  MIN_CATEGORIES,
} from '@/features/games/constants'
import { CATEGORY_COLORS } from '@/features/games/palette'
import { categoryImagePathname } from '@/features/games/schemas'
import type { EditorCategory } from '@/features/games/types'
import {
  deleteCategoryAction,
  setCategoryImageAction,
  updateCategoryAction,
} from '../actions'
import { useEditor } from './editor-context'

export function CategoryCard({
  category,
  position,
}: {
  category: EditorCategory
  position: number
}) {
  const t = useTranslations('Editor.categories')
  const tErrors = useTranslations('Editor.errors')
  const { token, game, run } = useEditor()
  const [name, setName] = useState(category.name)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const usedColors = new Set(
    game.categories.filter(c => c.id !== category.id).map(c => c.color),
  )
  const displayName = name.trim() || t('unnamed', { position })

  const save = (next: { name?: string; color?: string }) =>
    run(() =>
      updateCategoryAction(token, category.id, {
        name: next.name ?? name,
        color: next.color ?? category.color,
      }),
    )

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError(false)
    setUploading(true)
    try {
      // Loaded on demand: only editors who upload pay for the library.
      const { default: imageCompression } =
        await import('browser-image-compression')
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: IMAGE_MAX_SIDE,
        maxSizeMB: 0.3,
        fileType: 'image/webp',
        initialQuality: 0.85,
        useWebWorker: true,
      })
      const blob = await upload(
        categoryImagePathname(game.id, category.id),
        compressed,
        {
          access: 'public',
          handleUploadUrl: '/api/blob/upload',
          clientPayload: JSON.stringify({ token, categoryId: category.id }),
          contentType: 'image/webp',
        },
      )
      await run(() => setCategoryImageAction(token, category.id, blob.url))
    } catch {
      setUploadError(true)
    } finally {
      setUploading(false)
    }
  }

  return (
    <article className='flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm'>
      <div className='flex items-center gap-3'>
        <CategoryAvatar
          name={displayName}
          color={category.color}
          imageUrl={category.imageUrl}
          size={56}
        />
        <label className='flex min-w-0 flex-1 flex-col gap-1'>
          <span className='text-xs font-semibold text-zinc-600'>
            {t('name')}
          </span>
          <input
            value={name}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            placeholder={t('namePlaceholder')}
            onChange={e => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() !== category.name) void save({ name })
            }}
            className='min-h-11 rounded-xl border border-zinc-300 px-3 outline-none focus:border-zinc-900'
          />
        </label>
      </div>

      <fieldset>
        <legend className='mb-2 text-xs font-semibold text-zinc-600'>
          {t('color')}
        </legend>
        <div className='flex flex-wrap gap-2'>
          {CATEGORY_COLORS.map(color => {
            const taken = usedColors.has(color)
            const selected = color === category.color
            return (
              <button
                key={color}
                type='button'
                disabled={taken}
                aria-pressed={selected}
                aria-label={
                  taken
                    ? t('colorTaken', { color })
                    : t('colorOption', { color })
                }
                title={taken ? t('colorTaken', { color }) : color}
                onClick={() => !selected && void save({ color })}
                className={`relative size-9 rounded-full transition-transform disabled:cursor-not-allowed disabled:opacity-25 ${selected ? 'scale-110 ring-4 ring-zinc-900/30 ring-offset-2' : 'hover:scale-105'}`}
                style={{ backgroundColor: color }}
              >
                {taken && (
                  <span className='absolute inset-0 flex items-center justify-center text-lg font-bold text-white'>
                    ✕
                  </span>
                )}
                {selected && (
                  <span className='absolute inset-0 flex items-center justify-center font-bold text-white'>
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className='flex flex-col gap-2'>
        <span className='text-xs font-semibold text-zinc-600'>
          {t('image')}
        </span>
        <div className='flex flex-wrap items-center gap-2'>
          <input
            ref={fileInput}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={e => void onFile(e)}
          />
          <Button
            variant='secondary'
            className='min-h-11 text-sm'
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            {uploading
              ? t('uploading')
              : category.imageUrl
                ? t('changeImage')
                : t('uploadImage')}
          </Button>
          {category.imageUrl && !uploading && (
            <Button
              variant='ghost'
              className='min-h-11 text-sm'
              onClick={() =>
                void run(() => setCategoryImageAction(token, category.id, null))
              }
            >
              {t('removeImage')}
            </Button>
          )}
        </div>
        {!category.imageUrl && (
          <p className='text-xs text-zinc-500'>{t('noImageHint')}</p>
        )}
        {uploadError && (
          <p className='text-sm text-red-700' role='alert'>
            {tErrors('UPLOAD_FAILED')}
          </p>
        )}
      </div>

      <div className='flex justify-end border-t border-zinc-100 pt-3'>
        {confirmingDelete ? (
          <div className='flex flex-wrap items-center justify-end gap-2'>
            <span className='text-sm'>
              {t('deleteConfirm', { name: displayName })}
            </span>
            <Button
              variant='ghost'
              className='min-h-10 px-3 text-sm'
              onClick={() => setConfirmingDelete(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant='danger'
              className='min-h-10 px-3 text-sm'
              onClick={() =>
                void run(() => deleteCategoryAction(token, category.id))
              }
            >
              {t('confirmDelete')}
            </Button>
          </div>
        ) : (
          <Button
            variant='ghost'
            className='min-h-10 px-3 text-sm text-red-700'
            disabled={game.categories.length <= MIN_CATEGORIES}
            title={
              game.categories.length <= MIN_CATEGORIES
                ? t('minReached', { min: MIN_CATEGORIES })
                : undefined
            }
            onClick={() => setConfirmingDelete(true)}
          >
            {t('delete')}
          </Button>
        )}
      </div>
    </article>
  )
}
