'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { AppShell } from '@/components/app/app-shell'
import { TaskCard } from '@/components/app/task-card'
import { TaskModal } from '@/components/app/task-modal'
import { QuickAdd } from '@/components/app/quick-add'
import { TaskItem } from '@/lib/types'

export default function InboxPage() {
  const items = useStore((s) => s.items)
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null)
  const t = useI18n()

  const ideas = [...items.filter((i) => i.status === 'idea')].sort((a, b) => b.score - a.score)

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{t.inbox.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t.inbox.subtitle(ideas.length)}</p>
          </div>
        </div>

        <div className="mb-6">
          <QuickAdd defaultStatus="idea" placeholder={t.inbox.placeholder} />
        </div>

        <div className="space-y-2">
          {ideas.length === 0 ? (
            <div className="bg-card border border-border rounded-md px-4 py-12 text-center">
              <p className="text-xs text-muted-foreground">{t.inbox.empty}</p>
            </div>
          ) : (
            ideas.map((item) => (
              <TaskCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
            ))
          )}
        </div>
      </div>

      {selectedItem && (
        <TaskModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </AppShell>
  )
}
