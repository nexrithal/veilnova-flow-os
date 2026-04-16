'use client'

import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { CalendarView } from '@/lib/types'

interface PlannerHeaderProps {
  title: string
  subtitle?: string
  isCurrentPeriod: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  todayLabel: string
  children?: React.ReactNode // For capacity summary
}

export function PlannerHeader({
  title,
  subtitle,
  isCurrentPeriod,
  onPrev,
  onNext,
  onToday,
  todayLabel,
  children,
}: PlannerHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useI18n()
  const setCalendarView = useStore((s) => s.setCalendarView)

  const views: { view: CalendarView; href: string; label: string }[] = [
    { view: 'day', href: '/planner/day', label: t.planner?.dayView || 'Day' },
    { view: 'week', href: '/planner/week', label: t.planner?.weekView || 'Week' },
    { view: 'month', href: '/planner/month', label: t.planner?.monthView || 'Month' },
  ]

  const handleViewChange = (view: CalendarView, href: string) => {
    setCalendarView(view)
    router.push(href)
  }

  return (
    <div className="border-b border-border px-4 py-3 bg-card/50">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left section: Navigation + Date */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Nav arrows */}
          <button
            onClick={onPrev}
            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Previous"
          >
            <span className="text-sm">&larr;</span>
          </button>

          {/* Date display */}
          <div className="text-center min-w-[120px] sm:min-w-[160px]">
            {subtitle && (
              <div className="text-[10px] text-muted-foreground">{subtitle}</div>
            )}
            <div className={cn('text-sm font-bold truncate', isCurrentPeriod && 'text-neon')}>
              {title}
            </div>
          </div>

          <button
            onClick={onNext}
            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Next"
          >
            <span className="text-sm">&rarr;</span>
          </button>

          {/* Today button */}
          {!isCurrentPeriod && (
            <button
              onClick={onToday}
              className="px-2 py-1 rounded text-[10px] font-medium bg-neon/10 text-neon hover:bg-neon/20 transition-colors shrink-0"
            >
              {todayLabel}
            </button>
          )}
        </div>

        {/* Right section: View switcher + Capacity */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {/* View switcher */}
          <div className="flex rounded-md border border-border overflow-hidden shrink-0">
            {views.map(({ view, href, label }) => {
              const isActive = pathname === href || (pathname === '/planner' && view === 'day')
              return (
                <button
                  key={view}
                  onClick={() => handleViewChange(view, href)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-medium transition-colors',
                    isActive
                      ? 'bg-neon/15 text-neon'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Capacity summary slot */}
          {children}
        </div>
      </div>
    </div>
  )
}
