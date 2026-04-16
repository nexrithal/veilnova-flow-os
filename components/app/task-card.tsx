'use client'

import { TaskItem, ItemStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'

interface TaskCardProps {
  item: TaskItem
  onClick?: () => void
  compact?: boolean
}

const TYPE_COLORS: Record<string, string> = {
  infra: 'text-[oklch(0.70_0.14_250)] border-[oklch(0.70_0.14_250)/30] bg-[oklch(0.70_0.14_250)/8]',
  bot: 'text-[oklch(0.75_0.14_300)] border-[oklch(0.75_0.14_300)/30] bg-[oklch(0.75_0.14_300)/8]',
  mail: 'text-[oklch(0.72_0.14_80)] border-[oklch(0.72_0.14_80)/30] bg-[oklch(0.72_0.14_80)/8]',
  '3d': 'text-[oklch(0.70_0.18_30)] border-[oklch(0.70_0.18_30)/30] bg-[oklch(0.70_0.18_30)/8]',
  automation: 'text-[oklch(0.82_0.15_192)] border-[oklch(0.82_0.15_192)/30] bg-[oklch(0.82_0.15_192)/8]',
  fun: 'text-[oklch(0.75_0.16_162)] border-[oklch(0.75_0.16_162)/30] bg-[oklch(0.75_0.16_162)/8]',
  other: 'text-muted-foreground border-border bg-muted/30',
}

const HORIZON_DOT: Record<string, string> = {
  week: 'bg-[oklch(0.82_0.15_192)]',
  month: 'bg-[oklch(0.70_0.14_80)]',
  quarter: 'bg-[oklch(0.65_0.18_300)]',
  year: 'bg-[oklch(0.62_0.20_30)]',
}

export function TaskCard({ item, onClick, compact = false }: TaskCardProps) {
  const moveItem = useStore((s) => s.moveItem)
  const t = useI18n()

  const STATUS_ACTIONS: Record<ItemStatus, { label: string; next: ItemStatus }[]> = {
    idea: [{ label: t.actions.toBacklog, next: 'backlog' }],
    backlog: [
      { label: t.actions.toActive, next: 'active' },
      { label: t.actions.toFrozen, next: 'frozen' },
    ],
    active: [
      { label: t.actions.toDone, next: 'done' },
      { label: t.actions.toFrozen, next: 'frozen' },
    ],
    frozen: [
      { label: t.actions.toBacklog, next: 'backlog' },
      { label: t.actions.toActive, next: 'active' },
    ],
    done: [{ label: t.actions.toArchive, next: 'archived' }],
    archived: [],
  }

  const scoreColor =
    item.score >= 12
      ? 'text-[oklch(0.82_0.15_192)]'
      : item.score >= 8
        ? 'text-[oklch(0.75_0.16_162)]'
        : item.score >= 4
          ? 'text-[oklch(0.72_0.14_80)]'
          : 'text-muted-foreground'

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-card border border-border rounded-md cursor-pointer min-w-0',
        'hover:border-[oklch(0.82_0.15_192)/50] hover:bg-[oklch(0.15_0_0)/5] transition-all duration-150',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
        <span
          className={cn(
            'text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0',
            TYPE_COLORS[item.type]
          )}
        >
          {t.type[item.type]}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              'text-xs font-bold tabular-nums',
              scoreColor
            )}
            title={`Score: PV(${item.personalValue}) + SI(${item.systemImpact}) - E(${item.effort})`}
          >
            {item.score > 0 ? '+' : ''}{item.score}
          </span>
        </div>
      </div>

      {/* Title - with proper text overflow handling */}
      <h3 className={cn(
        'font-semibold text-foreground leading-snug break-words min-w-0',
        compact ? 'text-xs' : 'text-sm'
      )}>
        {item.title}
        {item.notDoing && (
          <span className="ml-2 text-[10px] text-muted-foreground border border-border px-1 rounded">
            {t.common.skip}
          </span>
        )}
      </h3>

      {!compact && item.description && (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2 break-words">{item.description}</p>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="flex items-center gap-1.5">
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', HORIZON_DOT[item.horizon])} />
          <span className="text-[11px] text-muted-foreground">{t.horizon[item.horizon]}</span>
        </div>
        {item.logs.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {item.logs.length} {t.common.logs.toLowerCase()}
          </span>
        )}
      </div>

      {/* Quick-move actions */}
      {STATUS_ACTIONS[item.status].length > 0 && (
        <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {STATUS_ACTIONS[item.status].map((action) => (
            <button
              key={action.next}
              onClick={(e) => {
                e.stopPropagation()
                moveItem(item.id, action.next)
              }}
              className="text-[10px] text-neon-dim border border-border px-2 py-0.5 rounded hover:border-neon/50 hover:text-neon transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
