'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/layout/shell'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { UpcomingDeliveries } from '@/components/dashboard/upcoming-deliveries'
import { MetricsSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, FileText, Target, AlertCircle, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getDashboardMetrics, getOrders, getCustomers } from '@/lib/data'
import type { DashboardMetrics, Order } from '@/lib/types'

export default function DashboardPage() {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardMetrics(), getOrders(), getCustomers()])
      .then(([m, orders, customers]) => {
        setMetrics(m)
        const custMap = Object.fromEntries(customers.map(c => [c.id, c]))
        const enriched = orders.map(o => ({ ...o, customers: custMap[o.customer_id || ''] || o.customers }))
        const now = new Date()
        const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        setRecentOrders(enriched.slice(0, 5))
        setUpcomingDeliveries(
          enriched.filter(o => {
            if (!o.delivery_date || ['נמסר', 'בוטל'].includes(o.order_status)) return false
            const d = new Date(o.delivery_date)
            return d >= now && d <= twoWeeks
          })
        )
      })
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת הדשבורד' }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Shell title="דשבורד">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2c1810]">שלום, ברוכים הבאים 👋</h1>
          <p className="text-[#7a6a52] text-sm mt-0.5">סקירה כללית של העסק לחודש הנוכחי</p>
        </div>

        {loading || !metrics ? <MetricsSkeleton /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="הכנסות החודש" value={formatCurrency(metrics.monthlyRevenue)} subtitle="תשלומים שהתקבלו" variant="gold" icon={<DollarSign size={20} />} />
              <MetricCard title="הוצאות החודש" value={formatCurrency(metrics.monthlyExpenses)} subtitle="הוצאות מאושרות" variant="warning" icon={<TrendingDown size={20} />} />
              <MetricCard
                title="רווח נקי"
                value={formatCurrency(metrics.monthlyProfit)}
                subtitle={metrics.monthlyRevenue > 0 ? `${((metrics.monthlyProfit / metrics.monthlyRevenue) * 100).toFixed(1)}% מרווח` : '—'}
                variant={metrics.monthlyProfit >= 0 ? 'success' : 'danger'}
                icon={<TrendingUp size={20} />}
              />
              <MetricCard title="יתרה לגביה" value={formatCurrency(metrics.unpaidBalance)} subtitle="מהזמנות פתוחות" variant={metrics.unpaidBalance > 0 ? 'danger' : 'success'} icon={<AlertCircle size={20} />} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="הזמנות פתוחות" value={String(metrics.openOrders)} subtitle="בתהליך ייצור/מסירה" icon={<ShoppingBag size={20} />} />
              <MetricCard title="הצעות מחיר" value={String(metrics.openQuotes)} subtitle="טיוטות ונשלחות" icon={<FileText size={20} />} />
              <MetricCard title="לידים פעילים" value={String(metrics.newLeads)} subtitle="מחכים לטיפול" icon={<Target size={20} />} />
              <MetricCard title="מסירות קרובות" value={String(metrics.upcomingDeliveries)} subtitle="14 הימים הקרובים" variant={metrics.upcomingDeliveries > 0 ? 'warning' : 'default'} icon={<Calendar size={20} />} />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders orders={recentOrders} />
          <UpcomingDeliveries orders={upcomingDeliveries} />
        </div>
      </div>
    </Shell>
  )
}
