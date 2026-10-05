export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

export const safeDiv = (numerator: number, denominator: number): number | null =>
  Math.abs(denominator) < 1e-9 ? null : numerator / denominator

export const sum = (values: number[]): number => values.reduce((acc, value) => acc + value, 0)

export const round4 = (value: number): number => Math.round((value + Number.EPSILON) * 10000) / 10000

// Rounds every number inside a plain object/array to 4 decimals (for reports, never for state)
export function roundDeep<T>(value: T): T {
  if (typeof value === 'number') return (Number.isFinite(value) ? round4(value) : value) as T
  if (Array.isArray(value)) return value.map((item) => roundDeep(item)) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) out[key] = roundDeep(item)
    return out as T
  }
  return value
}
