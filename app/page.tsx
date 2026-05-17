'use client'

import { Shell } from '@/components/layout/shell'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { UpcomingDeliveries } from '@/components/dashboard/upcoming-deliveries'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  FileText, Target, AlertCircle, Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  demoOrders, demoPayments, demoExpenses, demoLeads, demoQuotes, demoCustomers
} from '@/lib/demo-data'
import type { Order } from '@/lib/types'

function buildDemoOrders(): Order[] {
  return demoOrders.map(o => ({
    ...o,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customers: demoCustomers.find(c => c.id === o.customer_id)
      ? { ...demoCustomers.find(c => c.id === o.customer_id)!, created_at: '', updated_at: '' }
      : undefined,
  }))
}

export default function DashboardPage() {
  const orders = buildDemoOrders()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthlyRevenue = demoPayments
    .filter(p => new Date(p.payment_date) >= monthStart && p.is_paid)
    .reduce((sum, p) => sum + p.amount, 0)

  const monthlyExpenses = demoExpenses
    .filter(e => new Date(e.expense_date) >= monthStart && e.is_paid)
    .reduce((sum, e) => sum + e.amount, 0)

  const monthlyProfit = monthlyRevenue - monthlyExpenses

  const openOrders = orders.filter(o => !['נמסר', 'בוטל'].includes(o.order_status)).length
  const openQuotes = demoQuotes.filter(q => !['אושרה', 'נדחתה', 'פג תוקף'].includes(q.quote_status)).length
  const newLeads = demoLeads.filter(l => !['הומר', 'נסגר'].includes(l.lead_status)).length

  const unpaidBalance = orders
    .filter(o => o.payment_status !== 'שולם במלואו')
    .reduce((sum, o) => sum + o.balance_due, 0)

  const upcomingDeliveries = orders.filter(o => {
    if (!o.delivery_date || ['נמסר', 'בוטל'].includes(o.order_status)) return false
    const diff = new Date(o.delivery_date).getTime() - now.getTime()
    return diff >= 0 && diff <= 14 * 24 * 60 * 60 * 1000
  })

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <Shell title="דשבורד">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2c1810]">שלום, ברוכים הבאים 👋</h1>
          <p className="text-[#7a6a52] text-sm mt-0.5">סקירה כללית של העסק לחודש הנוכחי</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="הכנסות החודש"
            value={formatCurrency(monthlyRevenue)}
            subtitle="תשלומים שהתקבלו"
            variant="gold"
            icon={<DollarSign size={20} />}
          />
          <MetricCard
            title="הוצאות החודש"
            value={formatCurrency(monthlyExpenses)}
            subtitle="הוצאות מאושרות"
            variant="warning"
            icon={<TrendingDown size={20} />}
          />
          <MetricCard
            title="רווח נקי"
            value={formatCurrency(monthlyProfit)}
            subtitle={monthlyRevenue > 0 ? `${((monthlyProfit / monthlyRevenue) * 100).toFixed(1)}% מרווח` : '—'}
            variant={monthlyProfit >= 0 ? 'success' : 'danger'}
            icon={<TrendingUp size={20} />}
          />
          <MetricCard
            title="יתרה לגביה"
            value={formatCurrency(unpaidBalance)}
            subtitle="מהזמנות פתוחות"
            variant={unpaidBalance > 0 ? 'danger' : 'success'}
            icon={<AlertCircle size={20} />}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="הזמנות פתוחות"
            value={String(openOrders)}
            subtitle="בתהליך ייצור/מסירה"
            icon={<ShoppingBag size={20} />}
          />
          <MetricCard
            title="הצעות מחיר"
            value={String(openQuotes)}
            subtitle="טיוטות ונשלחות"
            icon={<FileText size={20} />}
          />
          <MetricCard
            title="לידים פעילים"
            value={String(newLeads)}
            subtitle="מחכים לטיפול"
            icon={<Target size={20} />}
          />
          <MetricCard
            title="מסירות קרובות"
            value={String(upcomingDeliveries.length)}
            subtitle="14 הימים הקרובים"
            variant={upcomingDeliveries.length > 0 ? 'warning' : 'default'}
            icon={<Calendar size={20} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders orders={recentOrders} />
          <UpcomingDeliveries orders={upcomingDeliveries} />
        </div>
      </div>
    </Shell>
  )
}
