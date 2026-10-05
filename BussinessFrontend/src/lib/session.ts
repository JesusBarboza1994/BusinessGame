// Small wrappers around localStorage; every access is guarded because storage may be unavailable
const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string | null): void => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // storage unavailable (private mode); the session simply won't persist
  }
}

export const session = {
  facilitatorToken: () => read('bs.facilitatorToken'),
  setFacilitatorToken: (token: string | null) => write('bs.facilitatorToken', token),
  facilitatorName: () => read('bs.facilitatorName'),
  setFacilitatorName: (name: string | null) => write('bs.facilitatorName', name),
  playerToken: () => read('bs.playerToken'),
  setPlayerToken: (token: string | null) => write('bs.playerToken', token),
  tutorialSeen: () => read('bs.tutorialSeen') === '1',
  setTutorialSeen: () => write('bs.tutorialSeen', '1'),
  guidedMode: () => read('bs.guidedMode') !== '0',
  setGuidedMode: (on: boolean) => write('bs.guidedMode', on ? '1' : '0'),
  lastRevealedCycle: (companyId: string) => Number(read(`bs.revealed.${companyId}`) ?? 0),
  setLastRevealedCycle: (companyId: string, cycle: number) => write(`bs.revealed.${companyId}`, String(cycle)),
}
