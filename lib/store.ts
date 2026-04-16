'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  TaskItem, ItemStatus, ItemType, Horizon, LogEntry, calcScore,
  ShiftTemplate, ShiftType, DayOverride, ScheduledBlock, WorkLog,
  TimeBlock, CalendarView, WorkMode
} from './types'
import { Locale } from './i18n'

// Helper to format date as YYYY-MM-DD using LOCAL time (not UTC)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Default shift templates with realistic patterns
// Key principle: 'work' blocks = external job (NOT personal task capacity)
//               'free' blocks = personal task capacity
//               'dead' blocks = prep, commute, transitions (not usable)
//               'sleep' blocks = blocked
const DEFAULT_SHIFT_TEMPLATES: ShiftTemplate[] = [
  {
    id: 'day_shift',
    name: 'Day Shift',
    type: 'day_shift',
    totalWorkHours: 11, // 07:00-18:00 main work
    blocks: [
      { id: 'ds-sleep', type: 'sleep', startHour: 0, startMinute: 0, endHour: 5, endMinute: 0, availabilityLevel: 'blocked' },
      { id: 'ds-dead1', type: 'dead', startHour: 5, startMinute: 0, endHour: 7, endMinute: 0, label: 'Morning prep', availabilityLevel: 'blocked' },
      { id: 'ds-work', type: 'work', startHour: 7, startMinute: 0, endHour: 18, endMinute: 0, label: 'Work shift', availabilityLevel: 'high' },
      { id: 'ds-dead2', type: 'dead', startHour: 18, startMinute: 0, endHour: 19, endMinute: 0, label: 'Commute/transition', availabilityLevel: 'blocked' },
      { id: 'ds-evening', type: 'free', startHour: 19, startMinute: 0, endHour: 23, endMinute: 0, label: 'Evening free', availabilityLevel: 'medium' },
      { id: 'ds-sleep2', type: 'sleep', startHour: 23, startMinute: 0, endHour: 24, endMinute: 0, availabilityLevel: 'blocked' },
    ],
  },
  {
    id: 'night_shift',
    name: 'Night Shift',
    type: 'night_shift',
    totalWorkHours: 10, // 18:00-04:00 work (displayed as 18-24 + next day continuation)
    blocks: [
      // Night shift: sleep during day, work in evening/night
      { id: 'ns-work-cont', type: 'work', startHour: 0, startMinute: 0, endHour: 4, endMinute: 0, label: 'Night work (cont)', availabilityLevel: 'high' },
      { id: 'ns-dead1', type: 'dead', startHour: 4, startMinute: 0, endHour: 5, endMinute: 0, label: 'Wind down', availabilityLevel: 'blocked' },
      { id: 'ns-sleep', type: 'sleep', startHour: 5, startMinute: 0, endHour: 14, endMinute: 0, label: 'Sleep', availabilityLevel: 'blocked' },
      { id: 'ns-free', type: 'free', startHour: 14, startMinute: 0, endHour: 16, endMinute: 0, label: 'Afternoon free', availabilityLevel: 'medium' },
      { id: 'ns-dead2', type: 'dead', startHour: 16, startMinute: 0, endHour: 18, endMinute: 0, label: 'Prep/commute', availabilityLevel: 'blocked' },
      { id: 'ns-work', type: 'work', startHour: 18, startMinute: 0, endHour: 24, endMinute: 0, label: 'Night work', availabilityLevel: 'high' },
    ],
  },
  {
    id: 'off_day',
    name: 'Off Day',
    type: 'off_day',
    totalWorkHours: 0, // No external work
    blocks: [
      { id: 'od-sleep', type: 'sleep', startHour: 0, startMinute: 0, endHour: 8, endMinute: 0, availabilityLevel: 'blocked' },
      { id: 'od-morning', type: 'free', startHour: 8, startMinute: 0, endHour: 9, endMinute: 0, label: 'Soft wake', availabilityLevel: 'low' },
      { id: 'od-free', type: 'free', startHour: 9, startMinute: 0, endHour: 20, endMinute: 0, label: 'Free day', availabilityLevel: 'high' },
      { id: 'od-evening', type: 'free', startHour: 20, startMinute: 0, endHour: 23, endMinute: 0, label: 'Evening wind-down', availabilityLevel: 'low' },
      { id: 'od-sleep2', type: 'sleep', startHour: 23, startMinute: 0, endHour: 24, endMinute: 0, availabilityLevel: 'blocked' },
    ],
  },
]

const SEED_ITEMS: TaskItem[] = [
  {
    id: '1',
    title: 'K8s cluster autoscaler tuning',
    description: 'Optimize HPA and VPA configs for prod workloads to reduce wasted compute',
    type: 'infra',
    status: 'active',
    personalValue: 8,
    systemImpact: 9,
    effort: 6,
    score: 11,
    horizon: 'week',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    logs: [{ id: 'l1', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Started tuning HPA thresholds, 20% improvement so far' }],
  },
  {
    id: '2',
    title: 'Telegram bot for server alerts',
    description: 'Route Prometheus alerts to a personal Telegram bot with smart grouping',
    type: 'bot',
    status: 'active',
    personalValue: 9,
    systemImpact: 8,
    effort: 4,
    score: 13,
    horizon: 'week',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    logs: [],
  },
  {
    id: '3',
    title: 'Email pipeline deduplication',
    description: 'Remove duplicate processing in the mail ingestion queue, causing 2x load',
    type: 'mail',
    status: 'active',
    personalValue: 7,
    systemImpact: 9,
    effort: 5,
    score: 11,
    horizon: 'month',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    logs: [{ id: 'l2', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Identified root cause in consumer group logic' }],
  },
  {
    id: '4',
    title: '3D portfolio scene — WebGL',
    description: 'Build an interactive 3D scene showcasing past projects using Three.js',
    type: '3d',
    status: 'backlog',
    personalValue: 9,
    systemImpact: 3,
    effort: 8,
    score: 4,
    horizon: 'quarter',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    logs: [],
  },
  {
    id: '5',
    title: 'CI pipeline cache optimization',
    description: 'Layer Docker builds and cache npm installs to cut build times by ~50%',
    type: 'automation',
    status: 'backlog',
    personalValue: 7,
    systemImpact: 8,
    effort: 5,
    score: 10,
    horizon: 'month',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    logs: [],
  },
  {
    id: '6',
    title: 'Terminal snake game in Rust',
    description: 'Weekend fun project — TUI snake game using ratatui',
    type: 'fun',
    status: 'backlog',
    personalValue: 6,
    systemImpact: 1,
    effort: 3,
    score: 4,
    horizon: 'month',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    logs: [],
    notDoing: false,
  },
  {
    id: '7',
    title: 'Automated dependency updates bot',
    description: 'GitHub Action to auto-PR patch-level dep updates with changelogs',
    type: 'automation',
    status: 'idea',
    personalValue: 8,
    systemImpact: 7,
    effort: 4,
    score: 11,
    horizon: 'month',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    logs: [],
  },
  {
    id: '8',
    title: 'Self-hosted LLM playground',
    description: 'Spin up Ollama + Open WebUI on local GPU box, benchmark models',
    type: 'infra',
    status: 'idea',
    personalValue: 10,
    systemImpact: 6,
    effort: 5,
    score: 11,
    horizon: 'quarter',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    logs: [],
  },
  {
    id: '9',
    title: 'DB backup verification cron',
    description: 'Weekly cron that restores latest backup to staging and runs smoke tests',
    type: 'automation',
    status: 'done',
    personalValue: 9,
    systemImpact: 10,
    effort: 6,
    score: 13,
    horizon: 'week',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    logs: [{ id: 'l3', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), note: 'Deployed and verified. Runs every Sunday 02:00 UTC' }],
  },
  {
    id: '10',
    title: 'Mail newsletter scraper',
    description: 'Parse and archive tech newsletters into a local searchable DB',
    type: 'mail',
    status: 'frozen',
    personalValue: 6,
    systemImpact: 4,
    effort: 7,
    score: 3,
    horizon: 'quarter',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    logs: [{ id: 'l4', timestamp: new Date(Date.now() - 86400000 * 12).toISOString(), note: 'Blocked on parsing edge cases — deprioritized' }],
  },
]

interface StoreState {
  items: TaskItem[]
  addItem: (item: Omit<TaskItem, 'id' | 'score' | 'createdAt' | 'updatedAt' | 'logs'>) => void
  updateItem: (id: string, updates: Partial<TaskItem>) => void
  deleteItem: (id: string) => void
  moveItem: (id: string, newStatus: ItemStatus) => void
  addLog: (id: string, note: string) => void
  wipLimit: number
  setWipLimit: (limit: number) => void
  locale: Locale
  setLocale: (locale: Locale) => void
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
  
  // Planner state
  selectedDate: string // ISO date (YYYY-MM-DD)
  calendarView: CalendarView
  shiftTemplates: ShiftTemplate[]
  dayShiftAssignments: Record<string, string> // date -> shiftTemplateId
  dayOverrides: DayOverride[]
  
  // Planner methods
  setSelectedDate: (date: string) => void
  setCalendarView: (view: CalendarView) => void
  updateShiftTemplate: (template: ShiftTemplate) => void
  assignShiftToDay: (date: string, shiftTemplateId: string) => void
  addDayOverride: (override: Omit<DayOverride, 'id'>) => void
  removeDayOverride: (id: string) => void
  scheduleTask: (taskId: string, block: Omit<ScheduledBlock, 'id' | 'taskId'>) => void
  removeScheduledBlock: (taskId: string, blockId: string) => void
  logWork: (taskId: string, log: Omit<WorkLog, 'id' | 'taskId'>) => void
  getShiftForDate: (date: string) => ShiftTemplate
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      items: SEED_ITEMS,
      wipLimit: 4,
      locale: 'en' as Locale,
      setLocale: (locale) => set({ locale }),
      theme: 'dark' as 'dark' | 'light',
      setTheme: (theme) => set({ theme }),
      
      // Planner initial state
      selectedDate: formatDateLocal(new Date()),
      calendarView: 'day' as CalendarView,
      shiftTemplates: DEFAULT_SHIFT_TEMPLATES,
      dayShiftAssignments: {},
      dayOverrides: [],
      
      // Planner methods
      setSelectedDate: (date) => set({ selectedDate: date }),
      setCalendarView: (view) => set({ calendarView: view }),
      
      updateShiftTemplate: (template) =>
        set((state) => ({
          shiftTemplates: state.shiftTemplates.map((t) =>
            t.id === template.id ? template : t
          ),
        })),
      
      assignShiftToDay: (date, shiftTemplateId) =>
        set((state) => ({
          dayShiftAssignments: { ...state.dayShiftAssignments, [date]: shiftTemplateId },
        })),
      
      addDayOverride: (override) =>
        set((state) => ({
          dayOverrides: [
            ...state.dayOverrides,
            { ...override, id: crypto.randomUUID() },
          ],
        })),
      
      removeDayOverride: (id) =>
        set((state) => ({
          dayOverrides: state.dayOverrides.filter((o) => o.id !== id),
        })),
      
      scheduleTask: (taskId, block) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== taskId) return item
            const newBlock: ScheduledBlock = {
              ...block,
              id: crypto.randomUUID(),
              taskId,
            }
            const scheduledBlocks = [...(item.scheduledBlocks || []), newBlock]
            const totalPlanned = scheduledBlocks.reduce((sum, b) => sum + b.durationMinutes / 60, 0)
            return {
              ...item,
              scheduledBlocks,
              remainingHours: (item.estimatedHours || 0) - totalPlanned - (item.actualHours || 0),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),
      
      removeScheduledBlock: (taskId, blockId) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== taskId) return item
            const scheduledBlocks = (item.scheduledBlocks || []).filter((b) => b.id !== blockId)
            const totalPlanned = scheduledBlocks.reduce((sum, b) => sum + b.durationMinutes / 60, 0)
            return {
              ...item,
              scheduledBlocks,
              remainingHours: (item.estimatedHours || 0) - totalPlanned - (item.actualHours || 0),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),
      
      logWork: (taskId, log) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== taskId) return item
            const newLog: WorkLog = {
              ...log,
              id: crypto.randomUUID(),
              taskId,
            }
            const workLogs = [...(item.workLogs || []), newLog]
            const totalActual = workLogs.reduce((sum, l) => sum + l.durationMinutes / 60, 0)
            const totalPlanned = (item.scheduledBlocks || []).reduce((sum, b) => sum + b.durationMinutes / 60, 0)
            return {
              ...item,
              workLogs,
              actualHours: totalActual,
              remainingHours: (item.estimatedHours || 0) - totalPlanned - totalActual,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),
      
      getShiftForDate: (date) => {
        const state = useStore.getState()
        const assignedShiftId = state.dayShiftAssignments[date]
        if (assignedShiftId) {
          const shift = state.shiftTemplates.find((t) => t.id === assignedShiftId)
          if (shift) return shift
        }
        // Default: weekdays = day_shift, weekends = off_day
        const dayOfWeek = new Date(date).getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const defaultShiftId = isWeekend ? 'off_day' : 'day_shift'
        return state.shiftTemplates.find((t) => t.id === defaultShiftId) || state.shiftTemplates[0]
      },
      addItem: (itemData) =>
        set((state) => {
          const score = calcScore(itemData.personalValue, itemData.systemImpact, itemData.effort)
          const newItem: TaskItem = {
            ...itemData,
            id: crypto.randomUUID(),
            score,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            logs: [],
          }
          return { items: [newItem, ...state.items] }
        }),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item
            const merged = { ...item, ...updates, updatedAt: new Date().toISOString() }
            merged.score = calcScore(merged.personalValue, merged.systemImpact, merged.effort)
            return merged
          }),
        })),
      deleteItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      moveItem: (id, newStatus) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, status: newStatus, updatedAt: new Date().toISOString() } : item
          ),
        })),
      addLog: (id, note) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  updatedAt: new Date().toISOString(),
                  logs: [
                    ...item.logs,
                    { id: crypto.randomUUID(), timestamp: new Date().toISOString(), note },
                  ],
                }
              : item
          ),
        })),
      setWipLimit: (limit) => set({ wipLimit: limit }),
    }),
    { name: 'flowos-store' }
  )
)
