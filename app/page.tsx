'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { AppShell } from '@/components/app/app-shell'
import { TaskCard } from '@/components/app/task-card'
import { TaskModal } from '@/components/app/task-modal'
import { QuickAdd } from '@/components/app/quick-add'
import { TaskItem } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const items = useStore((s) => s.items)
  const wipLimit = useStore((s) => s.wipLimit)
  const locale = useStore((s) => s.locale)
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null)
  const t = useI18n()

  const ideas = items.filter((i) => i.status === 'idea')
  const backlog = items.filter((i) => i.status === 'backlog')
  const active = items.filter((i) => i.status === 'active')
  const frozen = items.filter((i) => i.status === 'frozen')
  const done = items.filter((i) => i.status === 'done')

  const isOverWip = active.length > wipLimit

  const topBacklog = [...backlog].sort((a, b) => b.score - a.score).slice(0, 3)
  const recentDone = [...done]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)

  const stats = [
    { label: t.nav.inbox, value: ideas.length, color: 'text-[oklch(0.70_0.14_80)]' },
    { label: t.nav.backlog, value: backlog.length, color: 'text-[oklch(0.62_0.10_250)]' },
    {
      label: t.dashboard.activeTasks,
      value: `${active.length} / ${wipLimit}`,
      color: isOverWip ? 'text-[oklch(0.72_0.14_80)]' : 'text-neon',
      warn: isOverWip,
    },
    { label: t.nav.frozen, value: frozen.length, color: 'text-[oklch(0.58_0.10_220)]' },
    { label: t.nav.done, value: done.length, color: 'text-[oklch(0.65_0.14_162)]' },
  ]

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">{t.dashboard.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>
            {new Date().toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Quick add */}
        <div className="mb-6 md:mb-8">
          <QuickAdd placeholder={t.inbox.placeholder} defaultStatus="idea" />
        </div>

        {/* Stats row - Responsive grid: 2 cols mobile, 3 tablet, 5 desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mb-6 md:mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'bg-card border rounded-md px-4 py-3',
                stat.warn ? 'border-[oklch(0.72_0.14_80)/40]' : 'border-border'
              )}
            >
              <div className={cn('text-2xl font-bold tabular-nums', stat.color)}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* WIP overload alert */}
        {isOverWip && (
          <div className="mb-6 px-4 py-3 border border-[oklch(0.72_0.14_80)/40] bg-[oklch(0.72_0.14_80)/8] rounded-md flex items-center gap-3">
            <span className="text-[oklch(0.72_0.14_80)] text-sm">!</span>
            <p className="text-xs text-[oklch(0.72_0.14_80)]">
              {t.dashboard.wipAlert(active.length, wipLimit)}
            </p>
          </div>
        )}

        {/* Main grid - Responsive: 1 col mobile, 3 cols tablet+ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Active tasks */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t.dashboard.activeTasks}
              </h2>
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-bold',
                  isOverWip
                    ? 'bg-[oklch(0.72_0.14_80)/20] text-[oklch(0.72_0.14_80)]'
                    : 'bg-neon/10 text-neon'
                )}
              >
                {active.length} / {wipLimit}
              </span>
            </div>
            <div className="space-y-2">
              {active.length === 0 ? (
                <div className="bg-card border border-border rounded-md px-4 py-8 text-center">
                  <p className="text-xs text-muted-foreground">{t.dashboard.noActive}</p>
                </div>
              ) : (
                active
                  .sort((a, b) => b.score - a.score)
                  .map((item) => (
                    <TaskCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
                  ))
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Top backlog */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t.dashboard.topBacklog}
                </h2>
              </div>
              <div className="space-y-2">
                {topBacklog.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-1">{t.dashboard.noBacklog}</p>
                ) : (
                  topBacklog.map((item) => (
                    <TaskCard key={item.id} item={item} compact onClick={() => setSelectedItem(item)} />
                  ))
                )}
              </div>
            </div>

            {/* Recent completions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t.dashboard.recentlyDone}
                </h2>
              </div>
              <div className="space-y-2">
                {recentDone.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-1">{t.dashboard.noDone}</p>
                ) : (
                  recentDone.map((item) => (
                    <TaskCard key={item.id} item={item} compact onClick={() => setSelectedItem(item)} />
                  ))
                )}
              </div>
            </div>

            {/* Frozen */}
            {frozen.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t.dashboard.frozenSection}
                  </h2>
                  <span className="text-[10px] text-muted-foreground">{frozen.length}</span>
                </div>
                <div className="space-y-2">
                  {frozen.slice(0, 2).map((item) => (
                    <TaskCard key={item.id} item={item} compact onClick={() => setSelectedItem(item)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedItem && (
        <TaskModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </AppShell>
  )
}
