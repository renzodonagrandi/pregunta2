import { describe, expect, it } from 'vitest'
import { CATEGORY_COLORS, contrastRatio } from './palette'

describe('category palette', () => {
  it('has 8 to 10 unique colors', () => {
    expect(CATEGORY_COLORS.length).toBeGreaterThanOrEqual(8)
    expect(CATEGORY_COLORS.length).toBeLessThanOrEqual(10)
    expect(new Set(CATEGORY_COLORS).size).toBe(CATEGORY_COLORS.length)
  })

  it.each(CATEGORY_COLORS)('%s has AA contrast with white text', color => {
    expect(contrastRatio(color, '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
  })
})
