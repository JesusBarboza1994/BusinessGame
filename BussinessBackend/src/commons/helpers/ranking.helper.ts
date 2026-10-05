import { CompanyDbDto } from '@/db/company/company-db.dto'

import { RankingEntry } from '@/modules/simulation/engine/engine.types'

export interface NamedRankingEntry extends RankingEntry {
  name: string
  avatar: string
  color: string
  isBot: boolean
}

export function withCompanyNames(ranking: RankingEntry[], companies: CompanyDbDto[]): NamedRankingEntry[] {
  const byId = new Map(companies.map((company) => [company.id, company]))
  return ranking
    .filter((entry) => byId.has(entry.companyId))
    .map((entry) => {
      const company = byId.get(entry.companyId) as CompanyDbDto
      return { ...entry, name: company.name, avatar: company.avatar, color: company.color, isBot: company.isBot }
    })
}
