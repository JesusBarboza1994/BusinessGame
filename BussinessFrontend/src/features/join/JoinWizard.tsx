import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Shuffle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { PinInput } from '@/components/ui/PinInput'
import { api, ApiError } from '@/lib/api'
import { AVATARS, COLORS } from '@/lib/constants'
import { HELP } from '@/lib/glossary'
import { session } from '@/lib/session'
import type { ValuationMethod } from '@/lib/types'

const NAME_IDEAS = ['Innova', 'Nova Corp', 'Andes Trade', 'Pacífico S.A.', 'Cóndor', 'Inka Labs', 'Galaxia', 'Volcán', 'Delta Group', 'Quantum']

type Step = 'pin' | 'identity' | 'valuation'

const ERROR_MESSAGES: Record<string, string> = {
  GAME_NOT_FOUND: 'No encontramos una partida con ese PIN. Revísalo con tu facilitador.',
  GAME_NOT_IN_LOBBY: 'Esta partida ya comenzó; ya no se pueden unir empresas nuevas.',
  COMPANY_NAME_TAKEN: 'Otra empresa ya usa ese nombre. ¡Sé original!',
  GAME_FULL: 'La partida está llena.',
}

export function JoinWizard() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [pin, setPin] = useState(params.get('pin') ?? '')
  const [step, setStep] = useState<Step>(pin.length === 6 ? 'identity' : 'pin')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)])
  const [color, setColor] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)])
  const [valuation, setValuation] = useState<ValuationMethod>('WEIGHTED_AVERAGE')
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const lobby = useQuery({
    queryKey: ['lobby', pin],
    queryFn: () => api.lobby(pin),
    enabled: pin.length === 6,
    retry: false,
  })

  const lobbyError = lobby.error instanceof ApiError ? (ERROR_MESSAGES[lobby.error.code] ?? lobby.error.message) : null
  const closed = lobby.data && lobby.data.status !== 'LOBBY'

  const join = async () => {
    setJoining(true)
    setError(null)
    try {
      const result = await api.join({ pin, companyName: name.trim(), avatar, color, valuationMethod: valuation })
      session.setPlayerToken(result.playerToken)
      navigate('/play')
    } catch (err) {
      const apiError = err as ApiError
      setError(ERROR_MESSAGES[apiError.code] ?? apiError.message)
      if (apiError.code === 'COMPANY_NAME_TAKEN') setStep('identity')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="stage">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} aria-label="Inicio">
            <Logo light />
          </button>
          <StepDots step={step} />
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          <AnimatePresence mode="wait">
            {step === 'pin' && (
              <Panel key="pin">
                <h1 className="text-3xl font-black">¿Cuál es el PIN?</h1>
                <p className="mt-2 font-semibold text-white/75">Tu facilitador lo está mostrando en pantalla.</p>
                <div className="mt-8">
                  <PinInput value={pin} onChange={setPin} autoFocus />
                </div>
                {lobby.data && !closed && <GameFound name={lobby.data.name} companies={lobby.data.companies.length} />}
                {(lobbyError || closed) && <ErrorBox text={closed ? ERROR_MESSAGES.GAME_NOT_IN_LOBBY : (lobbyError as string)} />}
                <Button variant="stage" size="lg" className="mt-8 w-full" disabled={!lobby.data || Boolean(closed)} onClick={() => setStep('identity')} icon={<ArrowRight className="size-5" />}>
                  Continuar
                </Button>
              </Panel>
            )}

            {step === 'identity' && (
              <Panel key="identity">
                {lobby.data && <p className="text-sm font-black uppercase tracking-widest text-yellow-200">{lobby.data.name}</p>}
                <h1 className="mt-1 text-3xl font-black">Crea tu empresa</h1>
                <motion.div layout className="mt-6 flex items-center gap-4 rounded-3xl bg-white p-4 text-slate-800 shadow-xl">
                  <motion.div
                    key={avatar + color}
                    initial={{ scale: 0.6, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-4xl"
                    style={{ backgroundColor: `${color}22`, boxShadow: `inset 0 0 0 3px ${color}` }}
                  >
                    {avatar}
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <input
                      autoFocus
                      value={name}
                      maxLength={30}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Nombre de tu empresa"
                      className="w-full bg-transparent text-2xl font-black outline-none placeholder:text-slate-300"
                    />
                    <button
                      onClick={() => setName(NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)])}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                    >
                      <Shuffle className="size-3" /> Sugerir un nombre
                    </button>
                  </div>
                </motion.div>

                <p className="mt-6 text-sm font-black uppercase tracking-widest text-white/70">Elige tu logo</p>
                <div className="mt-2 grid grid-cols-10 gap-1.5">
                  {AVATARS.map((item) => (
                    <button
                      key={item}
                      onClick={() => setAvatar(item)}
                      className={clsx('aspect-square rounded-xl text-xl transition sm:text-2xl', item === avatar ? 'scale-110 bg-white shadow-lg' : 'bg-white/10 hover:bg-white/25')}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-sm font-black uppercase tracking-widest text-white/70">Tu color</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLORS.map((item) => (
                    <button
                      key={item}
                      onClick={() => setColor(item)}
                      aria-label={`Color ${item}`}
                      className={clsx('size-9 rounded-full ring-4 transition', item === color ? 'scale-110 ring-white' : 'ring-transparent hover:ring-white/40')}
                      style={{ backgroundColor: item }}
                    />
                  ))}
                </div>
                {(lobbyError || closed) && <ErrorBox text={closed ? ERROR_MESSAGES.GAME_NOT_IN_LOBBY : (lobbyError as string)} />}
                {error && <ErrorBox text={error} />}
                <div className="mt-8 flex gap-3">
                  <Button variant="secondary" size="lg" onClick={() => setStep('pin')} icon={<ArrowLeft className="size-5" />} />
                  <Button variant="stage" size="lg" className="flex-1" disabled={name.trim().length < 2 || Boolean(lobbyError || closed)} onClick={() => setStep('valuation')} icon={<ArrowRight className="size-5" />}>
                    Siguiente
                  </Button>
                </div>
              </Panel>
            )}

            {step === 'valuation' && (
              <Panel key="valuation">
                <h1 className="text-3xl font-black">Una decisión contable</h1>
                <p className="mt-2 font-semibold text-white/75">{HELP.valuation}</p>
                <div className="mt-6 space-y-3">
                  <ValuationCard
                    selected={valuation === 'WEIGHTED_AVERAGE'}
                    onClick={() => setValuation('WEIGHTED_AVERAGE')}
                    title="Promedio ponderado"
                    badge="Recomendado"
                    emoji="⚖️"
                    text="Todas las unidades en bodega cuestan lo mismo: el promedio. Más simple de seguir."
                  />
                  <ValuationCard
                    selected={valuation === 'FIFO'}
                    onClick={() => setValuation('FIFO')}
                    title="PEPS (FIFO)"
                    emoji="📚"
                    text="Primero en entrar, primero en salir: vendes primero lo que fabricaste antes. Si tus costos cambian, tu margen lo refleja con retraso."
                  />
                </div>
                {error && <ErrorBox text={error} />}
                <div className="mt-8 flex gap-3">
                  <Button variant="secondary" size="lg" onClick={() => setStep('identity')} icon={<ArrowLeft className="size-5" />} />
                  <Button variant="stage" size="lg" className="flex-1" loading={joining} onClick={join} icon={<Check className="size-5" />}>
                    ¡Entrar a la partida!
                  </Button>
                </div>
              </Panel>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  )
}

function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ['pin', 'identity', 'valuation']
  const current = steps.indexOf(step)
  return (
    <div className="flex gap-1.5">
      {steps.map((item, index) => (
        <span key={item} className={clsx('h-2 rounded-full transition-all', index <= current ? 'w-8 bg-yellow-300' : 'w-2 bg-white/30')} />
      ))}
    </div>
  )
}

function GameFound({ name, companies }: { name: string; companies: number }) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-6 rounded-2xl bg-emerald-400/20 p-4 ring-2 ring-emerald-300/60">
      <p className="font-black">✅ {name}</p>
      <p className="text-sm font-semibold text-white/80">{companies === 0 ? '¡Serás la primera empresa!' : `${companies} empresa${companies === 1 ? '' : 's'} esperando`}</p>
    </motion.div>
  )
}

function ErrorBox({ text }: { text: string }) {
  return (
    <motion.div initial={{ x: -8 }} animate={{ x: [0, -6, 6, -4, 4, 0] }} className="mt-5 rounded-2xl bg-rose-500/25 p-3 text-sm font-bold ring-2 ring-rose-300/60">
      {text}
    </motion.div>
  )
}

function ValuationCard({ selected, onClick, title, text, emoji, badge }: { selected: boolean; onClick: () => void; title: string; text: string; emoji: string; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex w-full items-start gap-4 rounded-3xl p-4 text-left transition',
        selected ? 'bg-white text-slate-800 shadow-xl ring-4 ring-yellow-300' : 'bg-white/10 ring-1 ring-white/20 hover:bg-white/20',
      )}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="flex-1">
        <span className="flex items-center gap-2 text-lg font-black">
          {title}
          {badge && <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-xs font-black text-yellow-900">{badge}</span>}
        </span>
        <span className={clsx('mt-1 block text-sm font-semibold', selected ? 'text-slate-500' : 'text-white/75')}>{text}</span>
      </span>
    </button>
  )
}
