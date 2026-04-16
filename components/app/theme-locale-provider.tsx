'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export function ThemeLocaleProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme)
  const locale = useStore((s) => s.locale)

  // Sync theme class
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark', 'light')
    html.classList.add(theme)
  }, [theme])

  // Sync lang attribute with current locale
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return <>{children}</>
}
