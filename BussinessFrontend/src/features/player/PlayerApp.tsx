import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'

import { FullScreenLoader } from '@/components/ui/Spinner'
import { api, ApiError } from '@/lib/api'
import { session } from '@/lib/session'
import { useLiveGame } from '@/lib/socket'
import type { PlayerDashboard } from '@/lib/types'

import { BankruptScreen } from './BankruptScreen'
import { DecisionCockpit } from './DecisionCockpit'
import { FinalScreen } from './FinalScreen'
import { LobbyScreen } from './LobbyScreen'
import { PlayerHeader, type PlayerTab } from './PlayerHeader'
import { ProcessingScreen } from './ProcessingScreen'
import { RankingPanel } from './RankingPanel'
import { ReportsView } from './ReportsView'
import { ResultsReveal } from './ResultsReveal'
import { TutorialModal } from './TutorialModal'
import { WaitingScreen } from './WaitingScreen'

export function PlayerApp() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = session.playerToken()
  const [tab, setTab] = useState<PlayerTab>('decide')
  const [tutorialOpen, setTutorialOpen] = useState<boolean | null>(null)
  const [revealed, setRevealed] = useState<number | null>(null)

  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
    enabled: Boolean(token),
    refetchInterval: (q) => (q.state.data?.game.cycleStatus === 'PROCESSING' ? 2_000 : 20_000),
  })

  useLiveGame(query.data?.game.id, () => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  })

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      session.setPlayerToken(null)
      navigate('/')
    }
  }, [query.error, navigate])

  if (!token) return <Navigate to="/" replace />
  if (!query.data) return <FullScreenLoader stage label={query.error ? 'Reconectando…' : 'Cargando tu empresa…'} />

  const data = query.data
  // Auto-open the tutorial once the game starts for players that never saw it
  const showTutorial = tutorialOpen ?? (data.game.status !== 'LOBBY' && !session.tutorialSeen())
  const lastCycle = data.lastReport?.cycle ?? 0
  const alreadyRevealed = revealed ?? session.lastRevealedCycle(data.company.id)
  const showReveal = lastCycle > 0 && lastCycle > alreadyRevealed

  const closeReveal = (goTo?: PlayerTab) => {
    session.setLastRevealedCycle(data.company.id, lastCycle)
    setRevealed(lastCycle)
    if (goTo) setTab(goTo)
  }
  const closeTutorial = () => {
    session.setTutorialSeen()
    setTutorialOpen(false)
  }

  if (data.game.status === 'LOBBY') {
    return (
      <>
        <LobbyScreen data={data} onTutorial={() => setTutorialOpen(true)} />
        <TutorialModal open={showTutorial} onClose={closeTutorial} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PlayerHeader data={data} tab={tab} onTab={setTab} onHelp={() => setTutorialOpen(true)} />
      <main className="mx-auto max-w-7xl px-3 pb-28 pt-4 sm:px-6">
        {tab === 'decide' && <DecideTab data={data} onReports={() => setTab('reports')} />}
        {tab === 'reports' && <ReportsView data={data} />}
        {tab === 'ranking' && <RankingPanel data={data} />}
      </main>
      <ResultsReveal open={showReveal && data.game.cycleStatus !== 'PROCESSING'} data={data} onClose={closeReveal} />
      <TutorialModal open={showTutorial && !showReveal} onClose={closeTutorial} />
    </div>
  )
}

function DecideTab({ data, onReports }: { data: PlayerDashboard; onReports: () => void }) {
  if (data.game.status === 'FINISHED') return <FinalScreen data={data} onReports={onReports} />
  if (data.company.status === 'BANKRUPT') return <BankruptScreen data={data} onReports={onReports} />
  if (data.game.cycleStatus === 'PROCESSING') return <ProcessingScreen data={data} />
  if (data.decision?.submitted) return <WaitingScreen data={data} />
  if (!data.decision) return <ProcessingScreen data={data} />
  return <DecisionCockpit key={`${data.game.id}-${data.decision.cycle}`} data={data} />
}
