'use client'

import { useEffect, useState, useMemo } from 'react'
import { Shell } from '@/components/layout/shell'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { UpcomingDeliveries } from '@/components/dashboard/upcoming-deliveries'
import { MetricsSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, FileText, Target, AlertCircle, Calendar, ArrowLeft, AlertTriangle, Clock, WifiOff } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getPayments, getExpenses, getLeads, getQuotes, getOrders, getCustomers, checkDatabaseConnection, logSupabaseError } from '@/lib/data'
import type { DashboardMetrics, Order, Lead, Quote } from '@/lib/types'
import { CLOSED_ORDER_STATUSES, CLOSED_QUOTE_STATUSES, CLOSED_LEAD_STATUSES } from '@/lib/constants'

const EMPTY_METRICS: DashboardMetrics = {
  monthlyRevenue: 0, monthlyExpenses: 0, monthlyProfit: 0,
  openOrders: 0, openQuotes: 0, activeLeads: 0,
  waitingForDetails: 0, realCustomers: 0, repeatCustomers: 0,
  waitingForDeposit: 0, inProduction: 0, unpaidBalance: 0,
  upcomingDeliveries: 0,
}

function DbErrorBanner({ error }: { error: string }) {
  const isHostError = error.includes('Host not in allowlist')
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
      <p className="font-semibold text-red-800 flex items-center gap-2 mb-2">
        <WifiOff size={15} />
        {isHostError ? 'בעיית הרשאות Supabase — מפתח API מוגבל' : 'שגיאת חיבור למסד הנתונים'}
      </p>
      {isHostError ? (
        <div className="text-red-700 space-y-1">
          <p>המפתח <code className="bg-red-100 px-1 rounded text-xs">sb_publishable_...</code> מוגבל לרשימת כתובות (host allowlist) שאינה כוללת את הכתובת הנוכחית.</p>
          <p className="font-medium mt-2">תיקון — בצע אחת מהאפשרויות הבאות:</p>
          <ol className="list-decimal list-inside space-y-1 mr-2">
            <li><strong>מומלץ:</strong> העתק את מפתח ה-<code className="bg-red-100 px-1 rounded text-xs">anon public</code> (מתחיל ב-<code className="bg-red-100 px-1 rounded text-xs">eyJ...</code>) מ: Supabase → Project Settings → API → API Keys, ועדכן אותו ב-<code className="bg-red-100 px-1 rounded text-xs">.env.local</code></li>
            <li>לחלופין: הוסף <code className="bg-red-100 px-1 rounded text-xs">http://localhost:3000</code> לרשימת המותרים של המפתח הנוכחי תחת Supabase → Project Settings → API</li>
          </ol>
        </div>
      ) : (
        <p className="text-red-700">שגיאה: <code className="bg-red-100 px-1 rounded text-xs">{error}</code></p>
      )}
    </div>
  )
}

function AlertsWidget({ leads, quotes, orders }: { leads: Lead[], quotes: Quote[], orders: Order[] }) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const overdueLeads = leads.filter(l => {
    if (!l.follow_up_date || CLOSED_LEAD_STATUSES.has(l.lead_status)) return false
    const d = new Date(l.follow_up_date); d.setHours(0, 0, 0, 0)
    return d <= now
  })
  const expiringQuotes = quotes.filter(q => {
    if (!q.valid_until || q.quote_status !== 'נשלחה ללקוח') return false
    const d = new Date(q.valid_until); d.setHours(0, 0, 0, 0)
    return d >= now && d <= in7Days
  })
  const urgentDeliveries = orders.filter(o => {
    if (!o.delivery_date || CLOSED_ORDER_STATUSES.has(o.order_status)) return false
    const d = new Date(o.delivery_date); d.setHours(0, 0, 0, 0)
    return d >= now && d <= in3Days
  })

  const total = overdueLeads.length + expiringQuotes.length + urgentDeliveries.length
  if (total === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-1.5">
        <AlertTriangle size={15} />
        דרוש טיפול ({total})
      </h3>
      <div className="space-y-2">
        {overdueLeads.map(l => (
          <Link key={l.id} href={`/leads/${l.id}`}>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#2c1810]">{l.full_name} — מעקב באיחור</p>
                  <p className="text-xs text-[#7a6a52]">תאריך מעקב: {formatDate(l.follow_up_date)}</p>
                </div>
              </div>
              <ArrowLeft size={13} className="text-[#7a6a52]" />
            </div>
          </Link>
        ))}
        {expiringQuotes.map(q => (
          <Link key={q.id} href={`/quotes/${q.id}`}>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#2c1810]">{q.quote_number} — פג תוקף בקרוב</p>
                  <p className="text-xs text-[#7a6a52]">תוקף עד: {formatDate(q.valid_until)}</p>
                </div>
              </div>
              <ArrowLeft size={13} className="text-[#7a6a52]" />
            </div>
          </Link>
        ))}
        {urgentDeliveries.map(o => (
          <Link key={o.id} href={`/orders/${o.id}`}>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#2c1810]">{o.order_number} — מסירה דחופה</p>
                  <p className="text-xs text-[#7a6a52]">תאריך מסירה: {formatDate(o.delivery_date)}</p>
                </div>
              </div>
              <ArrowLeft size={13} className="text-[#7a6a52]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ConversionFunnel({ leads, quotes, orders }: { leads: Lead[], quotes: Quote[], orders: Order[] }) {
  const steps = useMemo(() => {
    const totalLeads = leads.length
    const convertedLeads = leads.filter(l => l.lead_status === 'נסגר להזמנה').length
    const totalQuotes = quotes.length
    const approvedQuotes = quotes.filter(q => q.quote_status === 'אושרה').length
    const totalOrders = orders.length
    const deliveredOrders = orders.filter(o => o.order_status === 'הושלם').length

    return [
      { label: 'לידים', total: totalLeads, sub: `${convertedLeads} הומרו`, pct: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0, color: 'bg-blue-400' },
      { label: 'הצעות מחיר', total: totalQuotes, sub: `${approvedQuotes} אושרו`, pct: totalQuotes > 0 ? Math.round((approvedQuotes / totalQuotes) * 100) : 0, color: 'bg-[#b8934a]' },
      { label: 'הזמנות', total: totalOrders, sub: `${deliveredOrders} הושלמו`, pct: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0, color: 'bg-emerald-500' },
    ]
  }, [leads, quotes, orders])

  return (
    <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] p-5">
      <h3 className="text-sm font-semibold text-[#2c1810] mb-4">משפך המרות</h3>
      <div className="flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2 flex-1">
            <div className="flex-1">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs font-medium text-[#4a3728]">{step.label}</span>
                <span className="text-lg font-bold text-[#2c1810]">{step.total}</span>
              </div>
              <div className="h-2 bg-[#f0ebe0] rounded-full overflow-hidden">
                <div className={`h-full ${step.color} rounded-full transition-all duration-500`} style={{ width: `${Math.max(step.pct, 4)}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-[#7a6a52]">{step.sub}</span>
                <span className="text-xs font-medium text-[#7a6a52]">{step.pct}%</span>
              </div>
            </div>
            {i < steps.length - 1 && <ArrowLeft size={14} className="text-[#c5b8a0] shrink-0 mb-3" />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<Order[]>([])
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [allQuotes, setAllQuotes] = useState<Quote[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      // Step 1: DB health check — surfaces the exact error for customers
      const health = await checkDatabaseConnection()
      if (!health.ok) {
        logSupabaseError('Dashboard DB health check failed', { message: health.error })
        setDbError(health.error ?? 'שגיאה לא ידועה')
        setMetrics(EMPTY_METRICS)
        toast({ type: 'error', title: 'שגיאה בטעינת הדשבורד. בדוק חיבור למסד הנתונים.' })
        setLoading(false)
        return
      }

      // Step 2: load all data in parallel, tolerating partial failures
      const [paymentsR, expensesR, leadsR, quotesR, ordersR, customersR] = await Promise.allSettled([
        getPayments(), getExpenses(), getLeads(), getQuotes(), getOrders(), getCustomers(),
      ])

      const payments  = paymentsR.status  === 'fulfilled' ? paymentsR.value  : []
      const expenses  = expensesR.status  === 'fulfilled' ? expensesR.value  : []
      const leads     = leadsR.status     === 'fulfilled' ? leadsR.value     : []
      const quotes    = quotesR.status    === 'fulfilled' ? quotesR.value    : []
      const orders    = ordersR.status    === 'fulfilled' ? ordersR.value    : []
      const customers = customersR.status === 'fulfilled' ? customersR.value : []

      // Log any individual full-query failures via logSupabaseError
      const results = [
        { name: 'payments',  r: paymentsR  },
        { name: 'expenses',  r: expensesR  },
        { name: 'leads',     r: leadsR     },
        { name: 'quotes',    r: quotesR    },
        { name: 'orders',    r: ordersR    },
        { name: 'customers', r: customersR },
      ]
      results.forEach(({ name, r }) => {
        if (r.status === 'rejected') {
          logSupabaseError(`Dashboard query "${name}" failed`, r.reason)
        }
      })

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

      const custMap = Object.fromEntries(customers.map(c => [c.id, c]))
      const enrichedOrders = orders.map(o => ({ ...o, customers: custMap[o.customer_id || ''] || o.customers }))

      const monthlyRevenue = payments
        .filter(p => p.is_paid && new Date(p.payment_date) >= monthStart)
        .reduce((s, p) => s + p.amount, 0)
      const monthlyExpenses = expenses
        .filter(e => e.is_paid && new Date(e.expense_date) >= monthStart)
        .reduce((s, e) => s + e.amount, 0)

      setMetrics({
        monthlyRevenue,
        monthlyExpenses,
        monthlyProfit: monthlyRevenue - monthlyExpenses,
        openOrders: enrichedOrders.filter(o => !CLOSED_ORDER_STATUSES.has(o.order_status)).length,
        openQuotes: quotes.filter(q => !CLOSED_QUOTE_STATUSES.has(q.quote_status)).length,
        activeLeads: leads.filter(l => !CLOSED_LEAD_STATUSES.has(l.lead_status)).length,
        waitingForDetails: leads.filter(l => l.lead_status === 'מחכה לפרטים').length,
        realCustomers: customers.length,
        repeatCustomers: customers.filter(c => c.customer_status === 'לקוח חוזר' || c.customer_status === 'VIP').length,
        waitingForDeposit: enrichedOrders.filter(o => o.order_status === 'מחכה למקדמה').length,
        inProduction: enrichedOrders.filter(o => o.order_status === 'בייצור' || o.order_status === 'הועבר לייצור').length,
        unpaidBalance: enrichedOrders
          .filter(o => o.payment_status !== 'שולם במלואו')
          .reduce((s, o) => s + o.balance_due, 0),
        upcomingDeliveries: enrichedOrders.filter(o => {
          if (!o.delivery_date || CLOSED_ORDER_STATUSES.has(o.order_status)) return false
          const d = new Date(o.delivery_date)
          return d >= now && d <= twoWeeks
        }).length,
      })

      setAllLeads(leads)
      setAllQuotes(quotes)
      setAllOrders(enrichedOrders)
      setRecentOrders(enrichedOrders.slice(0, 5))
      setUpcomingDeliveries(
        enrichedOrders.filter(o => {
          if (!o.delivery_date || CLOSED_ORDER_STATUSES.has(o.order_status)) return false
          const d = new Date(o.delivery_date)
          return d >= now && d <= twoWeeks
        })
      )
    }

    load().finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Shell title="דשבורד">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2c1810]">שלום, ברוכים הבאים 👋</h1>
          <p className="text-[#7a6a52] text-sm mt-0.5">PORAT Private Jeweler · סקירה כללית לחודש הנוכחי</p>
        </div>

        {dbError && <DbErrorBanner error={dbError} />}

        {loading ? <MetricsSkeleton /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="הכנסות החודש" value={formatCurrency(metrics?.monthlyRevenue ?? 0)} subtitle="תשלומים שהתקבלו" variant="gold" icon={<DollarSign size={20} />} />
              <MetricCard title="הוצאות החודש" value={formatCurrency(metrics?.monthlyExpenses ?? 0)} subtitle="הוצאות מאושרות" variant="warning" icon={<TrendingDown size={20} />} />
              <MetricCard
                title="רווח נקי"
                value={formatCurrency(metrics?.monthlyProfit ?? 0)}
                subtitle={(metrics?.monthlyRevenue ?? 0) > 0 ? `${(((metrics?.monthlyProfit ?? 0) / (metrics?.monthlyRevenue ?? 1)) * 100).toFixed(1)}% מרווח` : '—'}
                variant={(metrics?.monthlyProfit ?? 0) >= 0 ? 'success' : 'danger'}
                icon={<TrendingUp size={20} />}
              />
              <MetricCard title="יתרה לגביה" value={formatCurrency(metrics?.unpaidBalance ?? 0)} subtitle="מהזמנות פתוחות" variant={(metrics?.unpaidBalance ?? 0) > 0 ? 'danger' : 'success'} icon={<AlertCircle size={20} />} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="הזמנות פתוחות" value={String(metrics?.openOrders ?? 0)} subtitle="בתהליך ייצור/מסירה" icon={<ShoppingBag size={20} />} />
              <MetricCard title="הצעות מחיר" value={String(metrics?.openQuotes ?? 0)} subtitle="טיוטות ונשלחות" icon={<FileText size={20} />} />
              <MetricCard title="לידים פעילים" value={String(metrics?.activeLeads ?? 0)} subtitle="מחכים לטיפול" icon={<Target size={20} />} />
              <MetricCard title="מסירות קרובות" value={String(metrics?.upcomingDeliveries ?? 0)} subtitle="14 הימים הקרובים" variant={(metrics?.upcomingDeliveries ?? 0) > 0 ? 'warning' : 'default'} icon={<Calendar size={20} />} />
            </div>

            <AlertsWidget leads={allLeads} quotes={allQuotes} orders={allOrders} />
            <ConversionFunnel leads={allLeads} quotes={allQuotes} orders={allOrders} />
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
