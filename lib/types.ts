export type ItemType = 'infra' | 'bot' | 'mail' | '3d' | 'automation' | 'fun' | 'other'

export type ItemStatus = 'idea' | 'backlog' | 'active' | 'frozen' | 'done' | 'archived'

export type Horizon = 'week' | 'month' | 'quarter' | 'year'

// Planner types
export type WorkMode = 'deep' | 'standard' | 'light' | 'micro'
export type AvailabilityLevel = 'blocked' | 'low' | 'medium' | 'high'
export type ShiftType = 'day_shift' | 'night_shift' | 'off_day' | 'custom'
export type TimeBlockType = 'sleep' | 'work' | 'commute' | 'free' | 'dead'
export type CalendarView = 'day' | 'week' | 'month'

export interface LogEntry {
  id: string
  timestamp: string
  note: string
}

// Scheduled block of time for a task
export interface ScheduledBlock {
  id: string
  taskId: string
  date: string // ISO date string (YYYY-MM-DD)
  startHour: number // 0-23
  startMinute: number // 0-59
  durationMinutes: number
  workMode?: WorkMode
}

// Actual work log entry
export interface WorkLog {
  id: string
  taskId: string
  date: string
  startTime: string // ISO timestamp
  endTime: string // ISO timestamp
  durationMinutes: number
  note?: string
}

// Time block within a shift template
export interface TimeBlock {
  id: string
  type: TimeBlockType
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  label?: string
  availabilityLevel: AvailabilityLevel
}

// Shift template defines a typical day pattern
export interface ShiftTemplate {
  id: string
  name: string
  type: ShiftType
  blocks: TimeBlock[]
  totalWorkHours: number
}

// Override for a specific day
export interface DayOverride {
  id: string
  date: string // ISO date string
  overrideType: 'remove_sleep' | 'reduce_capacity' | 'mark_dead' | 'extend_work' | 'custom'
  description?: string
  affectedBlocks?: string[] // block IDs
  customBlocks?: TimeBlock[]
}

// Context for a specific day
export interface DayContext {
  date: string
  shiftTemplateId: string
  overrides: DayOverride[]
  scheduledBlocks: ScheduledBlock[]
  workLogs: WorkLog[]
  totalAvailableHours: number
  totalPlannedHours: number
  totalActualHours: number
}

export interface TaskItem {
  id: string
  title: string
  description: string
  type: ItemType
  status: ItemStatus
  personalValue: number
  systemImpact: number
  effort: number
  score: number
  horizon: Horizon
  createdAt: string
  updatedAt: string
  logs: LogEntry[]
  notDoing?: boolean
  // Planner fields
  plannedStart?: string // ISO date
  plannedEnd?: string // ISO date
  deadline?: string // ISO date
  estimatedHours?: number
  remainingHours?: number
  actualHours?: number
  workMode?: WorkMode
  scheduledBlocks?: ScheduledBlock[]
  workLogs?: WorkLog[]
  calendarSource?: 'internal' | 'external'
}

export const WIP_LIMIT = 4

export const TYPE_LABELS: Record<ItemType, string> = {
  infra: 'Infra',
  bot: 'Bot',
  mail: 'Mail',
  '3d': '3D',
  automation: 'Auto',
  fun: 'Fun',
  other: 'Other',
}

export const STATUS_LABELS: Record<ItemStatus, string> = {
  idea: 'Idea',
  backlog: 'Backlog',
  active: 'Active',
  frozen: 'Frozen',
  done: 'Done',
  archived: 'Archived',
}

export const HORIZON_LABELS: Record<Horizon, string> = {
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
}

export function calcScore(personalValue: number, systemImpact: number, effort: number): number {
  return personalValue + systemImpact - effort
}
