'use client'

import { cn } from '@/lib/utils'
import { ShiftTemplate, ShiftType } from '@/lib/types'
import { useI18n } from '@/hooks/use-i18n'

interface ShiftSelectorProps {
  shifts: ShiftTemplate[]
  selectedShiftId: string
  onSelect: (shiftId: string) => void
  className?: string
  compact?: boolean
}

const SHIFT_ICONS: Record<ShiftType, string> = {
  day_shift: '☀',
  night_shift: '☾',
  off_day: '◯',
  custom: '◈',
}

export function ShiftSelector({ 
  shifts, 
  selectedShiftId, 
  onSelect,
  className,
  compact = false
}: ShiftSelectorProps) {
  const t = useI18n()

  if (compact) {
    return (
      <div className={cn('flex gap-1', className)}>
        {shifts.map((shift) => (
          <button
            key={shift.id}
            onClick={() => onSelect(shift.id)}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded text-sm transition-all',
              selectedShiftId === shift.id
                ? 'bg-neon/20 text-neon border border-neon/30'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            )}
            title={t.planner?.shifts?.[shift.type as keyof typeof t.planner.shifts] || shift.name}
          >
            {SHIFT_ICONS[shift.type]}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {shifts.map((shift) => (
        <button
          key={shift.id}
          onClick={() => onSelect(shift.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded text-xs transition-all text-left',
            selectedShiftId === shift.id
              ? 'bg-neon/15 text-neon border border-neon/30'
              : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
          )}
        >
          <span className="text-base">{SHIFT_ICONS[shift.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {t.planner?.shifts?.[shift.type as keyof typeof t.planner.shifts] || shift.name}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {shift.totalWorkHours}h {t.planner?.workHours || 'work'}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

interface ShiftBadgeProps {
  shift: ShiftTemplate
  className?: string
}

export function ShiftBadge({ shift, className }: ShiftBadgeProps) {
  const t = useI18n()
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
        'bg-secondary text-muted-foreground',
        className
      )}
      title={t.planner?.shifts?.[shift.type as keyof typeof t.planner.shifts] || shift.name}
    >
      <span>{SHIFT_ICONS[shift.type]}</span>
      <span className="tabular-nums">{shift.totalWorkHours}h</span>
    </span>
  )
}
