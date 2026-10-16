import { describe, expect, it } from 'vitest'
import { $ZodError } from 'zod/v4/core'
import { editTokenSchema, questionInputSchema } from './schemas'

describe('question input', () => {
  const valid = {
    text: ' ¿Capital? ',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 2,
  }

  it('trims and accepts a valid question', () => {
    expect(questionInputSchema.parse(valid).text).toBe('¿Capital?')
  })

  it('rejects empty options, bad index and duplicated options', () => {
    expect(
      questionInputSchema.safeParse({ ...valid, options: ['A', '', 'C', 'D'] })
        .success,
    ).toBe(false)
    expect(
      questionInputSchema.safeParse({ ...valid, options: ['A', 'B', 'C'] })
        .success,
    ).toBe(false)
    expect(
      questionInputSchema.safeParse({ ...valid, correctIndex: 4 }).success,
    ).toBe(false)
    expect(
      questionInputSchema.safeParse({ ...valid, options: ['A', 'a', 'C', 'D'] })
        .success,
    ).toBe(false)
  })
})

describe('edit token', () => {
  it('only accepts 43-char base64url tokens', () => {
    expect(editTokenSchema.safeParse('a'.repeat(43)).success).toBe(true)
    expect(editTokenSchema.safeParse('a'.repeat(42)).success).toBe(false)
    expect(editTokenSchema.safeParse(`${'a'.repeat(42)}.`).success).toBe(false)
  })
})

describe('schema errors', () => {
  it('throw $ZodError, which server actions map to INVALID_INPUT', () => {
    expect(() => questionInputSchema.parse({})).toThrow($ZodError)
  })

  it('defaults a missing image to null', () => {
    const parsed = questionInputSchema.parse({
      text: 'q',
      options: ['a', 'b', 'c', 'd'],
      correctIndex: 0,
    })
    expect(parsed.imageUrl).toBeNull()
  })
})
