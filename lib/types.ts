export type ItemType = 'infra' | 'bot' | 'mail' | '3d' | 'automation' | 'fun' | 'other'

export type ItemStatus = 'idea' | 'backlog' | 'active' | 'frozen' | 'done' | 'archived'

export type Horizon = 'week' | 'month' | 'quarter' | 'year'

export interface LogEntry {
  id: string
  timestamp: string
  note: string
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
