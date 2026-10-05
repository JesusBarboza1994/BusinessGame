import clsx from 'clsx'

export function BotBadge({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span
      title="Empresa controlada por un bot"
      className={clsx('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 align-middle text-[10px] font-black uppercase', dark ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600', className)}
    >
      🤖 Bot
    </span>
  )
}
