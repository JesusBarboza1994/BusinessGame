import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ChevronDown, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { NumberSlider } from '@/components/ui/NumberSlider'
import { Segmented } from '@/components/ui/Segmented'
import { api, ApiError } from '@/lib/api'
import type { GameDetail, GamePreset, RankingMetric } from '@/lib/types'

interface Advanced {
  rankingMetric: RankingMetric
  initialCash: number
  marketGrowth: number
  randomness: number
  longTermAnnualRate: number
  shortTermRate: number
  taxRate: number
}

interface DefaultSettings {
  rankingMetric: RankingMetric
  initial: { cash: number }
  market: { growth: number; noiseSigma: number }
  finance: { longTermAnnualRate: number; shortTermRate: number; taxRate: number }
}

// Advanced controls start from the server defaults so the UI never drifts from the engine
const toAdvanced = (settings: DefaultSettings): Advanced => ({
  rankingMetric: settings.rankingMetric,
  initialCash: settings.initial.cash,
  marketGrowth: Math.round(settings.market.growth * 100),
  randomness: Math.round(settings.market.noiseSigma * 100),
  longTermAnnualRate: Math.round(settings.finance.longTermAnnualRate * 100),
  shortTermRate: Math.round(settings.finance.shortTermRate * 100),
  taxRate: Math.round(settings.finance.taxRate * 100),
})

export function CreateGameModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (game: GameDetail) => void }) {
  const defaults = useQuery({ queryKey: ['defaults'], queryFn: api.defaults, enabled: open })
  return (
    <Modal open={open} onClose={onClose} wide>
      {defaults.data ? (
        <CreateGameForm presets={defaults.data.presets} initial={toAdvanced(defaults.data.settings as unknown as DefaultSettings)} onClose={onClose} onCreated={onCreated} />
      ) : (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-brand-500" />
        </div>
      )}
    </Modal>
  )
}

function CreateGameForm({ presets, initial, onClose, onCreated }: { presets: GamePreset[]; initial: Advanced; onClose: () => void; onCreated: (game: GameDetail) => void }) {
  const [name, setName] = useState('')
  const [preset, setPreset] = useState('standard')
  const [cycles, setCycles] = useState(8)
  const [duration, setDuration] = useState(10)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advanced, setAdvanced] = useState<Advanced>(initial)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const choosePreset = (id: string) => {
    const found = presets.find((p) => p.id === id)
    setPreset(id)
    if (found) {
      setCycles(found.cycles)
      setDuration(found.cycleDurationMinutes)
    }
  }

  const create = async () => {
    setCreating(true)
    setError(null)
    try {
      const game = await api.createGame({
        name: name.trim() || 'Mi partida',
        cycles,
        cycleDurationMinutes: duration,
        settings: {
          rankingMetric: advanced.rankingMetric,
          initial: { cash: advanced.initialCash },
          market: { growth: advanced.marketGrowth / 100, noiseSigma: advanced.randomness / 100 },
          finance: { longTermAnnualRate: advanced.longTermAnnualRate / 100, shortTermRate: advanced.shortTermRate / 100, taxRate: advanced.taxRate / 100 },
        },
      })
      onCreated(game)
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setCreating(false)
    }
  }

  const set = <K extends keyof Advanced>(key: K, value: Advanced[K]) => setAdvanced((prev) => ({ ...prev, [key]: value }))

  return (
    <>
      <h2 className="text-2xl font-black">Nueva partida</h2>
      <p className="text-sm font-semibold text-slate-500">Elige un formato. Podrás compartir el PIN apenas la crees.</p>

      <label className="mt-5 block">
        <span className="text-sm font-extrabold text-slate-600">Nombre de la partida</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Finanzas Corporativas · Sección A"
          className="mt-1 w-full rounded-2xl bg-slate-50 px-4 py-3 font-bold outline-none ring-2 ring-slate-200 focus:ring-brand-400"
        />
      </label>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {presets.map((item) => (
          <button
            key={item.id}
            onClick={() => choosePreset(item.id)}
            className={clsx('rounded-3xl p-4 text-left transition', preset === item.id ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-50 ring-1 ring-slate-200 hover:ring-brand-300')}
          >
            <p className="text-lg font-black">{item.name}</p>
            <p className={clsx('text-sm font-semibold', preset === item.id ? 'text-white/80' : 'text-slate-500')}>{item.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <NumberSlider label="Trimestres" value={cycles} min={1} max={16} onChange={(v) => { setCycles(v); setPreset('custom') }} />
        <NumberSlider label="Minutos por trimestre" value={duration} min={1} max={60} onChange={(v) => { setDuration(v); setPreset('custom') }} suffix="min" />
      </div>

      <button onClick={() => setShowAdvanced((v) => !v)} className="mt-5 flex items-center gap-1 text-sm font-black text-brand-600">
        <ChevronDown className={clsx('size-4 transition', showAdvanced && 'rotate-180')} /> Reglas avanzadas
      </button>
      {showAdvanced && (
        <div className="mt-3 space-y-5 rounded-3xl bg-slate-50 p-5">
          <div>
            <p className="mb-2 text-sm font-extrabold text-slate-600">¿Quién gana?</p>
            <Segmented<RankingMetric>
              value={advanced.rankingMetric}
              onChange={(value) => set('rankingMetric', value)}
              options={[
                { value: 'TSR', label: 'Retorno accionista' },
                { value: 'ROI', label: 'ROI' },
                { value: 'ROE', label: 'ROE' },
              ]}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberSlider label="Caja inicial" prefix="$" value={advanced.initialCash} min={10_000} max={500_000} step={10_000} onChange={(v) => set('initialCash', v)} />
            <NumberSlider label="Crecimiento del mercado por trimestre" suffix="%" value={advanced.marketGrowth} min={0} max={15} onChange={(v) => set('marketGrowth', v)} />
            <NumberSlider label="Aleatoriedad del mercado" suffix="%" value={advanced.randomness} min={0} max={30} onChange={(v) => set('randomness', v)} />
            <NumberSlider label="Tasa préstamo largo plazo (anual)" suffix="%" value={advanced.longTermAnnualRate} min={0} max={60} onChange={(v) => set('longTermAnnualRate', v)} />
            <NumberSlider label="Tasa corto plazo (trimestral)" suffix="%" value={advanced.shortTermRate} min={0} max={20} onChange={(v) => set('shortTermRate', v)} />
            <NumberSlider label="Impuesto a la renta" suffix="%" value={advanced.taxRate} min={0} max={50} onChange={(v) => set('taxRate', v)} />
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={create} loading={creating} icon={<Sparkles className="size-5" />}>
          Crear partida
        </Button>
      </div>
    </>
  )
}
