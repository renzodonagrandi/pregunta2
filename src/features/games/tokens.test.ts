import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const { generateEditToken, hashEditToken, publicSlug } =
  await import('./tokens')
const { editTokenSchema } = await import('./schemas')

describe('tokens', () => {
  it('generates long URL-safe edit tokens that pass validation', () => {
    const a = generateEditToken()
    expect(a).not.toBe(generateEditToken())
    expect(editTokenSchema.safeParse(a).success).toBe(true)
  })

  it('hashes deterministically', () => {
    expect(hashEditToken('x')).toBe(hashEditToken('x'))
    expect(hashEditToken('x')).toHaveLength(64)
  })

  it('builds readable slugs without accents or dots', () => {
    expect(publicSlug('Historia Argentina: ¡Año 1810!')).toMatch(
      /^historia-argentina-ano-1810-[a-z0-9]{5}$/,
    )
    expect(publicSlug('¿¿??')).toMatch(/^juego-[a-z0-9]{5}$/)
  })
})
