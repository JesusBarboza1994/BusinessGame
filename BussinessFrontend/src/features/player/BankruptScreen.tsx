import { BarChart3 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { PlayerDashboard } from '@/lib/types'

export function BankruptScreen({ data, onReports }: { data: PlayerDashboard; onReports: () => void }) {
  return (
    <Card className="mx-auto mt-8 max-w-xl p-8 text-center">
      <div className="text-7xl">💸</div>
      <h2 className="mt-4 text-3xl font-black text-slate-800">Tu empresa quebró</h2>
      <p className="mt-3 font-semibold text-slate-600">
        En el trimestre {data.company.bankruptCycle} {data.snapshot.equity < 0 ? 'tu patrimonio quedó negativo' : 'necesitaste préstamos de emergencia tres veces seguidas'}. Tu empresa sale del
        mercado y tus clientes pasan a la competencia.
      </p>
      <p className="mt-3 text-sm font-bold text-slate-500">Revisa tus informes para entender qué pasó: es la mejor forma de aprender.</p>
      <Button className="mt-6" onClick={onReports} icon={<BarChart3 className="size-5" />}>
        Ver mis informes
      </Button>
    </Card>
  )
}
