'use client'

import { cn } from '@/lib/utils'
import { TaskItem, ShiftTemplate } from '@/lib/types'
import { 
  parseDate, formatDateLocal, getMonthDates, getCapacityStatus, 
  getCapacityBgColor, getTasksWithDeadlines, calculateAvailableHours
} from '@/lib/planner-logic'
import { ShiftBadge } from './shift-selector'
import { useI18n } from '@/hooks/use-i18n'

interface CalendarGridProps {
  year: number
  month: number // 0-11
  selectedDate: string
  tasks: TaskItem[]
  getShiftForDate: (date: string) => ShiftTemplate
  onDateSelect: (date: string) => void
  className?: string
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function CalendarGrid({
  year,
  month,
  selectedDate,
  tasks,
  getShiftForDate,
  onDateSelect,
  className,
}: CalendarGridProps) {
  const t = useI18n()
  const monthDates = getMonthDates(year, month)
  const today = formatDateLocal(new Date())
  
  // Get the first day of the month (0 = Sunday, need to convert to Monday-start)
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  // Get deadlines for the month
  const startDate = monthDates[0]
  const endDate = monthDates[monthDates.length - 1]
  const tasksWithDeadlines = getTasksWithDeadlines(tasks, startDate, endDate)

  // Get planned hours per date
  const plannedByDate: Record<string, number> = {}
  for (const date of monthDates) {
    let total = 0
    for (const task of tasks) {
      if (task.scheduledBlocks) {
        for (const block of task.scheduledBlocks) {
          if (block.date === date) {
            total += block.durationMinutes / 60
          }
        }
      }
    }
    plannedByDate[date] = total
  }

  return (
    <div className={cn('', className)}>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div 
            key={day} 
            className={cn(
              'text-center text-[10px] font-medium py-1',
              i >= 5 ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            {t.planner?.weekdays?.[day.toLowerCase() as keyof typeof t.planner.weekdays] || day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding for first week */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {/* Date cells */}
        {monthDates.map((date) => {
          const d = parseDate(date)
          const dayNum = d.getDate()
          const isToday = date === today
          const isSelected = date === selectedDate
          const isWeekend = d.getDay() === 0 || d.getDay() === 6
          const shift = getShiftForDate(date)
          const planned = plannedByDate[date] || 0
          const available = calculateAvailableHours(shift)
          const status = getCapacityStatus(planned, available)
          const hasDeadline = tasksWithDeadlines.some((t) => t.deadline === date)

          return (
            <button
              key={date}
              onClick={() => onDateSelect(date)}
              className={cn(
                'relative aspect-square rounded flex flex-col items-center justify-center transition-all p-1',
                'hover:bg-secondary/50',
                isSelected && 'ring-1 ring-neon bg-neon/10',
                isToday && !isSelected && 'ring-1 ring-neon/50',
                isWeekend && 'text-muted-foreground',
                status !== 'free' && getCapacityBgColor(status)
              )}
            >
              <span className={cn(
                'text-xs tabular-nums',
                isSelected && 'font-bold text-neon',
                isToday && !isSelected && 'font-bold'
              )}>
                {dayNum}
              </span>
              
              {/* Shift indicator (small dot) */}
              {shift.type !== 'day_shift' && (
                <span className="text-[8px] mt-0.5">
                  {shift.type === 'night_shift' ? '☾' : shift.type === 'off_day' ? '◯' : '◈'}
                </span>
              )}
              
              {/* Deadline indicator */}
              {hasDeadline && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-destructive" />
              )}
              
              {/* Planned hours indicator */}
              {planned > 0 && (
                <span className="absolute bottom-0.5 text-[7px] text-muted-foreground tabular-nums">
                  {planned.toFixed(0)}h
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface WeekGridProps {
  weekDates: string[]
  selectedDate: string
  tasks: TaskItem[]
  getShiftForDate: (date: string) => ShiftTemplate
  onDateSelect: (date: string) => void
  className?: string
}

export function WeekGrid({
  weekDates,
  selectedDate,
  tasks,
  getShiftForDate,
  onDateSelect,
  className,
}: WeekGridProps) {
  const t = useI18n()
  const today = formatDateLocal(new Date())

  return (
    <div className={cn('grid grid-cols-7 gap-2', className)}>
      {weekDates.map((date) => {
        const d = parseDate(date)
        const dayNum = d.getDate()
        const dayName = WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]
        const isToday = date === today
        const isSelected = date === selectedDate
        const shift = getShiftForDate(date)
        
        // Calculate planned hours for this date
        let planned = 0
        let actual = 0
        for (const task of tasks) {
          if (task.scheduledBlocks) {
            for (const block of task.scheduledBlocks) {
              if (block.date === date) {
                planned += block.durationMinutes / 60
              }
            }
          }
          if (task.workLogs) {
            for (const log of task.workLogs) {
              if (log.date === date) {
                actual += log.durationMinutes / 60
              }
            }
          }
        }

        const available = calculateAvailableHours(shift)
        const status = getCapacityStatus(planned, available)
        const hasDeadlines = tasks.some((t) => t.deadline === date)

        return (
          <button
            key={date}
            onClick={() => onDateSelect(date)}
            className={cn(
              'flex flex-col rounded-lg border transition-all p-2 min-h-[120px]',
              'hover:border-neon/30',
              isSelected ? 'border-neon bg-neon/5' : 'border-border bg-card',
              isToday && !isSelected && 'border-neon/50'
            )}
          >
            {/* Day header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-[10px] uppercase',
                  isToday ? 'text-neon font-bold' : 'text-muted-foreground'
                )}>
                  {t.planner?.weekdays?.[dayName.toLowerCase() as keyof typeof t.planner.weekdays] || dayName}
                </span>
                <span className={cn(
                  'text-sm tabular-nums',
                  isSelected && 'text-neon font-bold'
                )}>
                  {dayNum}
                </span>
              </div>
              <ShiftBadge shift={shift} />
            </div>

            {/* Capacity bar */}
            <div className="flex-1 flex flex-col justify-end">
              {hasDeadlines && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-[9px] text-destructive">{t.planner?.deadline || 'Deadline'}</span>
                </div>
              )}
              
              <div className="space-y-1">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all', 
                      status === 'overloaded' ? 'bg-destructive' : 'bg-neon'
                    )}
                    style={{ width: `${Math.min((planned / Math.max(available, 0.1)) * 100, 100)}%` }}
                  />
                </div>
                {actual > 0 && (
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chart-2"
                      style={{ width: `${Math.min((actual / Math.max(available, 0.1)) * 100, 100)}%` }}
                    />
                  </div>
                )}
                <div className="flex justify-between text-[9px] text-muted-foreground tabular-nums">
                  <span>{planned.toFixed(1)}h</span>
                  <span>{available.toFixed(0)}h</span>
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
