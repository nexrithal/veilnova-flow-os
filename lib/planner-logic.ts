import { 
  ShiftTemplate, TimeBlock, ScheduledBlock, WorkLog, DayOverride,
  AvailabilityLevel, WorkMode, TaskItem 
} from './types'

// Helper to format time
export function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

// Parse ISO date to Date object (local time)
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Format date as YYYY-MM-DD using LOCAL time (not UTC)
// This avoids timezone bugs where toISOString() would shift dates
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Alias for backward compatibility
export const formatDateISO = formatDateLocal

// Get array of dates for a week starting from given date
export function getWeekDates(startDate: string): string[] {
  const start = parseDate(startDate)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(formatDateISO(d))
  }
  return dates
}

// Get array of dates for a month
export function getMonthDates(year: number, month: number): string[] {
  const dates: string[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(formatDateISO(new Date(d)))
  }
  return dates
}

// Get start of week (Monday)
export function getWeekStart(date: string): string {
  const d = parseDate(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return formatDateISO(d)
}

// Calculate block duration in minutes
export function getBlockDuration(block: TimeBlock): number {
  const startMinutes = block.startHour * 60 + block.startMinute
  const endMinutes = block.endHour * 60 + block.endMinute
  return endMinutes - startMinutes
}

// Calculate available hours from shift template
// IMPORTANT: Only 'free' blocks count as available personal capacity
// 'work' blocks are external job time, NOT available for personal tasks
export function calculateAvailableHours(shift: ShiftTemplate, overrides: DayOverride[] = []): number {
  let totalMinutes = 0
  
  for (const block of shift.blocks) {
    // Only count FREE blocks as usable personal capacity
    // Work blocks are external job time, not personal task time
    if (block.type === 'free' && block.availabilityLevel !== 'blocked') {
      totalMinutes += getBlockDuration(block)
    }
  }
  
  // Apply overrides
  for (const override of overrides) {
    if (override.overrideType === 'reduce_capacity') {
      totalMinutes = Math.floor(totalMinutes * 0.5)
    } else if (override.overrideType === 'remove_sleep') {
      // Add back some hours from recovery
      totalMinutes += 120
    } else if (override.overrideType === 'extend_work') {
      // Extended free time on this day
      totalMinutes += 60
    }
  }
  
  return totalMinutes / 60
}

// Calculate total work hours (external job, not personal tasks)
export function calculateWorkHours(shift: ShiftTemplate): number {
  let totalMinutes = 0
  for (const block of shift.blocks) {
    if (block.type === 'work') {
      totalMinutes += getBlockDuration(block)
    }
  }
  return totalMinutes / 60
}

// Calculate total planned hours for a day
export function calculatePlannedHours(scheduledBlocks: ScheduledBlock[]): number {
  return scheduledBlocks.reduce((sum, block) => sum + block.durationMinutes / 60, 0)
}

// Calculate total actual hours for a day
export function calculateActualHours(workLogs: WorkLog[]): number {
  return workLogs.reduce((sum, log) => sum + log.durationMinutes / 60, 0)
}

// Get capacity status
export type CapacityStatus = 'free' | 'light' | 'normal' | 'busy' | 'overloaded'

export function getCapacityStatus(planned: number, available: number): CapacityStatus {
  if (available === 0) return 'free'
  const ratio = planned / available
  if (ratio < 0.25) return 'free'
  if (ratio < 0.5) return 'light'
  if (ratio < 0.75) return 'normal'
  if (ratio <= 1) return 'busy'
  return 'overloaded'
}

// Get color for capacity status
export function getCapacityColor(status: CapacityStatus): string {
  switch (status) {
    case 'free': return 'text-muted-foreground'
    case 'light': return 'text-chart-2'
    case 'normal': return 'text-neon'
    case 'busy': return 'text-chart-4'
    case 'overloaded': return 'text-destructive'
  }
}

// Get background color for capacity status
export function getCapacityBgColor(status: CapacityStatus): string {
  switch (status) {
    case 'free': return 'bg-muted/30'
    case 'light': return 'bg-chart-2/20'
    case 'normal': return 'bg-neon/20'
    case 'busy': return 'bg-chart-4/20'
    case 'overloaded': return 'bg-destructive/20'
  }
}

// Get color for availability level
export function getAvailabilityColor(level: AvailabilityLevel): string {
  switch (level) {
    case 'blocked': return 'bg-muted/50'
    case 'low': return 'bg-chart-4/30'
    case 'medium': return 'bg-chart-2/30'
    case 'high': return 'bg-neon/30'
  }
}

// Get color for time block type
export function getTimeBlockColor(type: TimeBlock['type']): string {
  switch (type) {
    case 'sleep': return 'bg-muted/60'
    case 'work': return 'bg-neon/20'
    case 'commute': return 'bg-chart-4/30'
    case 'free': return 'bg-chart-2/20'
    case 'dead': return 'bg-destructive/20'
  }
}

// Check if work mode is compatible with availability level
// Returns true if allowed (may still have warnings)
export function isWorkModeCompatible(workMode: WorkMode, availability: AvailabilityLevel): boolean {
  // Only block if the slot is completely blocked (sleep, etc.)
  if (availability === 'blocked') return false
  // Allow all work modes in all other slots - use warnings instead of blocking
  return true
}

// Get work mode warning (recommendations, not hard blocks)
export function getWorkModeWarning(workMode: WorkMode, availability: AvailabilityLevel): string | null {
  if (availability === 'blocked') return 'This time slot is blocked'
  if (workMode === 'deep' && availability !== 'high') {
    return 'Deep work works best in high-availability windows'
  }
  if (workMode === 'standard' && availability === 'low') {
    return 'Consider light/micro work in low-availability slots'
  }
  return null
}

// Check for scheduling conflicts
export function hasConflict(
  newBlock: { startHour: number; startMinute: number; durationMinutes: number },
  existingBlocks: ScheduledBlock[]
): ScheduledBlock | null {
  const newStart = newBlock.startHour * 60 + newBlock.startMinute
  const newEnd = newStart + newBlock.durationMinutes

  for (const block of existingBlocks) {
    const blockStart = block.startHour * 60 + block.startMinute
    const blockEnd = blockStart + block.durationMinutes
    
    if (newStart < blockEnd && newEnd > blockStart) {
      return block
    }
  }
  return null
}

// Get tasks scheduled for a specific date
export function getTasksForDate(tasks: TaskItem[], date: string): TaskItem[] {
  return tasks.filter((task) => {
    if (task.scheduledBlocks?.some((b) => b.date === date)) return true
    if (task.workLogs?.some((l) => l.date === date)) return true
    return false
  })
}

// Get scheduled blocks for a specific date
export function getScheduledBlocksForDate(tasks: TaskItem[], date: string): (ScheduledBlock & { task: TaskItem })[] {
  const blocks: (ScheduledBlock & { task: TaskItem })[] = []
  
  for (const task of tasks) {
    if (task.scheduledBlocks) {
      for (const block of task.scheduledBlocks) {
        if (block.date === date) {
          blocks.push({ ...block, task })
        }
      }
    }
  }
  
  return blocks.sort((a, b) => {
    const aTime = a.startHour * 60 + a.startMinute
    const bTime = b.startHour * 60 + b.startMinute
    return aTime - bTime
  })
}

// Get work logs for a specific date
export function getWorkLogsForDate(tasks: TaskItem[], date: string): (WorkLog & { task: TaskItem })[] {
  const logs: (WorkLog & { task: TaskItem })[] = []
  
  for (const task of tasks) {
    if (task.workLogs) {
      for (const log of task.workLogs) {
        if (log.date === date) {
          logs.push({ ...log, task })
        }
      }
    }
  }
  
  return logs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

// Get tasks with deadlines in range
export function getTasksWithDeadlines(tasks: TaskItem[], startDate: string, endDate: string): TaskItem[] {
  return tasks.filter((task) => {
    if (!task.deadline) return false
    return task.deadline >= startDate && task.deadline <= endDate
  })
}

// Calculate remaining hours for a task
export function calculateRemainingHours(task: TaskItem): number {
  const estimated = task.estimatedHours || 0
  const actual = task.actualHours || 0
  const planned = (task.scheduledBlocks || []).reduce((sum, b) => sum + b.durationMinutes / 60, 0)
  return Math.max(0, estimated - actual - planned)
}

// Get overdue tasks
export function getOverdueTasks(tasks: TaskItem[], currentDate: string): TaskItem[] {
  return tasks.filter((task) => {
    if (task.status === 'done' || task.status === 'archived') return false
    if (!task.deadline) return false
    return task.deadline < currentDate
  })
}

// Navigation helpers
export function getNextDay(date: string): string {
  const d = parseDate(date)
  d.setDate(d.getDate() + 1)
  return formatDateISO(d)
}

export function getPrevDay(date: string): string {
  const d = parseDate(date)
  d.setDate(d.getDate() - 1)
  return formatDateISO(d)
}

export function getNextWeek(date: string): string {
  const d = parseDate(date)
  d.setDate(d.getDate() + 7)
  return formatDateISO(d)
}

export function getPrevWeek(date: string): string {
  const d = parseDate(date)
  d.setDate(d.getDate() - 7)
  return formatDateISO(d)
}

export function getNextMonth(date: string): string {
  const d = parseDate(date)
  d.setMonth(d.getMonth() + 1)
  return formatDateISO(d)
}

export function getPrevMonth(date: string): string {
  const d = parseDate(date)
  d.setMonth(d.getMonth() - 1)
  return formatDateISO(d)
}

// Format duration for display
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

// Format hours for display
export function formatHours(hours: number): string {
  if (hours === 0) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
