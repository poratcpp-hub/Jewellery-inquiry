import * as React from 'react'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { formatDate, daysUntil } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

interface UpcomingDeliveriesProps {
  orders: Order[]
}

export const UpcomingDeliveries = React.memo(function UpcomingDeliveries({ orders }: UpcomingDeliveriesProps) {
  return (
    <div className="glass-card rounded-xl">
      <div className="p-5 border-b border-[#e5ddd0]">
        <h3 className="font-semibold text-[#2c1810]">מסירות קרובות</h3>
      </div>
      <div className="divide-y divide-[#f0ebe0]">
        {orders.length === 0 && (
          <p className="text-center text-[#7a6a52] text-sm py-8">אין מסירות קרובות</p>
        )}
        {orders.map(order => {
          const days = daysUntil(order.delivery_date)
          const isUrgent = days !== null && days <= 3
          const label = days === null ? '—' : days === 0 ? 'היום' : days === 1 ? 'מחר' : `${days} ימים`
          return (
            <div key={order.id} className="flex items-center justify-between p-4 hover:bg-[#faf8f5] transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isUrgent && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#2c1810] truncate">
                    {order.customers?.full_name || '—'}
                  </p>
                  <p className="text-xs text-[#7a6a52]">
                    {order.order_number} · {order.jewelry_type || '—'}
                  </p>
                </div>
              </div>
              <div className="text-left mr-4 shrink-0">
                <p className={cn('text-sm font-medium', isUrgent ? 'text-amber-600' : 'text-[#2c1810]')}>
                  {label}
                </p>
                <p className="text-xs text-[#7a6a52]">{formatDate(order.delivery_date)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
