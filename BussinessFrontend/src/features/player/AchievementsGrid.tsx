import clsx from 'clsx'

import type { PlayerDashboard } from '@/lib/types'

import { computeAchievements } from './achievements'

export function AchievementsGrid({ data, dark }: { data: PlayerDashboard; dark?: boolean }) {
  const achievements = computeAchievements(data)
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          title={achievement.description}
          className={clsx(
            'rounded-2xl p-3 text-center transition',
            achievement.unlocked ? (dark ? 'bg-white/15 ring-1 ring-yellow-300/60' : 'bg-amber-50 ring-1 ring-amber-200') : dark ? 'bg-white/5 opacity-40' : 'bg-slate-50 opacity-50 grayscale',
          )}
        >
          <div className="text-3xl">{achievement.emoji}</div>
          <p className="mt-1 text-xs font-black">{achievement.title}</p>
          <p className={clsx('text-[11px] font-semibold leading-tight', dark ? 'text-white/60' : 'text-slate-500')}>{achievement.description}</p>
        </div>
      ))}
    </div>
  )
}
