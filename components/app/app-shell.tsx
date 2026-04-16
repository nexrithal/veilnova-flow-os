'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Sidebar } from './sidebar'
import { useI18n } from '@/hooks/use-i18n'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const t = useI18n()
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const locale = useStore((s) => s.locale)
  const setLocale = useStore((s) => s.setLocale)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const MAIN_NAV_ITEMS = [
    { href: '/', label: t.nav.dash, icon: '▦' },
    { href: '/inbox', label: t.nav.inbox, icon: '◎' },
    { href: '/board', label: t.nav.board, icon: '⊞' },
    { href: '/review', label: t.nav.review, icon: '⟳' },
  ]

  const MORE_NAV_ITEMS = [
    { href: '/backlog', label: t.nav.backlog, icon: '≡' },
    { href: '/frozen', label: t.nav.frozen, icon: '◈' },
    { href: '/done', label: t.nav.done, icon: '✓' },
    { href: '/analytics', label: t.nav.analytics, icon: '∿' },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav - Improved touch targets */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-sidebar border-t border-border z-40">
        <div className="relative">
          <div className="flex h-16">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-1 text-[11px] transition-colors min-h-16',
                    isActive ? 'text-neon' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className="line-clamp-1">{item.label}</span>
                </Link>
              )
            })}

            {/* More menu button */}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-[11px] transition-colors text-muted-foreground hover:text-foreground min-h-16"
              aria-label="More options"
            >
              <span className="text-lg leading-none">⋯</span>
              <span>{t.common.more || 'More'}</span>
            </button>
          </div>

          {/* More menu dropdown */}
          {showMoreMenu && (
            <div className="absolute bottom-full right-0 w-full bg-card border border-border border-b-0 shadow-lg">
              {MORE_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm border-b border-border transition-colors',
                      isActive
                        ? 'bg-neon/10 text-neon'
                        : 'text-foreground hover:bg-sidebar'
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {/* Theme + Lang controls in more menu */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-sidebar gap-2">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="flex items-center justify-center w-8 h-8 rounded border border-border text-sm transition-colors text-muted-foreground hover:text-foreground"
                >
                  {theme === 'dark' ? '☀' : '☾'}
                </button>
                <div className="flex rounded border border-border overflow-hidden">
                  {(['en', 'ru'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLocale(lang)}
                      className={cn(
                        'px-2 py-1 text-[10px] font-semibold uppercase transition-colors',
                        locale === lang
                          ? 'bg-neon/15 text-neon'
                          : 'text-muted-foreground'
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}
