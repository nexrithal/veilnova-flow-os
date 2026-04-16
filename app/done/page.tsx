'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { AppShell } from '@/components/app/app-shell'
import { TaskCard } from '@/components/app/task-card'
import { TaskModal } from '@/components/app/task-modal'
import { TaskItem } from '@/lib/types'

export default function DonePage() {
  const items = useStore((s) => s.items)
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null)
  const t = useI18n()

  const done = [...items.filter((i) => i.status === 'done')].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
  const archived = items.filter((i) => i.status === 'archived')

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{t.done.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t.done.subtitle(done.length, archived.length)}</p>
        </div>

        {done.length === 0 ? (
          <div className="bg-card border border-border rounded-md px-4 py-12 text-center">
            <p className="text-xs text-muted-foreground">{t.done.empty}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {done.map((item) => (
              <TaskCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
            ))}
          </div>
        )}

        {archived.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {t.done.archived}
            </h2>
            <div className="space-y-2 opacity-50">
              {archived.map((item) => (
                <TaskCard key={item.id} item={item} compact onClick={() => setSelectedItem(item)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedItem && (
        <TaskModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </AppShell>
  )
}
