import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { compactMoney } from '@/lib/format'

export interface Series {
  key: string
  label: string
  color: string
}

interface ChartProps {
  data: Record<string, number | string | null>[]
  series: Series[]
  xKey?: string
  height?: number
  format?: (value: number) => string
  dark?: boolean
  yDomain?: [number, number]
  yReversed?: boolean
}

const axisStyle = (dark?: boolean) => ({ fontSize: 11, fontWeight: 700, fill: dark ? 'rgba(255,255,255,0.6)' : '#94a3b8' })

function TooltipBox({ active, payload, label, format }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string | number; format: (value: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xl">
      <p className="mb-1 text-slate-400">Trimestre {label}</p>
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}: {format(item.value)}
        </p>
      ))}
    </div>
  )
}

export function LineHistory({ data, series, xKey = 'cycle', height = 220, format = compactMoney, dark, yDomain, yReversed }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255,255,255,0.1)' : '#f1f5f9'} />
        <XAxis dataKey={xKey} tick={axisStyle(dark)} axisLine={false} tickLine={false} />
        <YAxis
          tick={axisStyle(dark)}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => format(value)}
          width={64}
          domain={yDomain}
          reversed={yReversed}
          allowDecimals={!yDomain}
          tickCount={yDomain ? Math.min(6, yDomain[1] - yDomain[0] + 1) : undefined}
        />
        <Tooltip content={<TooltipBox format={format} />} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />}
        {series.map((item) => (
          <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function AreaHistory({ data, series, xKey = 'cycle', height = 220, format = compactMoney, dark }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          {series.map((item) => (
            <linearGradient key={item.key} id={`grad-${item.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={item.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255,255,255,0.1)' : '#f1f5f9'} />
        <XAxis dataKey={xKey} tick={axisStyle(dark)} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle(dark)} axisLine={false} tickLine={false} tickFormatter={(value: number) => format(value)} width={64} />
        <Tooltip content={<TooltipBox format={format} />} />
        {series.map((item) => (
          <Area key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={3} fill={`url(#grad-${item.key})`} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BarsHistory({ data, series, xKey = 'cycle', height = 220, format = compactMoney, dark }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255,255,255,0.1)' : '#f1f5f9'} vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle(dark)} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle(dark)} axisLine={false} tickLine={false} tickFormatter={(value: number) => format(value)} width={64} />
        <Tooltip content={<TooltipBox format={format} />} cursor={{ fill: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />}
        {series.map((item) => (
          <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
