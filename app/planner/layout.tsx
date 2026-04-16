'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { CalendarView } from '@/lib/types'

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useI18n()
  const calendarView = useStore((s) => s.calendarView)
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
    <div className="flex flex-col h-full">
      {/* View tabs */}
      <div className="border-b border-border px-4 py-2 flex items-center gap-4 bg-card/50">
        <h1 className="text-sm font-bold text-foreground mr-2">
          {t.nav?.planner || 'Planner'}
        </h1>
        <div className="flex rounded-md border border-border overflow-hidden">
          {views.map(({ view, href, label }) => {
            const isActive = pathname === href || (pathname === '/planner' && view === 'day')
            return (
              <button
                key={view}
                onClick={() => handleViewChange(view, href)}
                className={cn(
                  'px-3 py-1.5 text-[11px] font-medium transition-colors',
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
