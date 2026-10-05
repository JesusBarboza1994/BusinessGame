import { deepMerge } from './settings.helper'

describe('deepMerge', () => {
  it('overrides nested values and keeps the rest', () => {
    const merged = deepMerge({ a: 1, b: { c: 2, d: 3 }, e: [1, 2] }, { b: { c: 9 }, e: [5] })

    expect(merged).toEqual({ a: 1, b: { c: 9, d: 3 }, e: [5] })
  })
})
