/** A function returning floats in [0, 1). */
export type Rng = () => number

/** Small deterministic PRNG (mulberry32). Same seed, same sequence. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive)
}

/** Draws a uint32 seed to put inside an action. */
export function makeSeed(rng: Rng): number {
  return Math.floor(rng() * 4294967296) >>> 0
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1)
    const tmp = out[i] as T
    out[i] = out[j] as T
    out[j] = tmp
  }
  return out
}
