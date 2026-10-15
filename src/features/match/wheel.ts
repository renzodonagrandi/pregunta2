import { getSegments, type GameDefinition } from './engine'

export const CROWN_COLOR = '#1F2937'
export const CROWN_IMAGE = '/crown.svg'

export interface WheelSlice {
  key: string
  kind: 'category' | 'crown'
  color: string
  label: string
  imageUrl: string | null
}

/** Engine segments enriched with what the wheel needs to draw them. */
export function wheelSlices(
  game: Pick<GameDefinition, 'categories'>,
  crownLabel: string,
): WheelSlice[] {
  return getSegments({ ...game, id: '', title: '', questions: [] }).map(
    segment => {
      if (segment.kind === 'crown') {
        return {
          key: 'crown',
          kind: 'crown',
          color: CROWN_COLOR,
          label: crownLabel,
          imageUrl: CROWN_IMAGE,
        }
      }
      const c = game.categories.find(cat => cat.id === segment.categoryId)
      return {
        key: segment.categoryId,
        kind: 'category',
        color: c?.color ?? '#9CA3AF',
        label: c?.name ?? '',
        imageUrl: c?.imageUrl ?? null,
      }
    },
  )
}

/**
 * Rotation (degrees, clockwise) that lands slice `index` under the top pointer,
 * spinning forward from `current` by at least `turns` full turns.
 * `jitter` in [-0.5, 0.5] offsets the landing point inside the slice.
 */
export function rotationForSlice(
  current: number,
  index: number,
  count: number,
  jitter: number,
  turns = 5,
): number {
  const slice = 360 / count
  const target = mod(-(index + 0.5 + jitter * 0.7) * slice, 360)
  const delta = mod(target - mod(current, 360), 360)
  return current + turns * 360 + delta
}

/** Slice index under the top pointer for a given rotation. */
export function sliceAtRotation(rotation: number, count: number): number {
  return Math.floor(mod(-rotation, 360) / (360 / count)) % count
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}
