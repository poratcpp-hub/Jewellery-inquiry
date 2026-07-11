'use client'

import { cn } from '@/lib/utils'

interface FilterChipsProps {
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  counts?: Record<string, number>
  allLabel?: string
  allCount?: number
  className?: string
}

/**
 * Pill-style status filter row ("הכל · 12 | טיוטה · 3 | ...").
 * Empty string value means "all". Scrolls horizontally on narrow screens.
 */
export function FilterChips({ options, value, onChange, counts, allLabel = 'הכל', allCount, className }: FilterChipsProps) {
  const chips: { key: string; label: string; count?: number }[] = [
    { key: '', label: allLabel, count: allCount },
    ...options.map(o => ({ key: o, label: o, count: counts?.[o] })),
  ]

  return (
    <div className={cn('overflow-x-auto pb-1 -mb-1', className)}>
      <div className="inline-flex items-center gap-1 rounded-full border border-sand bg-white p-1 shadow-card whitespace-nowrap">
        {chips.map(chip => {
          const active = value === chip.key
          return (
            <button
              key={chip.key || '__all__'}
              type="button"
              onClick={() => onChange(chip.key)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
                active
                  ? 'bg-gradient-to-b from-gold-400 to-gold-500 text-white shadow-gold [text-shadow:0_1px_1px_rgba(90,64,20,0.25)]'
                  : 'text-ink-soft hover:bg-champagne hover:text-ink'
              )}
            >
              {chip.label}
              {chip.count !== undefined && chip.count > 0 && (
                <span
                  className={cn(
                    'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums',
                    active ? 'bg-white/25 text-white' : 'bg-sand-soft text-clay'
                  )}
                >
                  {chip.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
