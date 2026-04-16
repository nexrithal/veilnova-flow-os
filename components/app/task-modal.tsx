'use client'

import { useState } from 'react'
import { TaskItem, ItemType, ItemStatus, Horizon, calcScore } from '@/lib/types'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'

interface TaskModalProps {
  item?: TaskItem | null
  defaultStatus?: ItemStatus
  initialTitle?: string
  onClose: () => void
}

const TYPES: ItemType[] = ['infra', 'bot', 'mail', '3d', 'automation', 'fun', 'other']
const STATUSES: ItemStatus[] = ['idea', 'backlog', 'active', 'frozen', 'done', 'archived']
const HORIZONS: Horizon[] = ['week', 'month', 'quarter', 'year']

export function TaskModal({ item, defaultStatus = 'idea', initialTitle = '', onClose }: TaskModalProps) {
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)
  const deleteItem = useStore((s) => s.deleteItem)
  const addLog = useStore((s) => s.addLog)
  const wipLimit = useStore((s) => s.wipLimit)
  const items = useStore((s) => s.items)
  const t = useI18n()

  const activeCount = items.filter((i) => i.status === 'active').length
  const isEditing = !!item

  const [title, setTitle] = useState(item?.title ?? initialTitle ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [type, setType] = useState<ItemType>(item?.type ?? 'other')
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? defaultStatus)
  const [personalValue, setPersonalValue] = useState(item?.personalValue ?? 5)
  const [systemImpact, setSystemImpact] = useState(item?.systemImpact ?? 5)
  const [effort, setEffort] = useState(item?.effort ?? 5)
  const [horizon, setHorizon] = useState<Horizon>(item?.horizon ?? 'month')
  const [notDoing, setNotDoing] = useState(item?.notDoing ?? false)
  const [logNote, setLogNote] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'logs'>('details')

  const score = calcScore(personalValue, systemImpact, effort)

  const scoreColor =
    score >= 12
      ? 'text-[oklch(0.82_0.15_192)]'
      : score >= 8
        ? 'text-[oklch(0.75_0.16_162)]'
        : score >= 4
          ? 'text-[oklch(0.72_0.14_80)]'
          : 'text-muted-foreground'

  const willExceedWip =
    status === 'active' && item?.status !== 'active' && activeCount >= wipLimit

  function handleSave() {
    if (!title.trim()) return
    if (isEditing && item) {
      updateItem(item.id, { title, description, type, status, personalValue, systemImpact, effort, horizon, notDoing })
    } else {
      addItem({ title, description, type, status, personalValue, systemImpact, effort, horizon, notDoing })
    }
    onClose()
  }

  function handleAddLog() {
    if (!logNote.trim() || !item) return
    addLog(item.id, logNote.trim())
    setLogNote('')
  }

  function handleDelete() {
    if (!item) return
    if (confirm(t.modal.deleteConfirm)) {
      deleteItem(item.id)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-border gap-3">
          <h2 className="text-sm font-semibold text-foreground truncate">
            {isEditing ? t.modal.editTask : t.modal.newTask}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('text-base md:text-lg font-bold tabular-nums', scoreColor)}>
              {score > 0 ? '+' : ''}{score}
            </span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
          </div>
        </div>

        {/* Tabs (only for existing items) */}
        {isEditing && (
          <div className="flex border-b border-border">
            {(['details', 'logs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-5 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab
                    ? 'border-neon text-neon'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'details' ? t.common.details : t.modal.logsTab(item?.logs.length ?? 0)}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-4 md:p-5 space-y-4">
          {activeTab === 'details' ? (
            <>
              {/* Title */}
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
                  {t.modal.titleLabel}
                </label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.modal.titlePlaceholder}
                  className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
                  {t.modal.descriptionLabel}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.modal.descriptionPlaceholder}
                  rows={2}
                  className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/20 resize-none"
                />
              </div>

              {/* Type + Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    {t.modal.typeLabel}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ItemType)}
                    className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon/50"
                  >
                    {TYPES.map((tp) => <option key={tp} value={tp}>{t.type[tp]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    {t.modal.statusLabel}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ItemStatus)}
                    className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon/50"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
                  </select>
                </div>
              </div>

              {willExceedWip && (
                <div className="text-xs text-[oklch(0.72_0.14_80)] border border-[oklch(0.72_0.14_80)/30] bg-[oklch(0.72_0.14_80)/8] rounded px-3 py-2">
                  {t.modal.wipWarning(wipLimit)}
                </div>
              )}

              {/* Horizon - Responsive: flex on desktop, 2x2 grid on mobile */}
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">
                  {t.modal.horizonLabel}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {HORIZONS.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHorizon(h)}
                      className={cn(
                        'py-1.5 px-2 text-xs rounded border transition-colors text-center',
                        horizon === h
                          ? 'border-neon/60 text-neon bg-neon/10'
                          : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                      )}
                    >
                      {t.horizon[h]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scoring */}
              <div className="border border-border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-widest">{t.modal.scoringLabel}</span>
                  <span className={cn('text-sm font-bold tabular-nums', scoreColor)}>
                    = {score > 0 ? '+' : ''}{score}
                  </span>
                </div>
                {[
                  { label: t.modal.personalValue, value: personalValue, set: setPersonalValue, color: 'oklch(0.82 0.15 192)' },
                  { label: t.modal.systemImpact, value: systemImpact, set: setSystemImpact, color: 'oklch(0.75 0.16 162)' },
                  { label: t.modal.effortCost, value: effort, set: setEffort, color: 'oklch(0.70 0.14 80)' },
                ].map(({ label, value, set, color }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{value}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={value}
                      onChange={(e) => set(Number(e.target.value))}
                      className="w-full h-1 rounded appearance-none cursor-pointer"
                      style={{ accentColor: color }}
                    />
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground mt-1">{t.modal.scoreFormula}</p>
              </div>

              {/* Not doing badge */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notDoing}
                  onChange={(e) => setNotDoing(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-muted-foreground">{t.modal.notDoingLabel}</span>
              </label>
            </>
          ) : (
            /* Logs tab */
            <div className="space-y-3">
              {item?.logs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">{t.modal.noLogs}</p>
              ) : (
                <div className="space-y-2">
                  {[...item!.logs].reverse().map((log) => (
                    <div key={log.id} className="border border-border rounded px-3 py-2.5">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-foreground">{log.note}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
                  placeholder={t.modal.logPlaceholder}
                  className="flex-1 bg-input border border-border rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon/50"
                />
                <button
                  onClick={handleAddLog}
                  className="px-3 py-2 text-xs bg-neon/10 border border-neon/30 text-neon rounded hover:bg-neon/20 transition-colors"
                >
                  {t.common.add}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-4 md:px-5 py-3 md:py-4 border-t border-border">
          <div>
            {isEditing && (
              <button
                onClick={handleDelete}
                className="text-xs text-destructive-foreground hover:text-[oklch(0.65_0.20_27)] transition-colors"
              >
                {t.common.delete}
              </button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-1.5 text-xs border border-border rounded text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="flex-1 sm:flex-none px-4 py-1.5 text-xs bg-neon text-primary-foreground rounded font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {isEditing ? t.common.save : t.common.create}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
