'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CollapsiblePanelProps {
  title: string
  badge?: string | number
  badgeVariant?: 'default' | 'destructive' | 'success'
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function CollapsiblePanel({
  title,
  badge,
  badgeVariant = 'default',
  defaultOpen = false,
  children,
  className,
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn('border-b border-border last:border-b-0', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {badge !== undefined && (
            <span
              className={cn(
                'text-[9px] font-medium px-1.5 py-0.5 rounded-full',
                badgeVariant === 'destructive' && 'bg-destructive/20 text-destructive',
                badgeVariant === 'success' && 'bg-chart-2/20 text-chart-2',
                badgeVariant === 'default' && 'bg-muted text-muted-foreground'
              )}
            >
              {badge}
            </span>
          )}
        </div>
        <span
          className={cn(
            'text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}

interface MobileDetailsPanelProps {
  children: React.ReactNode
  className?: string
}

export function MobileDetailsPanel({ children, className }: MobileDetailsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={cn(
        'lg:hidden border-t border-border bg-card/80 backdrop-blur-sm',
        'transition-all duration-300 ease-in-out',
        className
      )}
    >
      {/* Handle bar to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex flex-col items-center py-2 hover:bg-secondary/30 transition-colors"
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-1" />
        <span className="text-[10px] text-muted-foreground">
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </span>
      </button>

      {/* Expandable content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isExpanded ? 'max-h-[60vh] overflow-y-auto' : 'max-h-0'
        )}
      >
        {children}
      </div>
    </div>
  )
}
