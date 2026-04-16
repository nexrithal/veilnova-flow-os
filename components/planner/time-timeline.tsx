'use client'

import { cn } from '@/lib/utils'
import { 
  ShiftTemplate, TimeBlock, ScheduledBlock, WorkLog, TaskItem 
} from '@/lib/types'
import { 
  formatTime, getTimeBlockColor, formatDuration 
} from '@/lib/planner-logic'
import { useI18n } from '@/hooks/use-i18n'

interface TimelineProps {
  shift: ShiftTemplate
  scheduledBlocks: (ScheduledBlock & { task: TaskItem })[]
  workLogs: (WorkLog & { task: TaskItem })[]
  onTimeClick?: (hour: number, minute: number) => void
  onBlockClick?: (block: ScheduledBlock & { task: TaskItem }) => void
  className?: string
}

const HOUR_HEIGHT = 48 // pixels per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function TimeTimeline({ 
  shift, 
  scheduledBlocks, 
  workLogs,
  onTimeClick, 
  onBlockClick,
  className 
}: TimelineProps) {
  const t = useI18n()

  // Convert time to pixel position
  const timeToPosition = (hour: number, minute: number) => {
    return (hour + minute / 60) * HOUR_HEIGHT
  }

  // Convert block to positioned element
  const getBlockStyle = (startHour: number, startMinute: number, durationMinutes: number) => {
    const top = timeToPosition(startHour, startMinute)
    const height = (durationMinutes / 60) * HOUR_HEIGHT
    return { top: `${top}px`, height: `${Math.max(height, 20)}px` }
  }

  const handleTimeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onTimeClick) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const totalMinutes = Math.floor((y / HOUR_HEIGHT) * 60)
    const hour = Math.floor(totalMinutes / 60)
    const minute = Math.round((totalMinutes % 60) / 15) * 15 // snap to 15min
    onTimeClick(Math.min(23, Math.max(0, hour)), minute % 60)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Time labels column */}
      <div className="absolute left-0 top-0 w-12 z-10">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="h-12 flex items-start justify-end pr-2 text-[10px] text-muted-foreground tabular-nums"
          >
            {formatTime(hour, 0)}
          </div>
        ))}
      </div>

      {/* Timeline content */}
      <div 
        className="ml-12 relative border-l border-border"
        style={{ height: `${24 * HOUR_HEIGHT}px` }}
        onClick={handleTimeClick}
      >
        {/* Hour grid lines */}
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-border/50"
            style={{ top: `${hour * HOUR_HEIGHT}px` }}
          />
        ))}

        {/* Shift blocks (background) */}
        {shift.blocks.map((block) => (
          <div
            key={block.id}
            className={cn(
              'absolute left-0 right-0 border-l-2',
              getTimeBlockColor(block.type),
              block.type === 'work' ? 'border-l-neon/50' : 
              block.type === 'sleep' ? 'border-l-muted-foreground/30' :
              block.type === 'commute' ? 'border-l-chart-4/50' : 'border-l-chart-2/50'
            )}
            style={getBlockStyle(block.startHour, block.startMinute, 
              (block.endHour - block.startHour) * 60 + (block.endMinute - block.startMinute)
            )}
          >
            {block.label && (
              <span className="absolute left-2 top-1 text-[10px] text-muted-foreground truncate max-w-[calc(100%-1rem)]">
                {block.label}
              </span>
            )}
          </div>
        ))}

        {/* Scheduled task blocks */}
        {scheduledBlocks.map((block) => (
          <div
            key={block.id}
            className={cn(
              'absolute left-2 right-2 rounded border border-neon/40 bg-neon/20',
              'cursor-pointer hover:bg-neon/30 transition-colors',
              'flex flex-col p-1.5 overflow-hidden'
            )}
            style={getBlockStyle(block.startHour, block.startMinute, block.durationMinutes)}
            onClick={(e) => {
              e.stopPropagation()
              onBlockClick?.(block)
            }}
          >
            <span className="text-[11px] font-medium text-foreground truncate">
              {block.task.title}
            </span>
            <span className="text-[9px] text-muted-foreground">
              {formatTime(block.startHour, block.startMinute)} - {formatDuration(block.durationMinutes)}
            </span>
          </div>
        ))}

        {/* Work logs (actual work done) */}
        {workLogs.map((log) => {
          const start = new Date(log.startTime)
          return (
            <div
              key={log.id}
              className={cn(
                'absolute left-1 right-1 rounded-sm border border-chart-2/40 bg-chart-2/20',
                'flex flex-col p-1 overflow-hidden pointer-events-none'
              )}
              style={getBlockStyle(start.getHours(), start.getMinutes(), log.durationMinutes)}
            >
              <span className="text-[10px] font-medium text-chart-2 truncate">
                {log.task.title}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {t.planner?.logged || 'Logged'}: {formatDuration(log.durationMinutes)}
              </span>
            </div>
          )
        })}

        {/* Current time indicator */}
        <CurrentTimeIndicator />
      </div>
    </div>
  )
}

function CurrentTimeIndicator() {
  const now = new Date()
  const top = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="relative flex items-center">
        <div className="w-2 h-2 rounded-full bg-destructive" />
        <div className="flex-1 h-px bg-destructive" />
      </div>
    </div>
  )
}
