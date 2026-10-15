import { describe, expect, it } from 'vitest'
import { rotationForSlice, sliceAtRotation, wheelSlices } from './wheel'

describe('wheel geometry', () => {
  it.each([4, 5, 7])('lands on the requested slice (%i slices)', count => {
    let rotation = 0
    for (let i = 0; i < count; i++) {
      for (const jitter of [-0.5, 0, 0.5]) {
        const next = rotationForSlice(rotation, i, count, jitter)
        expect(next).toBeGreaterThanOrEqual(rotation + 5 * 360)
        expect(sliceAtRotation(next, count)).toBe(i)
        rotation = next
      }
    }
  })

  it('puts the crown last', () => {
    const slices = wheelSlices(
      {
        categories: [
          { id: 'a', name: 'A', color: '#000000', imageUrl: null },
          { id: 'b', name: 'B', color: '#111111', imageUrl: null },
          { id: 'c', name: 'C', color: '#222222', imageUrl: null },
        ],
      },
      'Corona',
    )
    expect(slices.map(s => s.kind)).toEqual([
      'category',
      'category',
      'category',
      'crown',
    ])
  })
})
