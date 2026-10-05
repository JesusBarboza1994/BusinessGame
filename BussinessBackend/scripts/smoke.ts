// End-to-end smoke test against a running API: facilitator creates a game, two players play two cycles
const API = process.env.API_URL ?? 'http://localhost:4000/v1'

async function call<T>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await res.json()) as { success: boolean; data: T; code: string; message: string; details?: unknown }
  if (!json.success) throw new Error(`${method} ${path} -> ${res.status} ${json.code}: ${json.message} ${JSON.stringify(json.details ?? '')}`)
  return json.data
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function main(): Promise<void> {
  const email = `fac${Date.now()}@test.dev`
  const { token } = await call<{ token: string }>('POST', '/auth/register', { name: 'Profe', email, password: 'secret123' })
  const auth = { authorization: `Bearer ${token}` }
  const game = await call<{ id: string; pin: string }>('POST', '/games', { name: 'Smoke', cycles: 2, cycleDurationMinutes: 1 }, auth)
  console.log('game', game.id, 'pin', game.pin)

  const lobby = await call<{ name: string }>('GET', `/play/lobby/${game.pin}`)
  console.log('lobby', lobby.name)
  const p1 = await call<{ playerToken: string }>('POST', '/play/join', { pin: game.pin, companyName: 'Alfa', avatar: '🚀', color: '#6366f1', valuationMethod: 'FIFO' })
  const p2 = await call<{ playerToken: string }>('POST', '/play/join', { pin: game.pin, companyName: 'Beta', avatar: '🦊', color: '#f97316' })
  const h1 = { 'x-player-token': p1.playerToken }
  const h2 = { 'x-player-token': p2.playerToken }

  await call('POST', `/games/${game.id}/start`, undefined, auth)
  const me = await call<any>('GET', '/play/me', undefined, h1)
  console.log('cycle', me.game.currentCycle, 'source', me.decision.source, 'valid', me.validation.valid, 'cash proj', me.validation.projection.estimatedCashEnd)

  const bad = structuredClone(me.decision.decisions)
  bad.production.units.A = 5000
  const badValidation = await call<any>('POST', '/play/decisions/validate', { decisions: bad }, h1)
  console.log('bad valid?', badValidation.valid, badValidation.errors.map((e: any) => e.code))

  await call('PUT', '/play/decisions/draft', { decisions: me.decision.decisions }, h1)
  await call('POST', '/play/decisions/submit', { decisions: me.decision.decisions }, h1)
  const me2 = await call<any>('GET', '/play/me', undefined, h2)
  const d2 = me2.decision.decisions
  d2.marketing.price = { A: 27, B: 45 }
  d2.marketing.buyMarketResearch = true
  d2.finance.longTermLoan = 20000
  await call('POST', '/play/decisions/submit', { decisions: d2 }, h2)

  for (let i = 0; i < 20; i++) {
    const state = await call<any>('GET', '/play/me', undefined, h1)
    if (state.game.currentCycle === 2) break
    await sleep(300)
  }
  const after = await call<any>('GET', '/play/me', undefined, h2)
  console.log('now cycle', after.game.currentCycle, 'source', after.decision.source, 'rank', after.ranking.map((r: any) => `${r.position}.${r.name} ${r.sharePrice}`).join(' | '))
  const report = await call<any>('GET', '/play/reports/1', undefined, h2)
  console.log('report balanced', report.report.balanceSheet.balanced, 'NI', report.report.incomeStatement.netIncome, 'research competitors', report.marketResearch?.competitors.length)

  // Only player 1 submits; facilitator forces the close and player 2 repeats last decisions
  await call('POST', '/play/decisions/submit', { decisions: me.decision.decisions }, h1)
  await call('POST', `/games/${game.id}/close-cycle`, undefined, auth)
  for (let i = 0; i < 20; i++) {
    const detail = await call<any>('GET', `/games/${game.id}`, undefined, auth)
    if (detail.status === 'FINISHED') {
      console.log('finished; ranking', detail.ranking.map((r: any) => `${r.position}.${r.name} tsr=${r.tsr}`).join(' | '))
      const cycle2 = await call<any>('GET', `/games/${game.id}/cycles/2`, undefined, auth)
      console.log('cycle2 auto decisions', cycle2.companies.map((c: any) => `${c.name}:${c.autoDecisions}`).join(' '))
      return
    }
    await sleep(300)
  }
  throw new Error('game did not finish')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
