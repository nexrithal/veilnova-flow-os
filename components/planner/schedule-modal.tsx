'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TaskItem, WorkMode, ScheduledBlock } from '@/lib/types'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { formatTime, formatDuration, hasConflict, getWorkModeWarning } from '@/lib/planner-logic'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  task: TaskItem | null
  date: string
  initialHour?: number
  initialMinute?: number
  existingBlocks: ScheduledBlock[]
}

const WORK_MODES: WorkMode[] = ['deep', 'standard', 'light', 'micro']

const WORK_MODE_LABELS: Record<WorkMode, string> = {
  deep: 'Deep',
  standard: 'Standard',
  light: 'Light',
  micro: 'Micro',
}

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180, 240]

export function ScheduleModal({
  isOpen,
  onClose,
  task,
  date,
  initialHour = 9,
  initialMinute = 0,
  existingBlocks,
}: ScheduleModalProps) {
  const t = useI18n()
  const scheduleTask = useStore((s) => s.scheduleTask)
  const getShiftForDate = useStore((s) => s.getShiftForDate)
  
  const [startHour, setStartHour] = useState(initialHour)
  const [startMinute, setStartMinute] = useState(initialMinute)
  const [duration, setDuration] = useState(60)
  const [workMode, setWorkMode] = useState<WorkMode>(task?.workMode || 'standard')
  const [error, setError] = useState<string | null>(null)

  // Reset when modal opens with new values
  useEffect(() => {
    if (isOpen) {
      setStartHour(initialHour)
      setStartMinute(initialMinute)
      setDuration(60)
      setWorkMode(task?.workMode || 'standard')
      setError(null)
    }
  }, [isOpen, initialHour, initialMinute, task])

  if (!isOpen || !task) return null

  const shift = getShiftForDate(date)

  // Find the availability level for the selected time
  const getAvailabilityAtTime = (hour: number, minute: number) => {
    const timeMinutes = hour * 60 + minute
    for (const block of shift.blocks) {
      const blockStart = block.startHour * 60 + block.startMinute
      const blockEnd = block.endHour * 60 + block.endMinute
      if (timeMinutes >= blockStart && timeMinutes < blockEnd) {
        return block.availabilityLevel
      }
    }
    return 'blocked'
  }

  const availability = getAvailabilityAtTime(startHour, startMinute)
  const warning = getWorkModeWarning(workMode, availability)

  const handleSchedule = () => {
    // Check for conflicts
    const conflict = hasConflict(
      { startHour, startMinute, durationMinutes: duration },
      existingBlocks
    )
    
    if (conflict) {
      setError(t.planner?.conflictError || 'Time slot conflicts with existing block')
      return
    }

    scheduleTask(task.id, {
      date,
      startHour,
      startMinute,
      durationMinutes: duration,
      workMode,
    })
    
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-5">
        <h2 className="text-sm font-bold mb-1">{t.planner?.scheduleTask || 'Schedule Task'}</h2>
        <p className="text-xs text-muted-foreground mb-4 truncate">{task.title}</p>

        {/* Time selection */}
        <div className="space-y-4">
          {/* Start time */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {t.planner?.startTime || 'Start Time'}
            </label>
            <div className="flex items-center gap-2">
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="px-2 py-1.5 rounded text-xs bg-input border border-border focus:ring-1 focus:ring-neon"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <span className="text-muted-foreground">:</span>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(Number(e.target.value))}
                className="px-2 py-1.5 rounded text-xs bg-input border border-border focus:ring-1 focus:ring-neon"
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground ml-2">
                {formatTime(startHour, startMinute)}
              </span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {t.planner?.duration || 'Duration'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    'px-2 py-1 rounded text-[10px] transition-colors',
                    duration === d
                      ? 'bg-neon/20 text-neon border border-neon/30'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {formatDuration(d)}
                </button>
              ))}
            </div>
          </div>

          {/* Work mode */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {t.planner?.workMode || 'Work Mode'}
            </label>
            <div className="flex gap-1.5">
              {WORK_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setWorkMode(mode)}
                  className={cn(
                    'px-3 py-1.5 rounded text-xs transition-colors flex-1',
                    workMode === mode
                      ? 'bg-neon/20 text-neon border border-neon/30'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t.planner?.workModes?.[mode as keyof typeof t.planner.workModes] || WORK_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          {warning && (
            <div className="p-2 rounded bg-chart-4/10 border border-chart-4/30">
              <p className="text-[11px] text-chart-4">{warning}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
              <p className="text-[11px] text-destructive">{error}</p>
            </div>
          )}

          {/* Preview */}
          <div className="p-3 rounded bg-secondary/50 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t.planner?.preview || 'Preview'}</span>
              <span className="font-medium">
                {formatTime(startHour, startMinute)} - {
                  formatTime(
                    Math.floor((startHour * 60 + startMinute + duration) / 60) % 24,
                    (startMinute + duration) % 60
                  )
                }
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {formatDuration(duration)} · {WORK_MODE_LABELS[workMode]}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSchedule}
            className="px-4 py-2 rounded text-xs font-medium bg-neon/20 text-neon hover:bg-neon/30 transition-colors"
          >
            {t.planner?.schedule || 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}
