import { describe, expect, it } from 'vitest'

import { money, pct, signed } from './format'

describe('format', () => {
  it('formats money without decimals and keeps the sign', () => {
    expect(money(1234.6)).toBe('$1,235')
    expect(money(-500)).toBe('-$500')
    expect(money(null)).toBe('—')
  })

  it('formats percentages and signed amounts', () => {
    expect(pct(0.1234)).toBe('12.3%')
    expect(signed(10)).toBe('+$10')
  })
})
