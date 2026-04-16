'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export function ThemeLocaleProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme)

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark', 'light')
    html.classList.add(theme)
  }, [theme])

  return <>{children}</>
}
