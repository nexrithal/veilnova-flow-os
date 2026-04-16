'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { TaskItem } from '@/lib/types'
import { TimeTimeline } from '@/components/planner/time-timeline'
import { ShiftSelector } from '@/components/planner/shift-selector'
import { CapacitySummary } from '@/components/planner/capacity-summary'
import { WorkLogEntry, QuickLogButton } from '@/components/planner/work-log-entry'
import { ScheduleModal } from '@/components/planner/schedule-modal'
import { PlannerHeader } from '@/components/planner/planner-header'
import {
  parseDate,
  formatDateLocal,
  getNextDay,
  getPrevDay,
  getScheduledBlocksForDate,
  getWorkLogsForDate,
  calculateAvailableHours,
  calculateWorkHours,
  getOverdueTasks,
  formatHours,
} from '@/lib/planner-logic'

export default function DayViewPage() {
  const t = useI18n()
  const items = useStore((s) => s.items)
  const selectedDate = useStore((s) => s.selectedDate)
  const setSelectedDate = useStore((s) => s.setSelectedDate)
  const shiftTemplates = useStore((s) => s.shiftTemplates)
  const dayShiftAssignments = useStore((s) => s.dayShiftAssignments)
  const assignShiftToDay = useStore((s) => s.assignShiftToDay)
  const dayOverrides = useStore((s) => s.dayOverrides)
  const getShiftForDate = useStore((s) => s.getShiftForDate)

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scheduleTime, setScheduleTime] = useState({ hour: 9, minute: 0 })
  const [showTaskPicker, setShowTaskPicker] = useState(false)

  const currentShift = getShiftForDate(selectedDate)
  const dateOverrides = dayOverrides.filter((o) => o.date === selectedDate)

  // Get scheduled blocks and work logs for the selected date
  const scheduledBlocks = useMemo(
    () => getScheduledBlocksForDate(items, selectedDate),
    [items, selectedDate]
  )
  const workLogs = useMemo(
    () => getWorkLogsForDate(items, selectedDate),
    [items, selectedDate]
  )

  // Calculate capacity (only free blocks count as available personal capacity)
  const availableHours = calculateAvailableHours(currentShift, dateOverrides)
  const workHours = calculateWorkHours(currentShift)
  const plannedHours = scheduledBlocks.reduce((sum, b) => sum + b.durationMinutes / 60, 0)
  const actualHours = workLogs.reduce((sum, l) => sum + l.durationMinutes / 60, 0)

  // Get active tasks for scheduling
  const activeTasks = items.filter((i) => i.status === 'active' || i.status === 'backlog')

  // Get overdue tasks
  const overdueTasks = getOverdueTasks(items, selectedDate)

  // Navigation
  const today = formatDateLocal(new Date())
  const goToToday = () => setSelectedDate(today)
  const goToPrev = () => setSelectedDate(getPrevDay(selectedDate))
  const goToNext = () => setSelectedDate(getNextDay(selectedDate))

  // Handle timeline click
  const handleTimeClick = (hour: number, minute: number) => {
    setScheduleTime({ hour, minute })
    setShowTaskPicker(true)
  }

  // Handle task selection for scheduling
  const handleTaskSelect = (task: TaskItem) => {
    setSelectedTask(task)
    setShowTaskPicker(false)
    setScheduleModalOpen(true)
  }

  // Format the selected date for display
  const displayDate = parseDate(selectedDate)
  const isToday = selectedDate === today
  const localeStr = t.locale === 'ru' ? 'ru-RU' : 'en-US'

  const dateTitle = displayDate.toLocaleDateString(localeStr, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const dateSubtitle = displayDate.toLocaleDateString(localeStr, { weekday: 'long' })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Unified header with view switcher */}
      <PlannerHeader
        title={dateTitle}
        subtitle={dateSubtitle}
        isCurrentPeriod={isToday}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        todayLabel={t.planner?.today || 'Today'}
      >
        <CapacitySummary
          available={availableHours}
          planned={plannedHours}
          actual={actualHours}
          compact
        />
      </PlannerHeader>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Timeline area */}
        <div className="flex-1 overflow-auto p-4">
          <TimeTimeline
            shift={currentShift}
            scheduledBlocks={scheduledBlocks}
            workLogs={workLogs}
            onTimeClick={handleTimeClick}
            onBlockClick={(block) => {
              setSelectedTask(block.task)
              setScheduleTime({ hour: block.startHour, minute: block.startMinute })
              setScheduleModalOpen(true)
            }}
          />
        </div>

        {/* Sidebar panel */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-card/50 overflow-auto">
          <div className="p-4 space-y-6">
            {/* Shift selection */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {t.planner?.shift || 'Shift'}
              </h3>
              <ShiftSelector
                shifts={shiftTemplates}
                selectedShiftId={dayShiftAssignments[selectedDate] || currentShift.id}
                onSelect={(shiftId) => assignShiftToDay(selectedDate, shiftId)}
              />
            </div>

            {/* Capacity summary - detailed */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {t.planner?.capacity || 'Capacity'}
              </h3>
              <CapacitySummary
                available={availableHours}
                planned={plannedHours}
                actual={actualHours}
              />
              {workHours > 0 && (
                <p className="text-[9px] text-muted-foreground">
                  +{workHours.toFixed(0)}h {t.planner?.workHours || 'work'}
                </p>
              )}
            </div>

            {/* Overdue warnings */}
            {overdueTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-medium text-destructive uppercase tracking-wider">
                  {t.planner?.overdue || 'Overdue'} ({overdueTasks.length})
                </h3>
                <div className="space-y-1">
                  {overdueTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="p-2 rounded bg-destructive/10 border border-destructive/30"
                    >
                      <p className="text-[11px] font-medium text-destructive truncate">
                        {task.title}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {t.planner?.deadline || 'Deadline'}: {task.deadline}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled tasks for today */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {t.planner?.scheduled || 'Scheduled'} ({scheduledBlocks.length})
              </h3>
              {scheduledBlocks.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t.planner?.noScheduled || 'No tasks scheduled. Click on timeline to add.'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {scheduledBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="p-2 rounded bg-neon/10 border border-neon/20 cursor-pointer hover:bg-neon/15 transition-colors"
                      onClick={() => {
                        setSelectedTask(block.task)
                        setScheduleTime({ hour: block.startHour, minute: block.startMinute })
                        setScheduleModalOpen(true)
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium truncate">{block.task.title}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {block.startHour.toString().padStart(2, '0')}:{block.startMinute.toString().padStart(2, '0')} - {formatHours(block.durationMinutes / 60)}
                          </p>
                        </div>
                        <QuickLogButton task={block.task} date={selectedDate} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick log for any active task */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {t.planner?.quickLog || 'Quick Log'}
              </h3>
              {activeTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t.planner?.noActiveTasks || 'No active tasks'}
                </p>
              ) : (
                <div className="space-y-2">
                  <select
                    className="w-full px-2 py-1.5 rounded text-xs bg-input border border-border focus:ring-1 focus:ring-neon"
                    value={selectedTask?.id || ''}
                    onChange={(e) => {
                      const task = items.find((i) => i.id === e.target.value)
                      setSelectedTask(task || null)
                    }}
                  >
                    <option value="">{t.planner?.selectTask || 'Select task...'}</option>
                    {activeTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                  {selectedTask && (
                    <WorkLogEntry
                      task={selectedTask}
                      date={selectedDate}
                      onComplete={() => {}}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task picker modal */}
      {showTaskPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowTaskPicker(false)} />
          <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-sm mx-4 p-4">
            <h3 className="text-sm font-bold mb-3">
              {t.planner?.selectTaskToSchedule || 'Select task to schedule'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {scheduleTime.hour.toString().padStart(2, '0')}:{scheduleTime.minute.toString().padStart(2, '0')}
            </p>
            <div className="max-h-64 overflow-auto space-y-1">
              {activeTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskSelect(task)}
                  className="w-full text-left p-2 rounded hover:bg-secondary transition-colors"
                >
                  <p className="text-xs font-medium truncate">{task.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {task.estimatedHours ? `${task.estimatedHours}h est.` : task.status}
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTaskPicker(false)}
              className="mt-3 w-full px-3 py-2 rounded text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false)
          setSelectedTask(null)
        }}
        task={selectedTask}
        date={selectedDate}
        initialHour={scheduleTime.hour}
        initialMinute={scheduleTime.minute}
        existingBlocks={scheduledBlocks}
      />
    </div>
  )
}
