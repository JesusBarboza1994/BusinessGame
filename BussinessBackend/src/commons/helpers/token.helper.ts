import { createHash, randomBytes, randomInt } from 'node:crypto'

import { GAME_PIN_LENGTH } from '@/commons/constants/game.constant'

export const generatePlayerToken = (): string => randomBytes(32).toString('hex')

export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

export const generatePin = (): string =>
  Array.from({ length: GAME_PIN_LENGTH }, (_, index) => (index === 0 ? randomInt(1, 10) : randomInt(0, 10))).join('')

export const generateSeed = (): number => randomInt(1, 2 ** 31 - 1)
