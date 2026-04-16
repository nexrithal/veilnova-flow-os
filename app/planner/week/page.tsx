'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { WeekGrid } from '@/components/planner/calendar-grid'
import { CapacitySummary } from '@/components/planner/capacity-summary'
import { PlannerHeader } from '@/components/planner/planner-header'
import {
  parseDate,
  formatDateLocal,
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
  }, [weekDates, items, getShiftForDate])

  // Navigation
  const today = formatDateLocal(new Date())
  const goToToday = () => setSelectedDate(today)
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
  const isCurrentWeek = weekDates.includes(today)
  const localeStr = t.locale === 'ru' ? 'ru-RU' : 'en-US'

  const weekTitle = `${weekStartDate.toLocaleDateString(localeStr, {
    month: 'short',
    day: 'numeric',
  })} - ${weekEndDate.toLocaleDateString(localeStr, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Unified header with view switcher */}
      <PlannerHeader
        title={weekTitle}
        isCurrentPeriod={isCurrentWeek}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        todayLabel={t.planner?.thisWeek || 'This Week'}
      >
        <CapacitySummary
          available={weeklyStats.totalAvailable}
          planned={weeklyStats.totalPlanned}
          actual={weeklyStats.totalActual}
          compact
        />
      </PlannerHeader>

      {/* Week content */}
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
            const dayName = displayDate.toLocaleDateString(localeStr, {
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
