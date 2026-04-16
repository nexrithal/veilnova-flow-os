'use client'

import { cn } from '@/lib/utils'
import { 
  getCapacityStatus, getCapacityColor, getCapacityBgColor, formatHours 
} from '@/lib/planner-logic'
import { useI18n } from '@/hooks/use-i18n'

interface CapacitySummaryProps {
  available: number
  planned: number
  actual: number
  className?: string
  compact?: boolean
}

export function CapacitySummary({ 
  available, 
  planned, 
  actual,
  className,
  compact = false
}: CapacitySummaryProps) {
  const t = useI18n()
  const remaining = Math.max(0, available - planned)
  const status = getCapacityStatus(planned, available)
  const statusColor = getCapacityColor(status)
  const statusBg = getCapacityBgColor(status)

  const statusLabels = {
    free: t.planner?.status?.free || 'Free',
    light: t.planner?.status?.light || 'Light',
    normal: t.planner?.status?.normal || 'Normal',
    busy: t.planner?.status?.busy || 'Busy',
    overloaded: t.planner?.status?.overloaded || 'Overloaded',
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', statusBg, statusColor)}>
          {statusLabels[status]}
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {formatHours(planned)} / {formatHours(available)}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t.planner?.capacity || 'Capacity'}</span>
        <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', statusBg, statusColor)}>
          {statusLabels[status]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', 
              status === 'overloaded' ? 'bg-destructive' : 'bg-neon'
            )}
            style={{ width: `${Math.min((planned / Math.max(available, 1)) * 100, 100)}%` }}
          />
        </div>
        
        {/* Actual work overlay indicator */}
        {actual > 0 && (
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-chart-2 transition-all duration-300"
              style={{ width: `${Math.min((actual / Math.max(available, 1)) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-0.5">
          <div className="text-muted-foreground">{t.planner?.available || 'Available'}</div>
          <div className="font-medium tabular-nums">{formatHours(available)}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-muted-foreground">{t.planner?.plannedLabel || 'Planned'}</div>
          <div className="font-medium tabular-nums text-neon">{formatHours(planned)}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-muted-foreground">{t.planner?.actual || 'Actual'}</div>
          <div className="font-medium tabular-nums text-chart-2">{formatHours(actual)}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-muted-foreground">{t.planner?.remaining || 'Remaining'}</div>
          <div className={cn('font-medium tabular-nums', remaining <= 0 ? 'text-destructive' : '')}>
            {formatHours(remaining)}
          </div>
        </div>
      </div>
    </div>
  )
}
