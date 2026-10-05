export interface Rng {
  next(): number
  normal(mean?: number, sd?: number): number
  logNormal(sigma: number): number
  uniform(min: number, max: number): number
}

// Mixes several integers into a 32-bit seed so each (game, cycle, purpose) gets its own stream
export function hashSeed(...parts: number[]): number {
  let h = 2166136261
  for (const part of parts) {
    h ^= part >>> 0
    h = Math.imul(h, 16777619)
    h ^= h >>> 13
  }
  return h >>> 0
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const normal = (mean = 0, sd = 1): number => {
    const u = Math.max(next(), Number.EPSILON)
    const v = next()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  return {
    next,
    normal,
    logNormal: (sigma: number) => Math.exp(normal(0, sigma) - (sigma * sigma) / 2),
    uniform: (min: number, max: number) => min + (max - min) * next(),
  }
}
