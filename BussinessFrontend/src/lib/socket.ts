import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'

import { API_URL } from './env'

const URL = API_URL

let socket: Socket | null = null

function getSocket(): Socket {
  if (!socket) socket = io(`${URL}/live`, { transports: ['websocket', 'polling'] })
  return socket
}

export type LiveEventName = 'lobby.updated' | 'game.started' | 'decision.submitted' | 'cycle.processing' | 'cycle.closed' | 'game.finished'

// Subscribes to a game's room and forwards every live event to the latest handler
export function useLiveGame(gameId: string | undefined, onEvent: (event: LiveEventName, payload: unknown) => void): void {
  const handler = useRef(onEvent)
  useEffect(() => {
    handler.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!gameId) return
    const s = getSocket()
    const room = `game:${gameId}`
    const subscribe = () => s.emit('subscribe', { room })
    subscribe()
    s.on('connect', subscribe)
    const events: LiveEventName[] = ['lobby.updated', 'game.started', 'decision.submitted', 'cycle.processing', 'cycle.closed', 'game.finished']
    const listeners = events.map((event) => {
      const listener = (payload: unknown) => handler.current(event, payload)
      s.on(event, listener)
      return [event, listener] as const
    })
    return () => {
      s.off('connect', subscribe)
      for (const [event, listener] of listeners) s.off(event, listener)
      s.emit('unsubscribe', { room })
    }
  }, [gameId])
}
