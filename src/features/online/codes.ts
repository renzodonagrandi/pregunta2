import 'server-only'
import { randomInt } from 'node:crypto'

// No 0/o, 1/l/i: easy to read aloud or type from a screenshot.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'
export const INVITE_CODE_LENGTH = 8

/** Short, URL-safe invite code, e.g. "k7m2qx9d" (31^8 ≈ 850 billion). */
export function generateInviteCode(): string {
  let code = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)]
  }
  return code
}

export const inviteCodePattern = new RegExp(
  `^[${ALPHABET}]{${INVITE_CODE_LENGTH}}$`,
)
