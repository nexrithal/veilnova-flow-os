'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TaskItem, ItemStatus, ItemType, Horizon, LogEntry, calcScore } from './types'
import { Locale } from './i18n'

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
