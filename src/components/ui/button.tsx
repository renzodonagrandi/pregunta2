import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-400',
  secondary:
    'bg-white text-zinc-900 ring-1 ring-zinc-300 hover:bg-zinc-100 disabled:text-zinc-400',
  ghost: 'text-zinc-700 hover:bg-zinc-200/60 disabled:text-zinc-400',
  danger: 'bg-red-700 text-white hover:bg-red-600 disabled:bg-red-300',
}

export function buttonClass(variant: Variant = 'primary', extra = ''): string {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed ${VARIANTS[variant]} ${extra}`
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
