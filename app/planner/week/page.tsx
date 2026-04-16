'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { WeekGrid } from '@/components/planner/calendar-grid'
import { CapacitySummary } from '@/components/planner/capacity-summary'
import {
  parseDate,
  formatDateISO,
  getWeekStart,
  getWeekDates,
  getNextWeek,
  getPrevWeek,
  calculateAvailableHours,
} from '@/lib/planner-logic'

export default function WeekViewPage() {
  const t = useI18n()
  const router = useRouter()
  const items = useStore((s) => s.items)
  const selectedDate = useStore((s) => s.selectedDate)
  const setSelectedDate = useStore((s) => s.setSelectedDate)
  const getShiftForDate = useStore((s) => s.getShiftForDate)
  const setCalendarView = useStore((s) => s.setCalendarView)

  // Get week dates starting from Monday
  const weekStart = getWeekStart(selectedDate)
  const weekDates = getWeekDates(weekStart)

  // Calculate weekly totals
  const weeklyStats = useMemo(() => {
    let totalAvailable = 0
    let totalPlanned = 0
    let totalActual = 0

    for (const date of weekDates) {
      const shift = getShiftForDate(date)
      totalAvailable += shift.totalWorkHours

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
  }, [weekDates, items, getShiftForDate])

  // Navigation
  const goToToday = () => setSelectedDate(formatDateISO(new Date()))
  const goToPrev = () => setSelectedDate(getPrevWeek(selectedDate))
  const goToNext = () => setSelectedDate(getNextWeek(selectedDate))

  // Handle date selection - navigate to day view
  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setCalendarView('day')
    router.push('/planner/day')
  }

  // Format week range for display
  const weekStartDate = parseDate(weekStart)
  const weekEndDate = parseDate(weekDates[weekDates.length - 1])
  const isCurrentWeek = weekDates.includes(formatDateISO(new Date()))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Week header */}
      <div className="border-b border-border px-4 py-3 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrev}
              className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Previous week"
            >
              <span className="text-sm">&larr;</span>
            </button>

            <div className="text-center min-w-[180px]">
              <div className={cn('text-sm font-bold', isCurrentWeek && 'text-neon')}>
                {weekStartDate.toLocaleDateString(t.locale === 'ru' ? 'ru-RU' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                {' - '}
                {weekEndDate.toLocaleDateString(t.locale === 'ru' ? 'ru-RU' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>

            <button
              onClick={goToNext}
              className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Next week"
            >
              <span className="text-sm">&rarr;</span>
            </button>

            {!isCurrentWeek && (
              <button
                onClick={goToToday}
                className="px-2 py-1 rounded text-[10px] font-medium bg-neon/10 text-neon hover:bg-neon/20 transition-colors"
              >
                {t.planner?.thisWeek || 'This Week'}
              </button>
            )}
          </div>

          {/* Weekly summary */}
          <CapacitySummary
            available={weeklyStats.totalAvailable}
            planned={weeklyStats.totalPlanned}
            actual={weeklyStats.totalActual}
            compact
          />
        </div>
      </div>

      {/* Week grid */}
      <div className="flex-1 overflow-auto p-4">
        <WeekGrid
          weekDates={weekDates}
          selectedDate={selectedDate}
          tasks={items}
          getShiftForDate={getShiftForDate}
          onDateSelect={handleDateSelect}
        />

        {/* Weekly tasks with scheduling */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.planner?.weeklySchedule || 'Weekly Schedule'}
          </h3>

          {/* Tasks scheduled this week */}
          {weekDates.map((date) => {
            const dateBlocks = items.flatMap((task) =>
              (task.scheduledBlocks || [])
                .filter((b) => b.date === date)
                .map((block) => ({ ...block, task }))
            )

            if (dateBlocks.length === 0) return null

            const displayDate = parseDate(date)
            const dayName = displayDate.toLocaleDateString(t.locale === 'ru' ? 'ru-RU' : 'en-US', {
              weekday: 'short',
              day: 'numeric',
            })

            return (
              <div key={date} className="space-y-1.5">
                <h4 className="text-[11px] font-medium text-foreground">{dayName}</h4>
                <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {dateBlocks
                    .sort((a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute))
                    .map((block) => (
                      <div
                        key={block.id}
                        className="p-2 rounded bg-neon/10 border border-neon/20 cursor-pointer hover:bg-neon/15 transition-colors"
                        onClick={() => handleDateSelect(date)}
                      >
                        <p className="text-[10px] text-muted-foreground">
                          {block.startHour.toString().padStart(2, '0')}:{block.startMinute.toString().padStart(2, '0')}
                        </p>
                        <p className="text-[11px] font-medium truncate">{block.task.title}</p>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}

          {/* If no scheduled tasks this week */}
          {weekDates.every((date) =>
            items.every((task) => !(task.scheduledBlocks || []).some((b) => b.date === date))
          ) && (
            <p className="text-xs text-muted-foreground">
              {t.planner?.noWeeklySchedule || 'No tasks scheduled this week. Click on a day to add.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
