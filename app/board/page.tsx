'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { AppShell } from '@/components/app/app-shell'
import { TaskCard } from '@/components/app/task-card'
import { TaskModal } from '@/components/app/task-modal'
import { QuickAdd } from '@/components/app/quick-add'
import { TaskItem, ItemStatus, ItemType, Horizon } from '@/lib/types'
import { cn } from '@/lib/utils'

type Filter = { type: ItemType | 'all'; horizon: Horizon | 'all' }

const TYPES: (ItemType | 'all')[] = ['all', 'infra', 'bot', 'mail', '3d', 'automation', 'fun', 'other']
const HORIZONS: (Horizon | 'all')[] = ['all', 'week', 'month', 'quarter', 'year']

export default function BoardPage() {
  const items = useStore((s) => s.items)
  const wipLimit = useStore((s) => s.wipLimit)
  const setWipLimit = useStore((s) => s.setWipLimit)
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null)
  const [creatingStatus, setCreatingStatus] = useState<ItemStatus | null>(null)
  const [filter, setFilter] = useState<Filter>({ type: 'all', horizon: 'all' })
  const t = useI18n()

  const COLUMNS: { status: ItemStatus; label: string; color: string }[] = [
    { status: 'idea', label: t.board.inboxCol, color: 'text-[oklch(0.70_0.14_80)]' },
    { status: 'backlog', label: t.board.backlogCol, color: 'text-[oklch(0.62_0.10_250)]' },
    { status: 'active', label: t.board.activeCol, color: 'text-neon' },
    { status: 'frozen', label: t.board.frozenCol, color: 'text-[oklch(0.58_0.10_220)]' },
    { status: 'done', label: t.board.doneCol, color: 'text-[oklch(0.65_0.14_162)]' },
  ]

  function filterItems(status: ItemStatus) {
    return items
      .filter((i) => i.status === status)
      .filter((i) => filter.type === 'all' || i.type === filter.type)
      .filter((i) => filter.horizon === 'all' || i.horizon === filter.horizon)
      .sort((a, b) => b.score - a.score)
  }

  const activeCount = items.filter((i) => i.status === 'active').length
  const isOverWip = activeCount > wipLimit

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 shrink-0">
          <h1 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">{t.board.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground uppercase tracking-widest">{t.board.wipLimit}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWipLimit(Math.max(1, wipLimit - 1))}
                className="w-7 h-7 flex items-center justify-center border border-border rounded text-muted-foreground hover:text-foreground text-xs"
                aria-label="Decrease WIP limit"
              >
                −
              </button>
              <span className={cn('text-sm font-bold tabular-nums w-6 text-center', isOverWip ? 'text-[oklch(0.72_0.14_80)]' : 'text-neon')}>
                {wipLimit}
              </span>
              <button
                onClick={() => setWipLimit(wipLimit + 1)}
                className="w-7 h-7 flex items-center justify-center border border-border rounded text-muted-foreground hover:text-foreground text-xs"
                aria-label="Increase WIP limit"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Filters - Horizontal scroll on mobile */}
        <div className="mb-5 shrink-0 space-y-3">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-1 min-w-min md:min-w-0 md:flex-wrap">
              {TYPES.map((tp) => (
                <button
                  key={tp}
                  onClick={() => setFilter((f) => ({ ...f, type: tp }))}
                  className={cn(
                    'px-2.5 py-1 text-[11px] rounded border transition-colors whitespace-nowrap',
                    filter.type === tp
                      ? 'border-neon/60 text-neon bg-neon/10'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tp === 'all' ? t.common.allTypes : t.type[tp]}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-1 min-w-min md:min-w-0 md:flex-wrap">
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setFilter((f) => ({ ...f, horizon: h }))}
                  className={cn(
                    'px-2.5 py-1 text-[11px] rounded border transition-colors whitespace-nowrap',
                    filter.horizon === h
                      ? 'border-neon/60 text-neon bg-neon/10'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {h === 'all' ? t.common.all : t.horizon[h]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kanban columns - Horizontal scroll on mobile */}
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 flex-1 -mx-4 md:mx-0 px-4 md:px-0">
          {COLUMNS.map((col) => {
            const colItems = filterItems(col.status)
            const isActiveCol = col.status === 'active'
            const overWip = isActiveCol && isOverWip

            return (
              <div key={col.status} className="flex flex-col shrink-0 w-64 md:w-72">
                {/* Column header */}
                <div className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-t-md border border-b-0',
                  overWip ? 'border-[oklch(0.72_0.14_80)/40] bg-[oklch(0.72_0.14_80)/5]' : 'border-border bg-card'
                )}>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[11px] font-semibold uppercase tracking-widest', col.color)}>
                      {col.label}
                    </span>
                    {isActiveCol && (
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                        overWip
                          ? 'bg-[oklch(0.72_0.14_80)/20] text-[oklch(0.72_0.14_80)]'
                          : 'bg-neon/10 text-neon'
                      )}>
                        {activeCount} / {wipLimit}{overWip && ' !'}
                      </span>
                    )}
                    {!isActiveCol && colItems.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{colItems.length}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setCreatingStatus(col.status)}
                    className="text-muted-foreground hover:text-foreground text-sm leading-none"
                    title={t.board.addTo(col.label)}
                  >
                    +
                  </button>
                </div>

                {/* Column body */}
                <div className={cn(
                  'flex-1 border border-t-0 rounded-b-md p-2 space-y-2 overflow-y-auto min-h-48',
                  overWip ? 'border-[oklch(0.72_0.14_80)/40] bg-[oklch(0.72_0.14_80)/3]' : 'border-border bg-background/50'
                )}>
                  {colItems.length === 0 ? (
                    <div className="flex items-center justify-center h-24">
                      <p className="text-[11px] text-muted-foreground">—</p>
                    </div>
                  ) : (
                    colItems.map((item) => (
                      <TaskCard key={item.id} item={item} compact onClick={() => setSelectedItem(item)} />
                    ))
                  )}
                </div>

                {col.status === 'idea' && (
                  <div className="mt-2">
                    <QuickAdd defaultStatus={col.status} placeholder={`+ ${t.common.quick}...`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selectedItem && (
        <TaskModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      {creatingStatus && (
        <TaskModal defaultStatus={creatingStatus} onClose={() => setCreatingStatus(null)} />
      )}
    </AppShell>
  )
}
