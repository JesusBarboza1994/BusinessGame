import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { FullScreenLoader } from '@/components/ui/Spinner'
import { JoinWizard } from '@/features/join/JoinWizard'
import { LandingPage } from '@/features/join/LandingPage'

// Player and facilitator areas are split so the landing/join flow loads fast on phones
const PlayerApp = lazy(() => import('@/features/player/PlayerApp').then((m) => ({ default: m.PlayerApp })))
const FacilitatorAuthPage = lazy(() => import('@/features/facilitator/FacilitatorAuthPage').then((m) => ({ default: m.FacilitatorAuthPage })))
const FacilitatorHome = lazy(() => import('@/features/facilitator/FacilitatorHome').then((m) => ({ default: m.FacilitatorHome })))
const GameControlPage = lazy(() => import('@/features/facilitator/GameControlPage').then((m) => ({ default: m.GameControlPage })))

const withSuspense = (element: ReactNode) => <Suspense fallback={<FullScreenLoader />}>{element}</Suspense>

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/join', element: <JoinWizard /> },
  { path: '/play', element: withSuspense(<PlayerApp />) },
  { path: '/facilitator/login', element: withSuspense(<FacilitatorAuthPage />) },
  { path: '/facilitator', element: withSuspense(<FacilitatorHome />) },
  { path: '/facilitator/games/:gameId', element: withSuspense(<GameControlPage />) },
  { path: '*', element: <LandingPage /> },
])

export function App() {
  return <RouterProvider router={router} />
}
