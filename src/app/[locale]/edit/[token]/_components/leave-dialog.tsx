'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { CopyField } from './copy-field'

/**
 * Shown before leaving the editor: the edit link is the only way back, so
 * offer to copy it. Native <dialog>: focus trap, Esc to close, inert page.
 */
export function LeaveDialog({
  open,
  editLink,
  onStay,
  onLeave,
}: {
  open: boolean
  editLink: string
  onStay: () => void
  onLeave: () => void
}) {
  const t = useTranslations('Editor')
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // showModal focuses the first field (the link, selected); start on
      // the safe choice instead.
      dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onStay}
      onClick={e => {
        // A click on the backdrop (the dialog element itself) means "stay".
        if (e.target === e.currentTarget) onStay()
      }}
      aria-labelledby='leave-title'
      className='theme-chalk m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl bg-chalk p-0 text-night backdrop:bg-night/60'
    >
      <div className='flex flex-col gap-4 p-5'>
        <h2 id='leave-title' className='font-display text-xl font-bold'>
          {t('leave.title')}
        </h2>
        <p className='text-night/80'>{t('leave.body')}</p>
        <CopyField value={editLink} label={t('publish.editLink')} />
        <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <Button variant='ghost' onClick={onLeave}>
            {t('leave.leave')}
          </Button>
          <Button variant='ink' onClick={onStay} data-initial-focus>
            {t('leave.stay')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
