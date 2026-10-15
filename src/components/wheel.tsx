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
  const iconRadius = Math.min(22, 70 * Math.sin(Math.PI / count))

  return (
    <div className={`relative aspect-square w-full ${className}`}>
      {/* Pointer */}
      <svg
        viewBox='0 0 20 20'
        className='absolute top-0 left-1/2 z-10 w-8 -translate-x-1/2 -translate-y-1 drop-shadow'
        aria-hidden
      >
        <path
          d='M2 2h16L10 18Z'
          fill='#111827'
          stroke='white'
          strokeWidth='2'
        />
      </svg>
      <svg
        viewBox={`${-R - 4} ${-R - 4} ${2 * R + 8} ${2 * R + 8}`}
        role='img'
        aria-label={label}
        className='h-full w-full drop-shadow-lg'
      >
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: durationMs
              ? `transform ${durationMs}ms cubic-bezier(0.12, 0.67, 0.18, 1)`
              : 'none',
          }}
        >
          <circle r={R + 3} fill='white' />
          {slices.map((s, i) => {
            const start = i * slice
            const end = start + slice
            const mid = start + slice / 2
            const [x1, y1] = point(start, R)
            const [x2, y2] = point(end, R)
            const [cx, cy] = point(mid, R * 0.62)
            const large = slice > 180 ? 1 : 0
            const clipId = `wheel-clip-${s.key}`
            return (
              <g key={s.key}>
                <path
                  d={`M0 0L${x1} ${y1}A${R} ${R} 0 ${large} 1 ${x2} ${y2}Z`}
                  fill={s.color}
                  stroke='white'
                  strokeWidth='1.5'
                />
                <g transform={`translate(${cx} ${cy}) rotate(${mid})`}>
                  {s.imageUrl ? (
                    <>
                      <clipPath id={clipId}>
                        <circle r={iconRadius} />
                      </clipPath>
                      {s.kind === 'category' && (
                        <circle r={iconRadius + 1.5} fill='white' />
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
                      fontWeight='800'
                      fontSize={iconRadius * 1.3}
                    >
                      {s.label.trim().charAt(0).toUpperCase() || '?'}
                    </text>
                  )}
                </g>
              </g>
            )
          })}
          <circle r='12' fill='white' stroke='#E5E7EB' strokeWidth='2' />
        </g>
      </svg>
    </div>
  )
}
