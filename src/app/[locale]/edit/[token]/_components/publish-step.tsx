'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button, buttonClass } from '@/components/ui/button'
import {
  MAX_CATEGORIES,
  MIN_CATEGORIES,
  MIN_QUESTIONS_TO_PUBLISH,
} from '@/features/games/constants'
import { publishIssues, type PublishIssue } from '@/features/games/requirements'
import { publishAction } from '../actions'
import { CopyField } from './copy-field'
import { useEditor } from './editor-context'
import { useEditLink, usePlayLink } from './use-links'

export function PublishStep() {
  const t = useTranslations('Editor')
  const { token, game, setGame } = useEditor()
  const [publishing, setPublishing] = useState(false)
  const [notReady, setNotReady] = useState(false)
  const playLink = usePlayLink(game.slug)
  const editLink = useEditLink(token)
  const issues = publishIssues(game)

  const issueText = (issue: PublishIssue) => {
    switch (issue.code) {
      case 'TITLE_MISSING':
        return t('publish.issues.TITLE_MISSING')
      case 'CATEGORY_COUNT':
        return t('publish.issues.CATEGORY_COUNT', {
          min: MIN_CATEGORIES,
          max: MAX_CATEGORIES,
          count: issue.count,
        })
      case 'CATEGORY_NAME_MISSING':
        return t('publish.issues.CATEGORY_NAME_MISSING', {
          position: issue.position,
        })
      case 'NOT_ENOUGH_QUESTIONS':
        return t('publish.issues.NOT_ENOUGH_QUESTIONS', {
          name:
            issue.name ||
            t('categories.unnamed', {
              position:
                game.categories.findIndex(c => c.id === issue.categoryId) + 1,
            }),
          min: MIN_QUESTIONS_TO_PUBLISH,
          count: issue.count,
        })
    }
  }

  const publish = async () => {
    setPublishing(true)
    try {
      const result = await publishAction(token)
      setNotReady(!result.ok)
      if (result.ok) setGame(result.game)
    } finally {
      setPublishing(false)
    }
  }

  if (game.published) {
    return (
      <section className='flex max-w-2xl flex-col gap-5'>
        <div className='rounded-2xl border-l-4 border-ok bg-ok/12 p-4'>
          <h2 className='font-display text-xl font-bold'>
            {t('publish.publishedTitle')}
          </h2>
          <p className='text-sm'>{t('publish.publishedHint')}</p>
        </div>
        <div className='flex flex-col gap-2 rounded-2xl border-2 border-chalk-200 bg-white p-4'>
          <h3 className='font-display font-semibold'>
            {t('publish.publicLink')}
          </h3>
          <p className='text-sm text-night/70'>{t('publish.publicHint')}</p>
          <CopyField value={playLink} label={t('publish.publicLink')} />
          <a href={playLink} className={buttonClass('primary', 'mt-2 w-full')}>
            {t('publish.play')}
          </a>
        </div>
        <div className='flex flex-col gap-2 rounded-2xl border-2 border-bad/40 bg-white p-4'>
          <h3 className='font-display font-semibold'>
            {t('publish.editLink')}
          </h3>
          <p className='text-sm font-medium text-[#8f1f24]'>
            {t('publish.editWarning')}
          </p>
          <CopyField value={editLink} label={t('publish.editLink')} />
        </div>
      </section>
    )
  }

  return (
    <section className='flex max-w-2xl flex-col gap-4 rounded-2xl border-2 border-chalk-200 bg-white p-5'>
      <h2 className='font-display text-xl font-bold'>{t('publish.heading')}</h2>
      {issues.length === 0 ? (
        <p className='font-medium text-[#1b6b48]'>{t('publish.ready')}</p>
      ) : (
        <div>
          <p className='font-medium'>{t('publish.missing')}</p>
          <ul className='mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-night/80'>
            {issues.map((issue, i) => (
              <li key={i}>{issueText(issue)}</li>
            ))}
          </ul>
        </div>
      )}
      {notReady && (
        <p className='text-sm text-[#a3262c]' role='alert'>
          {t('errors.NOT_READY')}
        </p>
      )}
      <Button
        className='w-full text-lg'
        disabled={issues.length > 0 || publishing}
        onClick={() => void publish()}
      >
        {publishing ? t('publish.publishing') : t('publish.button')}
      </Button>
    </section>
  )
}
