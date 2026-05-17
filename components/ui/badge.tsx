import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' | 'gold'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
          {
            'bg-[#b8934a]/10 text-[#8a6a2e] border border-[#b8934a]/20': variant === 'default',
            'bg-emerald-50 text-emerald-700 border border-emerald-200': variant === 'success',
            'bg-amber-50 text-amber-700 border border-amber-200': variant === 'warning',
            'bg-red-50 text-red-700 border border-red-200': variant === 'destructive',
            'bg-[#f5efe0] text-[#4a3728] border border-[#e5ddd0]': variant === 'secondary',
            'bg-white text-[#4a3728] border border-[#e5ddd0]': variant === 'outline',
            'bg-[#b8934a] text-white': variant === 'gold',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  const map: Record<string, BadgeProps['variant']> = {
    // Customer
    'VIP': 'gold',
    'פעיל': 'success',
    'חדש': 'secondary',
    'לא פעיל': 'outline',
    // Lead
    'בטיפול': 'warning',
    'ממתין': 'secondary',
    'הומר': 'success',
    'נסגר': 'outline',
    // Quote
    'טיוטה': 'secondary',
    'נשלחה': 'warning',
    'אושרה': 'success',
    'נדחתה': 'destructive',
    'פג תוקף': 'outline',
    // Order
    'הזמנה חדשה': 'default',
    'בייצור': 'warning',
    'מוכן': 'success',
    'נמסר': 'outline',
    'בוטל': 'destructive',
    // Payment
    'לא שולם': 'destructive',
    'שולם חלקית': 'warning',
    'שולם במלואו': 'success',
    // Priority
    'גבוה': 'destructive',
    'בינוני': 'warning',
    'נמוך': 'secondary',
  }
  return map[status] || 'secondary'
}

export { Badge }
