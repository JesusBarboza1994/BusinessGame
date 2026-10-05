import type { CompanyDecisions, DecisionIssue, DecisionValidation, PlayerDashboard } from '@/lib/types'

export interface StepProps {
  data: PlayerDashboard
  decisions: CompanyDecisions
  update: (mutate: (draft: CompanyDecisions) => void) => void
  validation: DecisionValidation | null
  issues: { errors: DecisionIssue[]; warnings: DecisionIssue[] }
}
