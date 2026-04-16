'use client'

import { useStore } from '@/lib/store'
import { translations, Locale } from '@/lib/i18n'

export function useI18n() {
  const locale = useStore((s) => s.locale)
  return { ...translations[locale], locale }
}
