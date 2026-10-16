import { MarkPaths } from '@/components/brand/logo'
import type { WheelSlice } from '@/features/match/wheel'

interface WheelProps {
  slices: WheelSlice[]
  /** Clockwise rotation in degrees. */
  rotation?: number
  /** Animation length for rotation changes; 0 disables the transition. */
  durationMs?: number
  label: string
  className?: string
}

const R = 100

/** Point on the circle at `deg` degrees clockwise from 12 o'clock. */
function point(deg: number, radius: number): [number, number] {
  const rad = (deg * Math.PI) / 180
  return [radius * Math.sin(rad), -radius * Math.cos(rad)]
}

export function Wheel({
  slices,
  rotation = 0,
  durationMs = 0,
  label,
  className = '',
}: WheelProps) {
  const count = slices.length
  const slice = 360 / count
  const iconRadius = Math.min(21, 66 * Math.sin(Math.PI / count))

  return (
    <div className={`relative aspect-square w-full ${className}`}>
      {/* Pointer: an amber notch, like the strokes of the logo. */}
      <svg
        viewBox='0 0 28 30'
        className='absolute top-0 left-1/2 z-10 w-9 -translate-x-1/2 -translate-y-2 drop-shadow-[0_3px_0_rgba(18,24,41,0.6)]'
        aria-hidden
      >
        <path
          d='M3 3h22L14 27Z'
          fill='var(--color-amber)'
          stroke='var(--color-night)'
          strokeWidth='3'
          strokeLinejoin='round'
        />
      </svg>
      <svg
        viewBox={`${-R - 8} ${-R - 8} ${2 * R + 16} ${2 * R + 16}`}
        role='img'
        aria-label={label}
        className='h-full w-full'
      >
        <circle r={R + 7} fill='var(--color-night-800)' />
        <circle
          r={R + 7}
          fill='none'
          stroke='var(--color-night-600)'
          strokeWidth='1.5'
        />
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: durationMs
              ? `transform ${durationMs}ms cubic-bezier(0.12, 0.67, 0.18, 1)`
              : 'none',
          }}
        >
          {slices.map((s, i) => {
            const start = i * slice
            const end = start + slice
            const mid = start + slice / 2
            const [x1, y1] = point(start, R)
            const [x2, y2] = point(end, R)
            const [cx, cy] = point(mid, R * 0.63)
            const large = slice > 180 ? 1 : 0
            const clipId = `wheel-clip-${s.key}`
            return (
              <g key={s.key}>
                <path
                  d={`M0 0L${x1} ${y1}A${R} ${R} 0 ${large} 1 ${x2} ${y2}Z`}
                  fill={s.color}
                  stroke='var(--color-night)'
                  strokeWidth='3'
                  strokeLinejoin='round'
                />
                <g transform={`translate(${cx} ${cy}) rotate(${mid})`}>
                  {s.imageUrl ? (
                    <>
                      <clipPath id={clipId}>
                        <circle r={iconRadius} />
                      </clipPath>
                      {s.kind === 'category' && (
                        <circle
                          r={iconRadius + 2}
                          fill='var(--color-night)'
                          opacity='0.35'
                        />
                      )}
                      <image
                        href={s.imageUrl}
                        x={-iconRadius}
                        y={-iconRadius}
                        width={iconRadius * 2}
                        height={iconRadius * 2}
                        clipPath={
                          s.kind === 'category' ? `url(#${clipId})` : undefined
                        }
                        preserveAspectRatio='xMidYMid slice'
                      />
                    </>
                  ) : (
                    <text
                      textAnchor='middle'
                      dominantBaseline='central'
                      fill='white'
                      fontFamily='var(--font-display)'
                      fontWeight='700'
                      fontSize={iconRadius * 1.35}
                    >
                      {s.label.trim().charAt(0).toUpperCase() || '?'}
                    </text>
                  )}
                </g>
              </g>
            )
          })}
        </g>
        {/* Hub stays still while the wheel turns under it. */}
        <circle
          r='19'
          fill='var(--color-night)'
          stroke='var(--color-night-600)'
          strokeWidth='1.5'
        />
        <svg
          x='-12'
          y='-9'
          width='24'
          height='18'
          viewBox='0 0 160 120'
          color='var(--color-chalk)'
        >
          <MarkPaths />
        </svg>
      </svg>
    </div>
  )
}
