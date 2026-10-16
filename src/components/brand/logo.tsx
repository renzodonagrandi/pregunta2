/**
 * Pregunta2 wordmark, inlined (no extra request). Letters use currentColor so
 * the same mark works on night and chalk backgrounds; the "2" stays amber.
 */
const LETTERS: [string, number, number][] = [
  ['M7,100 V10', 0, 0],
  ['M20,17 H40 Q61,17 61,40 Q61,63 40,63 H20', 0, 0],
  ['M7,100 V40', 77, 0],
  ['M20,47 H43', 77, 0],
  ['M7,70 H57 V63 Q57,47 41,47 H23 Q7,47 7,63 V77 Q7,93 23,93 H57', 136, 0],
  ['M73,47 H23 Q7,47 7,63 V77 Q7,93 23,93 H53', 209, 0],
  ['M73,40 V112 Q73,128 57,128 H7', 209, 0],
  ['M7,40 V77 Q7,93 23,93 H53', 298, 0],
  ['M66,40 V100', 298, 0],
  ['M7,40 V100', 380, 0],
  ['M20,47 H50 Q66,47 66,63 V100', 380, 0],
  ['M14,18 V79 Q14,93 28,93 H44', 462, 0],
  ['M0,47 H40', 462, 0],
  ['M73,47 H23 Q7,47 7,63 V77 Q7,93 23,93 H53', 517, 0],
  ['M73,40 V100', 517, 0],
]

const TWO = [
  'M7,40 V33 Q7,17 24,17 H50 Q67,17 67,34 V39 Q67,51 56,57 L22,78',
  'M7,93 H67',
]

export function Logo({
  label,
  className = '',
}: {
  label: string
  className?: string
}) {
  return (
    <svg
      viewBox='28 28 684 129'
      role='img'
      aria-label={label}
      className={className}
    >
      <g
        transform='translate(30,20)'
        fill='none'
        strokeWidth='14'
        strokeLinejoin='round'
      >
        {LETTERS.map(([d, x], i) => (
          <path
            key={i}
            d={d}
            transform={`translate(${x},0)`}
            stroke='currentColor'
          />
        ))}
        {TWO.map(d => (
          <path
            key={d}
            d={d}
            transform='translate(606,0)'
            stroke='var(--color-amber, #f2a93b)'
          />
        ))}
      </g>
    </svg>
  )
}

/** Strokes of the "P2" monogram, in a 160x120 box. */
export function MarkPaths() {
  return (
    <g
      transform='translate(6,4)'
      fill='none'
      strokeWidth='14'
      strokeLinejoin='round'
    >
      <path d='M7,100 V10' stroke='currentColor' />
      <path
        d='M20,17 H40 Q61,17 61,40 Q61,63 40,63 H20'
        stroke='currentColor'
      />
      <g transform='translate(77,0)' stroke='var(--color-amber, #f2a93b)'>
        <path d={TWO[0]} />
        <path d={TWO[1]} />
      </g>
    </g>
  )
}

/** The "P2" monogram, used as home link and as the wheel's hub. */
export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox='0 0 160 120' aria-hidden className={className}>
      <MarkPaths />
    </svg>
  )
}
