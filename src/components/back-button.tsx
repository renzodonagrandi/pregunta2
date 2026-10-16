'use client'

import { useRouter } from '@/i18n/navigation'

/** Minimal typing for the Navigation API (not in TypeScript's DOM lib yet). */
interface NavigationLike {
  currentEntry: { index: number } | null
}

/**
 * True when the previous history entry is a page of this site. The Navigation
 * API only exposes same-origin entries, so index > 0 means "came from here".
 * Browsers without it fall back to the referrer.
 */
function cameFromThisSite(): boolean {
  const navigation = (window as { navigation?: NavigationLike }).navigation
  if (navigation?.currentEntry) return navigation.currentEntry.index > 0
  return (
    window.history.length > 1 &&
    document.referrer.startsWith(window.location.origin)
  )
}

/** Goes back within the site; from an external or fresh tab, goes home. */
export function useGoBack(): () => void {
  const router = useRouter()
  return () => {
    if (cameFromThisSite()) router.back()
    else router.push('/')
  }
}

interface BackButtonProps {
  label: string
  /** Replaces the default navigation (e.g. to confirm before leaving). */
  onClick?: () => void
  className?: string
}

export function BackButton({
  label,
  onClick,
  className = '',
}: BackButtonProps) {
  const goBack = useGoBack()
  return (
    <button
      type='button'
      onClick={onClick ?? goBack}
      aria-label={label}
      title={label}
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-current/10 ${className}`}
    >
      <svg viewBox='0 0 24 24' className='size-5' aria-hidden>
        <path
          d='M15 5l-7 7 7 7'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </button>
  )
}
