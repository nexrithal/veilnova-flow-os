'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TaskItem } from '@/lib/types'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'

interface WorkLogEntryProps {
  task: TaskItem
  date: string
  onComplete?: () => void
  className?: string
}

const QUICK_DURATIONS = [15, 30, 60, 120]

export function WorkLogEntry({ task, date, onComplete, className }: WorkLogEntryProps) {
  const t = useI18n()
  const logWork = useStore((s) => s.logWork)
  const [showCustom, setShowCustom] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(45)

  const handleQuickLog = (minutes: number) => {
    const now = new Date()
    const startTime = new Date(now.getTime() - minutes * 60 * 1000)
    
    logWork(task.id, {
      date,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      durationMinutes: minutes,
    })
    
    onComplete?.()
  }

  const handleCustomLog = () => {
    const now = new Date()
    const startTime = new Date(now.getTime() - customMinutes * 60 * 1000)
    
    logWork(task.id, {
      date,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      durationMinutes: customMinutes,
    })
    
    setShowCustom(false)
    onComplete?.()
  }

  const formatQuickDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    return `${minutes / 60}h`
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Quick log buttons */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_DURATIONS.map((minutes) => (
          <button
            key={minutes}
            onClick={() => handleQuickLog(minutes)}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-medium transition-colors',
              'bg-secondary text-muted-foreground hover:bg-neon/20 hover:text-neon'
            )}
          >
            +{formatQuickDuration(minutes)}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            'px-3 py-1.5 rounded text-xs font-medium transition-colors',
            showCustom
              ? 'bg-neon/20 text-neon'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
          )}
        >
          {t.planner?.custom || 'Custom'}
        </button>
      </div>

      {/* Custom duration input */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={5}
            max={480}
            step={5}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
            className={cn(
              'w-20 px-2 py-1.5 rounded text-xs bg-input border border-border',
              'focus:outline-none focus:ring-1 focus:ring-neon'
            )}
          />
          <span className="text-xs text-muted-foreground">{t.planner?.minutes || 'min'}</span>
          <button
            onClick={handleCustomLog}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-medium transition-colors',
              'bg-neon/20 text-neon hover:bg-neon/30'
            )}
          >
            {t.planner?.log || 'Log'}
          </button>
        </div>
      )}
    </div>
  )
}

interface QuickLogButtonProps {
  task: TaskItem
  date: string
  className?: string
}

export function QuickLogButton({ task, date, className }: QuickLogButtonProps) {
  const t = useI18n()
  const logWork = useStore((s) => s.logWork)
  const [showMenu, setShowMenu] = useState(false)

  const handleLog = (minutes: number) => {
    const now = new Date()
    const startTime = new Date(now.getTime() - minutes * 60 * 1000)
    
    logWork(task.id, {
      date,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      durationMinutes: minutes,
    })
    
    setShowMenu(false)
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          'px-2 py-1 rounded text-[10px] font-medium transition-colors',
          'bg-chart-2/20 text-chart-2 hover:bg-chart-2/30'
        )}
      >
        + {t.planner?.log || 'Log'}
      </button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute bottom-full right-0 mb-1 z-20 bg-card border border-border rounded shadow-lg p-1 flex gap-1">
            {QUICK_DURATIONS.map((minutes) => (
              <button
                key={minutes}
                onClick={() => handleLog(minutes)}
                className="px-2 py-1 rounded text-[10px] hover:bg-secondary transition-colors"
              >
                {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
