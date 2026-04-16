'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { AppShell } from '@/components/app/app-shell'
import { CalendarGrid } from '@/components/planner/calendar-grid'
import { CapacitySummary } from '@/components/planner/capacity-summary'
import { PlannerHeader } from '@/components/planner/planner-header'
import {
  parseDate,
  formatDateLocal,
  getMonthDates,
  getNextMonth,
  getPrevMonth,
  getTasksWithDeadlines,
  calculateAvailableHours,
} from '@/lib/planner-logic'

export default function MonthViewPage() {
  const t = useI18n()
  const router = useRouter()
  const items = useStore((s) => s.items)
  const selectedDate = useStore((s) => s.selectedDate)
  const setSelectedDate = useStore((s) => s.setSelectedDate)
  const getShiftForDate = useStore((s) => s.getShiftForDate)
  const setCalendarView = useStore((s) => s.setCalendarView)

  // Get current month/year from selected date
  const currentDate = parseDate(selectedDate)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthDates = getMonthDates(year, month)

  // Calculate monthly totals
  const monthlyStats = useMemo(() => {
    let totalAvailable = 0
    let totalPlanned = 0
    let totalActual = 0

    for (const date of monthDates) {
      const shift = getShiftForDate(date)
      totalAvailable += calculateAvailableHours(shift)

      for (const task of items) {
        if (task.scheduledBlocks) {
          for (const block of task.scheduledBlocks) {
            if (block.date === date) {
              totalPlanned += block.durationMinutes / 60
            }
          }
        }
        if (task.workLogs) {
          for (const log of task.workLogs) {
            if (log.date === date) {
              totalActual += log.durationMinutes / 60
            }
          }
        }
      }
    }

    return { totalAvailable, totalPlanned, totalActual }
  }, [monthDates, items, getShiftForDate])

  // Get deadlines this month
  const deadlines = useMemo(() => {
    const startDate = monthDates[0]
    const endDate = monthDates[monthDates.length - 1]
    return getTasksWithDeadlines(items, startDate, endDate)
  }, [monthDates, items])

  // Navigation
  const today = formatDateLocal(new Date())
  const todayDate = parseDate(today)
  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month
  
  const goToToday = () => setSelectedDate(today)
  const goToPrev = () => setSelectedDate(getPrevMonth(selectedDate))
  const goToNext = () => setSelectedDate(getNextMonth(selectedDate))

  // Handle date selection - navigate to day view
  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setCalendarView('day')
    router.push('/planner/day')
  }

  // Format month for display
  const localeStr = t.locale === 'ru' ? 'ru-RU' : 'en-US'
  const monthTitle = currentDate.toLocaleDateString(localeStr, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {/* Unified header with view switcher */}
        <PlannerHeader
        title={monthTitle}
        isCurrentPeriod={isCurrentMonth}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        todayLabel={t.planner?.thisMonth || 'This Month'}
      >
        <CapacitySummary
          available={monthlyStats.totalAvailable}
          planned={monthlyStats.totalPlanned}
          actual={monthlyStats.totalActual}
          compact
        />
      </PlannerHeader>

      {/* Month content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto">
          <CalendarGrid
            year={year}
            month={month}
            selectedDate={selectedDate}
            tasks={items}
            getShiftForDate={getShiftForDate}
            onDateSelect={handleDateSelect}
          />

          {/* Deadlines section */}
          {deadlines.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t.planner?.deadlinesThisMonth || 'Deadlines this month'} ({deadlines.length})
              </h3>
              <div className="space-y-2">
                {deadlines
                  .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
                  .map((task) => {
                    const deadlineDate = parseDate(task.deadline!)
                    const isPast = task.deadline! < today
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'p-3 rounded border cursor-pointer transition-colors',
                          isPast
                            ? 'bg-destructive/10 border-destructive/30 hover:bg-destructive/15'
                            : 'bg-card border-border hover:border-neon/30'
                        )}
                        onClick={() => handleDateSelect(task.deadline!)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-xs font-medium', isPast && 'text-destructive')}>
                              {task.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {task.description?.slice(0, 60)}
                              {task.description && task.description.length > 60 ? '...' : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn(
                              'text-[10px] font-medium',
                              isPast ? 'text-destructive' : 'text-muted-foreground'
                            )}>
                              {deadlineDate.toLocaleDateString(localeStr, {
                                weekday: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            {task.estimatedHours && (
                              <p className="text-[9px] text-muted-foreground">
                                {task.estimatedHours}h est.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Monthly summary section */}
          <div className="mt-6 p-4 rounded-lg bg-card border border-border">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {t.planner?.monthlySummary || 'Monthly Summary'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {monthlyStats.totalAvailable.toFixed(0)}h
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t.planner?.available || 'Available'}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-neon tabular-nums">
                  {monthlyStats.totalPlanned.toFixed(0)}h
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t.planner?.plannedLabel || 'Planned'}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-chart-2 tabular-nums">
                  {monthlyStats.totalActual.toFixed(0)}h
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t.planner?.actual || 'Actual'}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {deadlines.length}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t.planner?.deadlines || 'Deadlines'}
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
