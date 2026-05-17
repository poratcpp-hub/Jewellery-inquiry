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

export function MetricCard({ title, value, subtitle, icon, trend, variant = 'default', className }: MetricCardProps) {
  const variantConfig = {
    default: { bg: 'bg-white', icon: 'bg-[#f5efe0] text-[#b8934a]', border: 'border-[#e5ddd0]' },
    gold: { bg: 'bg-[#b8934a]', icon: 'bg-white/20 text-white', border: 'border-[#b8934a]' },
    success: { bg: 'bg-white', icon: 'bg-emerald-50 text-emerald-600', border: 'border-[#e5ddd0]' },
    warning: { bg: 'bg-white', icon: 'bg-amber-50 text-amber-600', border: 'border-[#e5ddd0]' },
    danger: { bg: 'bg-white', icon: 'bg-red-50 text-red-600', border: 'border-[#e5ddd0]' },
  }

  const config = variantConfig[variant]
  const isGold = variant === 'gold'

  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-[0_1px_8px_rgba(26,18,9,0.06)] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(26,18,9,0.1)]',
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-medium mb-1', isGold ? 'text-white/80' : 'text-[#7a6a52]')}>
            {title}
          </p>
          <p className={cn('text-2xl font-bold tracking-tight', isGold ? 'text-white' : 'text-[#2c1810]')}>
            {value}
          </p>
          {subtitle && (
            <p className={cn('text-xs mt-1', isGold ? 'text-white/70' : 'text-[#7a6a52]')}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.value >= 0
                    ? isGold ? 'text-white/90' : 'text-emerald-600'
                    : isGold ? 'text-white/90' : 'text-red-600'
                )}
              >
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className={cn('text-xs', isGold ? 'text-white/60' : 'text-[#7a6a52]')}>
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', config.icon)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
