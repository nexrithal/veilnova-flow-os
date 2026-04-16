'use client'

import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { AppShell } from '@/components/app/app-shell'
import { TaskItem, ItemType } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const TYPE_COLORS: Record<ItemType, string> = {
  infra: 'oklch(0.70 0.14 250)',
  bot: 'oklch(0.75 0.14 300)',
  mail: 'oklch(0.72 0.14 80)',
  '3d': 'oklch(0.70 0.18 30)',
  automation: 'oklch(0.82 0.15 192)',
  fun: 'oklch(0.75 0.16 162)',
  other: 'oklch(0.45 0 0)',
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-card border border-border rounded-md px-4 py-4">
      <div className={cn('text-3xl font-bold tabular-nums', color ?? 'text-foreground')}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function buildCompletionData(items: TaskItem[], locale: string) {
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (6 - i))
    return d
  })

  return days.map((d) => {
    const label = d.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' })
    const count = items.filter((item) => {
      if (item.status !== 'done' && item.status !== 'archived') return false
      const updated = new Date(item.updatedAt)
      return (
        updated.getFullYear() === d.getFullYear() &&
        updated.getMonth() === d.getMonth() &&
        updated.getDate() === d.getDate()
      )
    }).length
    return { label, count }
  })
}

export default function AnalyticsPage() {
  const items = useStore((s) => s.items)
  const locale = useStore((s) => s.locale)
  const t = useI18n()

  const total = items.length
  const done = items.filter((i) => i.status === 'done' || i.status === 'archived').length
  const active = items.filter((i) => i.status === 'active').length
  const backlog = items.filter((i) => i.status === 'backlog').length
  const ideas = items.filter((i) => i.status === 'idea').length
  const frozen = items.filter((i) => i.status === 'frozen').length

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  const avgScore =
    items.length > 0
      ? (items.reduce((sum, i) => sum + i.score, 0) / items.length).toFixed(1)
      : '—'

  const typeData = (
    ['infra', 'bot', 'mail', '3d', 'automation', 'fun', 'other'] as ItemType[]
  )
    .map((type) => ({
      name: t.type[type],
      value: items.filter((i) => i.type === type).length,
      color: TYPE_COLORS[type],
    }))
    .filter((d) => d.value > 0)

  const statusData = [
    { label: t.analytics.ideas, value: ideas, color: 'oklch(0.70 0.14 80)' },
    { label: t.analytics.backlog, value: backlog, color: 'oklch(0.62 0.10 250)' },
    { label: t.analytics.active, value: active, color: 'oklch(0.82 0.15 192)' },
    { label: t.analytics.frozen, value: frozen, color: 'oklch(0.58 0.10 220)' },
    { label: t.analytics.done, value: done, color: 'oklch(0.65 0.14 162)' },
  ]

  const completionData = buildCompletionData(items, locale)

  const completedLabel = t.analytics.completedTooltip

  const CustomTooltip = ({
    active: isActive,
    payload,
    label,
  }: {
    active?: boolean
    payload?: { value: number }[]
    label?: string
  }) => {
    if (isActive && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded px-3 py-2 text-xs">
          <p className="text-muted-foreground">{label}</p>
          <p className="text-neon font-bold">
            {payload[0].value} {completedLabel}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{t.analytics.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t.analytics.subtitle}</p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label={t.analytics.totalItems} value={total} />
          <StatCard label={t.analytics.completed} value={done} color="text-[oklch(0.65_0.14_162)]" />
          <StatCard label={t.analytics.completionRate} value={`${completionRate}%`} color="text-neon" />
          <StatCard
            label={t.analytics.avgScore}
            value={avgScore}
            sub={t.analytics.avgScoreSub}
            color="text-[oklch(0.70_0.14_80)]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Completions over 7 days */}
          <div className="bg-card border border-border rounded-md p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              {t.analytics.completionsChart}
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={completionData} barSize={20}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'oklch(0.52 0 0)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'oklch(0.52 0 0)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={20}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="oklch(0.82 0.15 192)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution by type */}
          <div className="bg-card border border-border rounded-md p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              {t.analytics.typeDistribution}
            </h2>
            {typeData.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-xs text-muted-foreground">{t.common.noData}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Legend
                    iconSize={8}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ fontSize: 10, color: 'oklch(0.52 0 0)' }}>{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      background: 'oklch(0.13 0 0)',
                      border: '1px solid oklch(0.22 0 0)',
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                    labelStyle={{ color: 'oklch(0.52 0 0)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-card border border-border rounded-md p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            {t.analytics.statusBreakdown}
          </h2>
          <div className="space-y-3">
            {statusData.map((s) => {
              const pct = total > 0 ? (s.value / total) * 100 : 0
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground w-16 shrink-0">{s.label}</span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: s.color }}
                    />
                  </div>
                  <span
                    className="text-[11px] tabular-nums w-6 text-right"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
