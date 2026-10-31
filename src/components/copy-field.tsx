'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CopyFieldProps {
  value: string
  /** Accessible name of the field. */
  label: string
  copyLabel: string
  copiedLabel: string
}

/** Read-only field with a copy button (the field stays selectable). */
export function CopyField({
  value,
  label,
  copyLabel,
  copiedLabel,
}: CopyFieldProps) {
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
        className='min-h-11 min-w-0 flex-1 rounded-xl border-2 border-chalk-300 bg-white px-3 text-sm text-night/80'
      />
      <Button
        variant='outline'
        className='min-h-11 shrink-0 px-4 text-sm'
        onClick={copy}
      >
        {copied ? copiedLabel : copyLabel}
      </Button>
    </div>
  )
}
