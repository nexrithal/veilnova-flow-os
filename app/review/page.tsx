'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { AppShell } from '@/components/app/app-shell'
import { TaskCard } from '@/components/app/task-card'
import { TaskModal } from '@/components/app/task-modal'
import { TaskItem, Horizon } from '@/lib/types'
import { cn } from '@/lib/utils'

type Period = 'week' | 'month' | 'quarter'

function getPeriodStart(period: Period): Date {
  const now = new Date()
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(now.getDate() - 7)
    return d
  }
  if (period === 'month') {
    const d = new Date(now)
    d.setMonth(now.getMonth() - 1)
    return d
  }
  const d = new Date(now)
  d.setMonth(now.getMonth() - 3)
  return d
}

export default function ReviewPage() {
  const items = useStore((s) => s.items)
  const [period, setPeriod] = useState<Period>('week')
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null)
  const t = useI18n()

  const PERIOD_LABELS: Record<Period, string> = {
    week: t.review.week,
    month: t.review.month,
    quarter: t.review.quarter,
  }

  const periodStart = getPeriodStart(period)

  const completed = items
    .filter((i) => i.status === 'done')
    .filter((i) => new Date(i.updatedAt) >= periodStart)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const stillActive = items.filter((i) => i.status === 'active')
  const frozen = items.filter((i) => i.status === 'frozen')

  const suggested = [...items.filter((i) => i.status === 'backlog')]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const horizons: Horizon[] = ['week', 'month', 'quarter', 'year']

  const byHorizon = (list: TaskItem[]) =>
    horizons
      .map((h) => ({ horizon: h, items: list.filter((i) => i.horizon === h) }))
      .filter((g) => g.items.length > 0)

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{t.review.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t.review.subtitle}</p>
          </div>
          <div className="flex gap-1">
            {(['week', 'month', 'quarter'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded border transition-colors',
                  period === p
                    ? 'border-neon/60 text-neon bg-neon/10'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {/* Completed */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.65_0.14_162)]">
                {t.review.completedSection(period)}
              </h2>
              <span className="text-[10px] text-muted-foreground">{t.review.itemsCount(completed.length)}</span>
            </div>
            {completed.length === 0 ? (
              <div className="bg-card border border-border rounded-md px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">{t.review.noCompletions}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {byHorizon(completed).map(({ horizon, items: hItems }) => (
                  <div key={horizon}>
                    <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-widest pl-1">
                      {t.horizon[horizon]}
                    </p>
                    {hItems.map((item) => (
                      <div key={item.id} className="mb-2">
                        <TaskCard item={item} compact onClick={() => setSelectedItem(item)} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Still active */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-neon">{t.review.activeSection}</h2>
              <span className="text-[10px] text-muted-foreground">{t.review.itemsCount(stillActive.length)}</span>
            </div>
            {stillActive.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.review.nothingActive}</p>
            ) : (
              <div className="space-y-2">
                {stillActive.map((item) => (
                  <TaskCard key={item.id} item={item} compact onClick={() => setSelectedItem(item)} />
                ))}
              </div>
            )}
          </section>

          {/* Frozen */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.58_0.10_220)]">{t.review.frozenSection}</h2>
              <span className="text-[10px] text-muted-foreground">{t.review.itemsCount(frozen.length)}</span>
            </div>
            {frozen.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.review.nothingFrozen}</p>
            ) : (
              <div className="space-y-2">
                {frozen.map((item) => (
                  <TaskCard key={item.id} item={item} compact onClick={() => setSelectedItem(item)} />
                ))}
              </div>
            )}
          </section>

          {/* Suggested */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.70_0.14_80)]">
                {t.review.suggestedSection}
              </h2>
              <span className="text-[10px] text-muted-foreground">{t.review.byScore}</span>
            </div>
            {suggested.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.review.emptyBacklog}</p>
            ) : (
              <div className="space-y-2">
                {suggested.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="text-[10px] text-muted-foreground w-4 text-right mt-3.5 shrink-0">{idx + 1}</span>
                    <div className="flex-1">
                      <TaskCard item={item} compact onClick={() => setSelectedItem(item)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {selectedItem && (
        <TaskModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </AppShell>
  )
}
