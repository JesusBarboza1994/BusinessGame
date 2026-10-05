import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { CountdownRing } from '@/components/ui/CountdownRing'
import { useCountdown } from '@/hooks/useCountdown'
import { api } from '@/lib/api'
import type { PlayerDashboard } from '@/lib/types'

const TIPS = [
  'Si te quedas sin stock, tus clientes se van con la competencia… y algunos no vuelven.',
  'La materia prima que compras llega el próximo trimestre: planifica con un paso de ventaja.',
  'La publicidad se acumula, pero la mitad se olvida cada trimestre.',
  'Un préstamo de largo plazo es más barato que uno de emergencia.',
  'Ampliar la planta tarda un trimestre en dar frutos: anticípate a la demanda.',
  'La calidad importa mucho a los clientes premium y poco a los que buscan precio.',
]

export function WaitingScreen({ data }: { data: PlayerDashboard }) {
  const queryClient = useQueryClient()
  const seconds = useCountdown(data.game.cycleDeadline, data.serverTime)
  const [tip, setTip] = useState(0)
  const [editing, setEditing] = useState(false)
  const ready = data.game.submitted
  const total = data.game.activeCompanies

  useEffect(() => {
    const id = window.setInterval(() => setTip((value) => (value + 1) % TIPS.length), 6000)
    return () => window.clearInterval(id)
  }, [])

  const edit = async () => {
    if (!data.decision) return
    setEditing(true)
    try {
      await api.saveDraft(data.decision.decisions)
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } finally {
      setEditing(false)
    }
  }

  return (
    <div className="stage-bg flex min-h-[calc(100vh-110px)] flex-col items-center justify-center rounded-[2rem] px-4 py-10 text-center">
      <motion.div className="text-7xl" animate={{ y: [0, -14, 0], rotate: [0, -4, 4, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
        🚀
      </motion.div>
      <h2 className="mt-4 text-3xl font-black">¡Decisiones enviadas!</h2>
      <p className="mt-2 font-semibold text-white/80">Esperando al resto de empresas…</p>

      <div className="mt-8 flex items-center gap-6">
        <div>
          <p className="text-5xl font-black">
            {ready}
            <span className="text-white/50">/{total}</span>
          </p>
          <p className="text-sm font-bold text-white/70">empresas listas</p>
          {data.game.bots > 0 && <p className="text-xs font-bold text-white/60">+ {data.game.bots} bot{data.game.bots > 1 ? 's' : ''} 🤖 siempre listo{data.game.bots > 1 ? 's' : ''}</p>}
        </div>
        <CountdownRing seconds={seconds} total={data.game.cycleDurationMinutes * 60} size={84} light />
      </div>
      <div className="mt-6 h-3 w-full max-w-sm overflow-hidden rounded-full bg-white/20">
        <motion.div className="h-full rounded-full bg-yellow-300" animate={{ width: `${(ready / Math.max(1, total)) * 100}%` }} />
      </div>

      <motion.div key={tip} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass mt-10 max-w-md p-5">
        <p className="text-xs font-black uppercase tracking-widest text-yellow-200">Consejo</p>
        <p className="mt-1 font-semibold">{TIPS[tip]}</p>
      </motion.div>

      <Button variant="stage" className="mt-8" onClick={edit} loading={editing} icon={<Pencil className="size-4" />}>
        Cambiar mis decisiones
      </Button>
    </div>
  )
}
