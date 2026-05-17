import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order } from '@/lib/types'

interface RecentOrdersProps {
  orders: Order[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="rounded-xl bg-white border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)]">
      <div className="p-5 border-b border-[#e5ddd0]">
        <h3 className="font-semibold text-[#2c1810]">הזמנות אחרונות</h3>
      </div>
      <div className="divide-y divide-[#f0ebe0]">
        {orders.length === 0 && (
          <p className="text-center text-[#7a6a52] text-sm py-8">אין הזמנות להצגה</p>
        )}
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between p-4 hover:bg-[#faf8f5] transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-[#2c1810]">
                  {order.customers?.full_name || '—'}
                </span>
                <Badge variant={getStatusBadgeVariant(order.order_status)}>
                  {order.order_status}
                </Badge>
              </div>
              <p className="text-xs text-[#7a6a52] truncate">
                {order.order_number} · {order.jewelry_type || '—'}
              </p>
            </div>
            <div className="text-left mr-4 shrink-0">
              <p className="text-sm font-semibold text-[#2c1810]">
                {formatCurrency(order.sale_price)}
              </p>
              <p className="text-xs text-[#7a6a52]">
                {order.delivery_date ? formatDate(order.delivery_date) : '—'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
