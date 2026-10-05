import { useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect'
import { api, ApiError } from '@/lib/api'
import { STEP_THEME, type StepId } from '@/lib/constants'
import { money } from '@/lib/format'
import { session } from '@/lib/session'
import type { CompanyDecisions, DecisionIssue, DecisionValidation, PlayerDashboard } from '@/lib/types'

import { CoachBubble } from './CoachBubble'
import { ProjectionPanel } from './ProjectionPanel'
import { FinanceStep } from './steps/FinanceStep'
import { MarketStep } from './steps/MarketStep'
import { ProductionStep } from './steps/ProductionStep'
import { ResearchStep } from './steps/ResearchStep'
import { ReviewStep } from './steps/ReviewStep'
import type { StepProps } from './steps/step.types'
import { stepOfField } from './steps/step.utils'

const STEPS: StepId[] = ['production', 'market', 'research', 'finance', 'review']

const SOURCE_BANNER: Record<string, string> = {
  REPEAT: '🔁 Cargamos tus decisiones del trimestre anterior. Ajústalas a lo que pasó en el mercado.',
  DEFAULT: '✨ Te dejamos valores sugeridos para empezar. Muévelos y mira cómo cambia la proyección.',
  AUTO: '⏱️ No enviaste a tiempo, así que se usaron tus decisiones anteriores.',
  DRAFT: '📝 Recuperamos tu borrador. Se guarda solo mientras juegas.',
}

export function DecisionCockpit({ data }: { data: PlayerDashboard }) {
  const queryClient = useQueryClient()
  const [decisions, setDecisions] = useState<CompanyDecisions>(() => structuredClone(data.decision!.decisions))
  const [validation, setValidation] = useState<DecisionValidation | null>(data.validation)
  const [step, setStep] = useState<StepId>('production')
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [guided, setGuided] = useState(() => session.guidedMode() && data.game.currentCycle <= 2)
  const dirty = useRef(false)

  const update = useCallback((mutate: (draft: CompanyDecisions) => void) => {
    setDecisions((previous) => {
      const next = structuredClone(previous)
      mutate(next)
      return next
    })
    dirty.current = true
  }, [])

  // Autosave the draft and refresh the live validation a moment after the player stops moving sliders
  useDebouncedEffect(
    () => {
      if (!dirty.current) return
      setSaving('saving')
      api
        .saveDraft(decisions)
        .then((result) => {
          setValidation(result)
          setSaving('saved')
        })
        .catch(() => setSaving('error'))
    },
    [decisions],
    450,
  )

  const issuesByStep = useMemo(() => {
    const map: Record<StepId, { errors: DecisionIssue[]; warnings: DecisionIssue[] }> = {
      production: { errors: [], warnings: [] },
      market: { errors: [], warnings: [] },
      research: { errors: [], warnings: [] },
      finance: { errors: [], warnings: [] },
      review: { errors: [], warnings: [] },
    }
    for (const issue of validation?.errors ?? []) map[stepOfField(issue.field)].errors.push(issue)
    for (const issue of validation?.warnings ?? []) map[stepOfField(issue.field)].warnings.push(issue)
    return map
  }, [validation])

  const index = STEPS.indexOf(step)
  const go = (next: StepId) => {
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.submit(decisions)
      void confetti({ particleCount: 140, spread: 80, origin: { y: 0.75 }, colors: ['#7c3aed', '#fde047', '#ec4899', '#22c55e'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (error) {
      const apiError = error as ApiError
      setSubmitError(apiError.code === 'DECISION_INVALID' ? 'Hay decisiones que no se pueden ejecutar. Revisa los errores en rojo.' : apiError.message)
      if (apiError.code === 'DECISION_INVALID') setValidation(await api.validate(decisions))
    } finally {
      setSubmitting(false)
    }
  }

  const stepProps: StepProps = { data, decisions, update, validation, issues: issuesByStep[step] }
  const errorCount = validation?.errors.length ?? 0

  return (
    <div>
      {data.decision && SOURCE_BANNER[data.decision.source] && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-2xl bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-800 ring-1 ring-brand-100">
          {SOURCE_BANNER[data.decision.source]}
        </motion.div>
      )}

      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((id, i) => {
          const theme = STEP_THEME[id]
          const errors = id === 'review' ? errorCount : issuesByStep[id].errors.length
          const active = id === step
          return (
            <button
              key={id}
              onClick={() => go(id)}
              className={clsx(
                'relative flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-black transition sm:px-4',
                active ? 'text-white shadow-lg' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-800',
              )}
              style={active ? { backgroundColor: theme.color } : undefined}
            >
              <span className={clsx('flex size-6 items-center justify-center rounded-full text-xs', active ? 'bg-white/25' : 'bg-slate-100')}>{i + 1}</span>
              <span>{theme.emoji}</span>
              <span className="hidden sm:inline">{theme.label}</span>
              {errors > 0 && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white ring-2 ring-white">{errors}</span>}
            </button>
          )
        })}
        <div className="ml-auto hidden shrink-0 lg:block">
          <Toggle
            checked={guided}
            onChange={(value) => {
              setGuided(value)
              session.setGuidedMode(value)
            }}
            label="Modo guiado"
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="space-y-4">
              {guided && <CoachBubble step={step} data={data} validation={validation} />}
              {step === 'production' && <ProductionStep {...stepProps} />}
              {step === 'market' && <MarketStep {...stepProps} />}
              {step === 'research' && <ResearchStep {...stepProps} />}
              {step === 'finance' && <FinanceStep {...stepProps} />}
              {step === 'review' && <ReviewStep {...stepProps} onGo={go} onSubmit={submit} submitting={submitting} submitError={submitError} />}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 hidden items-center justify-between sm:flex">
            <Button variant="secondary" disabled={index === 0} onClick={() => go(STEPS[index - 1])} icon={<ArrowLeft className="size-4" />}>
              Anterior
            </Button>
            {step !== 'review' ? (
              <Button onClick={() => go(STEPS[index + 1])} className="flex-row-reverse">
                <ArrowRight className="size-4" /> Siguiente: {STEP_THEME[STEPS[index + 1]].label}
              </Button>
            ) : null}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ProjectionPanel validation={validation} saving={saving} onReview={() => go('review')} />
          </div>
        </aside>
      </div>

      <MobileBar
        cashEnd={validation?.projection.estimatedCashEnd ?? 0}
        errors={errorCount}
        isReview={step === 'review'}
        onPrev={index > 0 ? () => go(STEPS[index - 1]) : undefined}
        onNext={() => (step === 'review' ? void submit() : go(STEPS[index + 1]))}
        submitting={submitting}
      />
    </div>
  )
}

function MobileBar({ cashEnd, errors, isReview, onPrev, onNext, submitting }: { cashEnd: number; errors: number; isReview: boolean; onPrev?: () => void; onNext: () => void; submitting: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <Button variant="secondary" size="md" disabled={!onPrev} onClick={onPrev} icon={<ArrowLeft className="size-4" />} />
        <div className="flex-1 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Caja estimada al cierre</p>
          <p className={clsx('text-lg font-black', cashEnd < 0 ? 'text-rose-600' : 'text-emerald-600')}>{money(cashEnd)}</p>
        </div>
        {isReview ? (
          <Button variant="success" disabled={errors > 0} loading={submitting} onClick={onNext} icon={<Rocket className="size-4" />}>
            Enviar
          </Button>
        ) : (
          <Button onClick={onNext} icon={<ArrowRight className="size-4" />} />
        )}
      </div>
    </div>
  )
}
