'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'

export function Sidebar() {
  const pathname = usePathname()
  const items = useStore((s) => s.items)
  const wipLimit = useStore((s) => s.wipLimit)
  const locale = useStore((s) => s.locale)
  const setLocale = useStore((s) => s.setLocale)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const t = useI18n()

  const NAV_ITEMS = [
    { href: '/', label: t.nav.dashboard, icon: '▦' },
    { href: '/planner/day', label: t.nav.planner || 'Planner', icon: '▤' },
    { href: '/inbox', label: t.nav.inbox, icon: '◎' },
    { href: '/backlog', label: t.nav.backlog, icon: '≡' },
    { href: '/board', label: t.nav.board, icon: '⊞' },
    { href: '/frozen', label: t.nav.frozen, icon: '◈' },
    { href: '/done', label: t.nav.done, icon: '✓' },
    { href: '/review', label: t.nav.review, icon: '⟳' },
    { href: '/analytics', label: t.nav.analytics, icon: '∿' },
  ]

  const counts = {
    '/inbox': items.filter((i) => i.status === 'idea').length,
    '/backlog': items.filter((i) => i.status === 'backlog').length,
    '/board': items.filter((i) => i.status === 'active').length,
    '/frozen': items.filter((i) => i.status === 'frozen').length,
    '/done': items.filter((i) => i.status === 'done').length,
  }

  const activeCount = items.filter((i) => i.status === 'active').length
  const isOverWip = activeCount > wipLimit

  return (
    <aside className="hidden md:flex flex-col w-52 border-r border-border bg-sidebar shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-neon font-bold text-base tracking-tight">Flow</span>
          <span className="text-muted-foreground font-light text-base tracking-tight">OS</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{t.sidebar.subtitle}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const count = counts[item.href as keyof typeof counts]
          const isActive = pathname === item.href || (item.href.startsWith('/planner') && pathname.startsWith('/planner'))
          const isBoardOverWip = item.href === '/board' && isOverWip

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all duration-100',
                isActive
                  ? 'bg-neon/10 text-neon border border-neon/20'
                  : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums',
                    isBoardOverWip
                      ? 'bg-[oklch(0.72_0.14_80)/20] text-[oklch(0.72_0.14_80)]'
                      : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {count}
                  {isBoardOverWip && '!'}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* WIP indicator */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{t.sidebar.wip}</span>
          <span
            className={cn(
              'text-xs font-bold tabular-nums',
              isOverWip ? 'text-[oklch(0.72_0.14_80)]' : 'text-neon'
            )}
          >
            {activeCount} / {wipLimit}
          </span>
        </div>
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isOverWip ? 'bg-[oklch(0.72_0.14_80)]' : 'bg-neon'
            )}
            style={{ width: `${Math.min((activeCount / wipLimit) * 100, 100)}%` }}
          />
        </div>
        {isOverWip && (
          <p className="text-[10px] text-[oklch(0.72_0.14_80)] mt-1.5">{t.sidebar.wipExceeded}</p>
        )}
      </div>

      {/* Controls: theme + language */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={cn(
            'flex items-center justify-center w-8 h-7 rounded border text-[13px] transition-colors',
            'border-border text-muted-foreground hover:text-foreground hover:border-neon/40'
          )}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        {/* Language toggle */}
        <div className="flex rounded border border-border overflow-hidden">
          {(['en', 'ru'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLocale(lang)}
              className={cn(
                'px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest transition-colors',
                locale === lang
                  ? 'bg-neon/15 text-neon'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
