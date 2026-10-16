import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@vercel/blob', () => ({ del: vi.fn() }))
const { isCategoryImageUrl, isQuestionImageUrl } = await import('./images')

const HOST = 'https://abc123.public.blob.vercel-storage.com'
const GAME = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const CAT = '33333333-3333-4333-8333-333333333333'

describe('question image URLs', () => {
  it('accepts images uploaded for this game (with Blob random suffix)', () => {
    expect(
      isQuestionImageUrl(
        `${HOST}/questions/${GAME}/image-AbC123xyz.webp`,
        GAME,
      ),
    ).toBe(true)
    expect(
      isQuestionImageUrl(`${HOST}/questions/${GAME}/image.webp`, GAME),
    ).toBe(true)
  })

  it('rejects other games, other hosts, other paths and formats', () => {
    expect(
      isQuestionImageUrl(`${HOST}/questions/${OTHER}/image-x.webp`, GAME),
    ).toBe(false)
    expect(
      isQuestionImageUrl(
        `https://evil.example.com/questions/${GAME}/image-x.webp`,
        GAME,
      ),
    ).toBe(false)
    expect(
      isQuestionImageUrl(`${HOST}/categories/${GAME}/image-x.webp`, GAME),
    ).toBe(false)
    expect(
      isQuestionImageUrl(`${HOST}/questions/${GAME}/image-x.png`, GAME),
    ).toBe(false)
    expect(
      isQuestionImageUrl(`${HOST}/questions/${GAME}/image-x/../y.webp`, GAME),
    ).toBe(false)
    expect(
      isQuestionImageUrl(
        `http://abc123.public.blob.vercel-storage.com/questions/${GAME}/image.webp`,
        GAME,
      ),
    ).toBe(false)
    expect(isQuestionImageUrl('not a url', GAME)).toBe(false)
  })
})

describe('category image URLs', () => {
  it('only accepts the exact category path', () => {
    expect(
      isCategoryImageUrl(
        `${HOST}/categories/${GAME}/${CAT}-k9.webp`,
        GAME,
        CAT,
      ),
    ).toBe(true)
    expect(
      isCategoryImageUrl(
        `${HOST}/categories/${GAME}/${OTHER}-k9.webp`,
        GAME,
        CAT,
      ),
    ).toBe(false)
  })
})
