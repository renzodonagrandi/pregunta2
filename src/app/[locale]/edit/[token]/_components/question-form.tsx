'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  MAX_OPTION_LENGTH,
  MAX_QUESTION_LENGTH,
  QUESTION_IMAGE_MAX_SIDE,
} from '@/features/games/constants'
import {
  questionImagePathname,
  questionInputSchema,
} from '@/features/games/schemas'
import type { EditorQuestion } from '@/features/games/types'
import { compressAndUpload } from '@/features/games/upload-image'
import {
  createQuestionAction,
  discardQuestionImageAction,
  updateQuestionAction,
} from '../actions'
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
  const tErrors = useTranslations('Editor.errors')
  const { token, game, run } = useEditor()
  const [text, setText] = useState(question?.text ?? '')
  const [options, setOptions] = useState<Options>(
    question ? [...question.options] : ['', '', '', ''],
  )
  const [correctIndex, setCorrectIndex] = useState(question?.correctIndex ?? 0)
  const [error, setError] = useState<
    'requiredFields' | 'duplicateOptions' | null
  >(null)
  const [saving, setSaving] = useState(false)
  const [imageUrl, setImageUrl] = useState(question?.imageUrl ?? null)
  // Uploaded in this form and not saved yet: removed if it ends up unused.
  const [pendingUpload, setPendingUpload] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const discardPending = () => {
    if (pendingUpload) void discardQuestionImageAction(token, pendingUpload)
    setPendingUpload(null)
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError(false)
    setUploading(true)
    try {
      const url = await compressAndUpload(file, {
        pathname: questionImagePathname(game.id),
        maxSide: QUESTION_IMAGE_MAX_SIDE,
        payload: { kind: 'question', token },
      })
      discardPending()
      setPendingUpload(url)
      setImageUrl(url)
    } catch {
      setUploadError(true)
    } finally {
      setUploading(false)
    }
  }

  const cancel = () => {
    discardPending()
    onDone()
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = questionInputSchema.safeParse({
      text,
      imageUrl,
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
    if (ok) {
      setPendingUpload(null)
      onDone()
    }
  }

  return (
    <form
      method='post'
      onSubmit={e => void onSubmit(e)}
      className='flex flex-col gap-3 rounded-2xl border-2 border-night bg-white p-4'
      noValidate
    >
      <label className='flex flex-col gap-1'>
        <span className='font-display text-sm font-semibold'>{t('text')}</span>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder={t('textPlaceholder')}
          rows={2}
          autoFocus
          className='rounded-xl border-2 border-chalk-300 px-3 py-2 text-lg outline-none placeholder:text-night/35 focus:border-night'
        />
      </label>
      <div className='flex flex-col gap-2'>
        <span className='font-display text-sm font-semibold'>{t('image')}</span>
        {imageUrl && (
          <div className='relative h-40 overflow-hidden rounded-xl bg-chalk'>
            <Image
              src={imageUrl}
              alt={t('imageAlt')}
              fill
              sizes='(min-width: 1024px) 40rem, 100vw'
              unoptimized
              className='object-contain'
            />
          </div>
        )}
        <div className='flex flex-wrap items-center gap-2'>
          <input
            ref={fileInput}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={e => void onFile(e)}
          />
          <Button
            variant='outline'
            className='min-h-10 text-sm'
            disabled={uploading || saving}
            onClick={() => fileInput.current?.click()}
          >
            {uploading
              ? t('uploading')
              : imageUrl
                ? t('changeImage')
                : t('addImage')}
          </Button>
          {imageUrl && !uploading && (
            <Button
              variant='ghost'
              className='min-h-10 text-sm'
              onClick={() => {
                discardPending()
                setImageUrl(null)
              }}
            >
              {t('removeImage')}
            </Button>
          )}
        </div>
        {!imageUrl && <p className='text-xs text-night/60'>{t('imageHint')}</p>}
        {uploadError && (
          <p className='text-sm text-[#a3262c]' role='alert'>
            {tErrors('UPLOAD_FAILED')}
          </p>
        )}
      </div>
      <fieldset className='flex flex-col gap-2'>
        {options.map((option, i) => (
          <div key={i} className='flex items-center gap-2'>
            <input
              type='radio'
              name={`correct-${question?.id ?? 'new'}`}
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
              aria-label={t('markCorrect', { n: i + 1 })}
              className='size-6 shrink-0 accent-[#1b6b48]'
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
              className={`min-h-11 min-w-0 flex-1 rounded-xl border-2 px-3 outline-none placeholder:text-night/35 focus:border-night ${correctIndex === i ? 'border-ok bg-ok/10' : 'border-chalk-300'}`}
            />
          </div>
        ))}
      </fieldset>
      {error && (
        <p className='text-sm text-[#a3262c]' role='alert'>
          {t(error)}
        </p>
      )}
      <div className='flex justify-end gap-2'>
        <Button variant='ghost' onClick={cancel} disabled={saving}>
          {t('cancel')}
        </Button>
        <Button type='submit' disabled={saving || uploading}>
          {t('save')}
        </Button>
      </div>
    </form>
  )
}
