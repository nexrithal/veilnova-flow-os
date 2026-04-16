'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { TaskModal } from './task-modal'
import { ItemStatus } from '@/lib/types'

interface QuickAddProps {
  defaultStatus?: ItemStatus
  placeholder?: string
}

export function QuickAdd({ defaultStatus = 'idea', placeholder }: QuickAddProps) {
  const addItem = useStore((s) => s.addItem)
  const t = useI18n()
  const [value, setValue] = useState('')
  const [showModal, setShowModal] = useState(false)

  const resolvedPlaceholder = placeholder ?? t.quickAdd.placeholder

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (value.trim()) {
        setShowModal(true)
      }
    }
    if (e.key === 'Escape') {
      setValue('')
    }
  }

  function handleModalClose() {
    setShowModal(false)
    setValue('')
  }

  function handleFastAdd() {
    if (!value.trim()) return
    addItem({
      title: value.trim(),
      description: '',
      type: 'other',
      status: defaultStatus,
      personalValue: 5,
      systemImpact: 5,
      effort: 5,
      horizon: 'month',
    })
    setValue('')
  }

  return (
    <>
      <div className="relative flex flex-col md:flex-row md:items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+</span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={resolvedPlaceholder}
            className="w-full pl-7 pr-3 py-2.5 bg-card border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/20 transition-colors"
          />
        </div>
        {value.trim() && (
          <div className="flex gap-1.5 w-full md:w-auto">
            <button
              onClick={handleFastAdd}
              className="flex-1 md:flex-none px-3 py-2 text-xs text-muted-foreground border border-border rounded hover:text-foreground hover:border-foreground/30 transition-colors"
              title="Fast add with defaults"
            >
              {t.common.quick}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 md:flex-none px-3 py-2 text-xs text-neon border border-neon/30 bg-neon/10 rounded hover:bg-neon/20 transition-colors"
            >
              {t.common.full}
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          defaultStatus={defaultStatus}
          initialTitle={value.trim()}
          item={null}
          onClose={handleModalClose}
        />
      )}
    </>
  )
}
