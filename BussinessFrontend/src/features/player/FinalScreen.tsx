import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { BarChart3, Home } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { money, pct } from '@/lib/format'
import { session } from '@/lib/session'
import type { PlayerDashboard } from '@/lib/types'

import { Podium } from '../shared/Podium'
import { AchievementsGrid } from './AchievementsGrid'

export function FinalScreen({ data, onReports }: { data: PlayerDashboard; onReports: () => void }) {
  const navigate = useNavigate()
  const mine = data.ranking.find((entry) => entry.companyId === data.company.id)
  const totalIncome = data.history.reduce((acc, h) => acc + h.netIncome, 0)

  useEffect(() => {
    if (mine?.position !== 1) return
    const end = Date.now() + 2500
    const frame = () => {
      void confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 } })
      void confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 } })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [mine?.position])

  return (
    <div className="stage-bg rounded-[2rem] px-4 py-10">
      <div className="mx-auto max-w-3xl text-center">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-black uppercase tracking-[0.3em] text-yellow-200">
          Fin de la partida
        </motion.p>
        <motion.h2 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-2 text-4xl font-black">
          {mine?.position === 1 ? '¡Ganaste! 🏆' : `Terminaste en el puesto #${mine?.position ?? '—'}`}
        </motion.h2>
        <div className="mt-10">
          <Podium ranking={data.ranking} />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FinalStat label="Retorno accionista" value={pct(mine?.tsr)} />
          <FinalStat label="Precio final acción" value={`$${(mine?.sharePrice ?? 0).toFixed(2)}`} />
          <FinalStat label="Utilidad acumulada" value={money(totalIncome)} />
          <FinalStat label="Participación final" value={pct(mine?.marketShare)} />
        </div>

        <div className="mt-8 text-left">
          <p className="mb-3 text-sm font-black uppercase tracking-widest text-white/70">Tus logros</p>
          <AchievementsGrid data={data} dark />
        </div>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="stage" size="lg" onClick={onReports} icon={<BarChart3 className="size-5" />}>
            Revisar mis informes
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              session.setPlayerToken(null)
              navigate('/')
            }}
            icon={<Home className="size-5" />}
          >
            Salir
          </Button>
        </div>
      </div>
    </div>
  )
}

function FinalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/20">
      <p className="text-[11px] font-black uppercase tracking-wider text-white/60">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  )
}
