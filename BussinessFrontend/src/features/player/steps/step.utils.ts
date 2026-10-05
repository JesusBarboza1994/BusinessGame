import type { StepId } from '@/lib/constants'

export const stepOfField = (field: string): StepId => {
  if (field.startsWith('production')) return 'production'
  if (field.startsWith('marketing')) return 'market'
  if (field.startsWith('research')) return 'research'
  if (field.startsWith('finance')) return 'finance'
  return 'review'
}
