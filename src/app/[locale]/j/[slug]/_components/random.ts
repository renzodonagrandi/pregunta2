import type { Rng } from '@/features/match/engine'

/** Browser RNG backed by crypto; used to build the random parts of actions. */
export const cryptoRng: Rng = () => {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return (buf[0] ?? 0) / 4294967296
}

export function randomSeed(): number {
  return Math.floor(cryptoRng() * 4294967296)
}
