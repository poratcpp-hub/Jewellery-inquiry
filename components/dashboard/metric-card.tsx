import * as React from 'react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantConfig = {
  default: { bg: 'bg-white', icon: 'bg-champagne text-gold-600 ring-1 ring-gold-200/60', border: 'border-sand' },
  gold:    { bg: 'bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600', icon: 'bg-white/20 text-white ring-1 ring-white/25', border: 'border-gold-500' },
  success: { bg: 'bg-white', icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100', border: 'border-sand' },
  warning: { bg: 'bg-white', icon: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100', border: 'border-sand' },
  danger:  { bg: 'bg-white', icon: 'bg-red-50 text-red-600 ring-1 ring-red-100', border: 'border-sand' },
} as const

export const MetricCard = React.memo(function MetricCard({
  title, value, subtitle, icon, trend, variant = 'default', className,
}: MetricCardProps) {
  const config = variantConfig[variant]
  const isGold = variant === 'gold'

  return (
    <div className={cn(
      'group relative overflow-hidden rounded-xl border p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5',
      config.bg, config.border, className
    )}>
      {/* Soft sheen sweeping across the gold card */}
      {isGold && (
        <div className="pointer-events-none absolute -inset-y-8 -left-24 w-20 rotate-12 bg-white/15 blur-xl transition-transform duration-700 group-hover:translate-x-[22rem]" />
      )}
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-medium mb-1', isGold ? 'text-white/85' : 'text-clay')}>
            {title}
          </p>
          <p className={cn('text-2xl font-bold tracking-tight tabular-nums', isGold ? 'text-white [text-shadow:0_1px_2px_rgba(90,64,20,0.25)]' : 'text-ink')}>
            {value}
          </p>
          {subtitle && (
            <p className={cn('text-xs mt-1', isGold ? 'text-white/75' : 'text-clay')}>{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn('text-xs font-medium', trend.value >= 0
                ? isGold ? 'text-white/90' : 'text-emerald-600'
                : isGold ? 'text-white/90' : 'text-red-600'
              )}>
                {trend.value >= 0 ? '\u2191' : '\u2193'} {Math.abs(trend.value)}%
              </span>
              <span className={cn('text-xs', isGold ? 'text-white/60' : 'text-clay')}>{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
          config.icon
        )}>
          {icon}
        </div>
      </div>
    </div>
  )
})
