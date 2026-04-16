'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { AppShell } from '@/components/app/app-shell'
import { TaskCard } from '@/components/app/task-card'
import { TaskModal } from '@/components/app/task-modal'
import { QuickAdd } from '@/components/app/quick-add'
import { TaskItem, ItemType, Horizon } from '@/lib/types'
import { cn } from '@/lib/utils'

const TYPES: (ItemType | 'all')[] = ['all', 'infra', 'bot', 'mail', '3d', 'automation', 'fun', 'other']
const HORIZONS: (Horizon | 'all')[] = ['all', 'week', 'month', 'quarter', 'year']
type SortKey = 'score' | 'created' | 'updated'

export default function BacklogPage() {
  const items = useStore((s) => s.items)
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null)
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all')
  const [horizonFilter, setHorizonFilter] = useState<Horizon | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const t = useI18n()

  const SORT_LABELS: Record<SortKey, string> = {
    score: t.backlog.sortScore,
    created: t.backlog.sortCreated,
    updated: t.backlog.sortUpdated,
  }

  const backlog = items
    .filter((i) => i.status === 'backlog')
    .filter((i) => typeFilter === 'all' || i.type === typeFilter)
    .filter((i) => horizonFilter === 'all' || i.horizon === horizonFilter)
    .sort((a, b) => {
      if (sortKey === 'score') return b.score - a.score
      if (sortKey === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">{t.backlog.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t.backlog.subtitle(backlog.length)}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
            {(['score', 'created', 'updated'] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={cn(
                  'px-2.5 py-1 text-[11px] rounded border transition-colors whitespace-nowrap',
                  sortKey === k
                    ? 'border-neon/60 text-neon bg-neon/10'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {SORT_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <QuickAdd defaultStatus="backlog" placeholder={t.backlog.placeholder} />
        </div>

        {/* Filters - Horizontal scroll on mobile */}
        <div className="mb-5 space-y-3">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-1 min-w-min md:min-w-0 md:flex-wrap">
              {TYPES.map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTypeFilter(tp)}
                  className={cn(
                    'px-2 py-1 text-[11px] rounded border transition-colors whitespace-nowrap',
                    typeFilter === tp
                      ? 'border-neon/60 text-neon bg-neon/10'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tp === 'all' ? t.common.all : t.type[tp]}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-1 min-w-min md:min-w-0 md:flex-wrap">
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizonFilter(h)}
                  className={cn(
                    'px-2 py-1 text-[11px] rounded border transition-colors whitespace-nowrap',
                    horizonFilter === h
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

        <div className="space-y-2">
          {backlog.length === 0 ? (
            <div className="bg-card border border-border rounded-md px-4 py-12 text-center">
              <p className="text-xs text-muted-foreground">{t.backlog.empty}</p>
            </div>
          ) : (
            backlog.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-2">
                <span className="text-[10px] text-muted-foreground w-5 text-right mt-3.5 tabular-nums shrink-0">{idx + 1}</span>
                <div className="flex-1">
                  <TaskCard item={item} onClick={() => setSelectedItem(item)} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedItem && (
        <TaskModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </AppShell>
  )
}
