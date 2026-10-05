const moneyFormatter = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const compactFormatter = new Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 1 })

export const money = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const sign = value < 0 ? '-' : ''
  return `${sign}$${moneyFormatter.format(Math.abs(Math.round(value)))}`
}

export const moneyExact = (value: number | null | undefined): string =>
  value === null || value === undefined || !Number.isFinite(value) ? '—' : `$${decimalFormatter.format(value)}`

export const compactMoney = (value: number): string => `${value < 0 ? '-' : ''}$${compactFormatter.format(Math.abs(value))}`

export const units = (value: number | null | undefined): string =>
  value === null || value === undefined || !Number.isFinite(value) ? '—' : moneyFormatter.format(Math.round(value))

export const pct = (value: number | null | undefined, digits = 1): string =>
  value === null || value === undefined || !Number.isFinite(value) ? '—' : `${(value * 100).toFixed(digits)}%`

export const ratio = (value: number | null | undefined, digits = 2): string =>
  value === null || value === undefined || !Number.isFinite(value) ? '—' : value.toFixed(digits)

export const signed = (value: number): string => (value > 0 ? `+${money(value)}` : money(value))
