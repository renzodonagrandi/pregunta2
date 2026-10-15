'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CopyField({ value, label }: { value: string; label: string }) {
  const t = useTranslations('Editor.publish')
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the field stays selectable as a fallback.
    }
  }

  return (
    <div className='flex items-stretch gap-2'>
      <input
        readOnly
        value={value}
        aria-label={label}
        onFocus={e => e.currentTarget.select()}
        className='min-h-11 min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 font-mono text-xs'
      />
      <Button
        variant='secondary'
        className='min-h-11 shrink-0 px-4 text-sm'
        onClick={copy}
      >
        {copied ? t('copied') : t('copy')}
      </Button>
    </div>
  )
}
