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
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors',
          {
            'bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-500/25': variant === 'default',
            'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20': variant === 'success',
            'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/25': variant === 'warning',
            'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20': variant === 'destructive',
            'bg-champagne text-ink-soft ring-1 ring-inset ring-sand': variant === 'secondary',
            'bg-white text-clay ring-1 ring-inset ring-sand': variant === 'outline',
            'bg-gradient-to-b from-gold-400 to-gold-600 text-white shadow-sm [text-shadow:0_1px_1px_rgba(90,64,20,0.3)]': variant === 'gold',
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
    'לקוח חוזר': 'success',
    'לקוח חדש': 'default',
    'לא פעיל': 'outline',
    'פעיל': 'success',
    'חדש': 'secondary',
    // Lead statuses
    'צריך מענה ראשוני': 'destructive',
    'מחכה לפרטים': 'warning',
    'מוכן להצעת מחיר': 'success',
    'נשלחה הצעת מחיר': 'default',
    'פולואפ ראשון': 'warning',
    'פולואפ שני': 'warning',
    'לקוח לא מגיב': 'outline',
    'נסגר להזמנה': 'success',
    'לא רלוונטי': 'outline',
    'בטיפול': 'warning',
    'ממתין': 'secondary',
    'הומר': 'success',
    'נסגר': 'outline',
    // Quote
    'טיוטה': 'secondary',
    'נשלחה': 'warning',
    'נשלחה ללקוח': 'warning',
    'אושרה': 'success',
    'נדחתה': 'destructive',
    'פג תוקף': 'outline',
    // Order
    'מחכה למקדמה': 'warning',
    'מקדמה התקבלה': 'default',
    'הועבר לייצור': 'default',
    'הזמנה חדשה': 'default',
    'בייצור': 'warning',
    'מוכן למסירה': 'success',
    'מחכה לתשלום יתרה': 'warning',
    'הושלם': 'success',
    'מוכן': 'success',
    'נמסר': 'outline',
    'בוטל': 'destructive',
    // Payment
    'לא שולם': 'destructive',
    'שולמה מקדמה': 'warning',
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
