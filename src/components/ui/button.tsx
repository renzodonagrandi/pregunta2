import type { ButtonHTMLAttributes } from 'react'

/**
 * primary: the amber action (one per screen). ink: solid navy, for chalk
 * backgrounds. outline / ghost use currentColor, so they adapt to either
 * background. danger: destructive confirmation.
 */
type Variant = 'primary' | 'ink' | 'outline' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-amber text-night hover:bg-amber-600 disabled:bg-night-700 disabled:text-mist',
  ink: 'bg-night text-chalk hover:bg-night-800 disabled:bg-chalk-300 disabled:text-night/50',
  outline:
    'border-2 border-current/30 hover:border-current/60 hover:bg-current/5 disabled:opacity-40',
  ghost: 'hover:bg-current/10 disabled:opacity-40',
  danger: 'bg-bad text-white hover:brightness-110 disabled:opacity-40',
}

export function buttonClass(variant: Variant = 'primary', extra = ''): string {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-display text-base font-semibold tracking-wide transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${extra}`
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, className)}
      {...props}
    />
  )
}
