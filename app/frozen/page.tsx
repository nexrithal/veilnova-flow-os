'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useI18n } from '@/hooks/use-i18n'
import { AppShell } from '@/components/app/app-shell'
import { TaskCard } from '@/components/app/task-card'
import { TaskModal } from '@/components/app/task-modal'
import { TaskItem } from '@/lib/types'

export default function FrozenPage() {
  const items = useStore((s) => s.items)
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null)
  const t = useI18n()

  const frozen = [...items.filter((i) => i.status === 'frozen')].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{t.frozen.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t.frozen.subtitle(frozen.length)}</p>
        </div>

        {frozen.length === 0 ? (
          <div className="bg-card border border-border rounded-md px-4 py-12 text-center">
            <p className="text-xs text-muted-foreground">{t.frozen.empty}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {frozen.map((item) => (
              <TaskCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <TaskModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </AppShell>
  )
}
