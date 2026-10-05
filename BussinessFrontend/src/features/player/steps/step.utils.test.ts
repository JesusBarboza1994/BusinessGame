import { describe, expect, it } from 'vitest'

import { stepOfField } from './step.utils'

describe('stepOfField', () => {
  it('maps validation fields to the cockpit step that fixes them', () => {
    expect(stepOfField('production.units.A')).toBe('production')
    expect(stepOfField('marketing.price.B')).toBe('market')
    expect(stepOfField('research.quality.A')).toBe('research')
    expect(stepOfField('finance.dividends')).toBe('finance')
    expect(stepOfField('other')).toBe('review')
  })
})
