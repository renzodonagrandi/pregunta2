import 'server-only'
import { createHash, randomBytes } from 'node:crypto'

/** 32 random bytes as base64url: 43 URL-safe chars, no dots (proxy-safe). */
export function generateEditToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashEditToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function draftSlug(): string {
  return `draft-${randomBytes(8).toString('hex')}`
}

export function isDraftSlug(slug: string): boolean {
  return slug.startsWith('draft-')
}

/** Readable, URL-safe slug: "historia-argentina-k3x9p". */
export function publicSlug(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
  const suffix = Array.from(randomBytes(5), b => (b % 36).toString(36)).join('')
  return base ? `${base}-${suffix}` : `juego-${suffix}`
}
