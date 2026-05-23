'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Shell } from '@/components/layout/shell'
import { Button } from '@/components/ui/button'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, getProfitColor } from '@/lib/utils'
import { getCustomerFull } from '@/lib/data'
import type { Customer, Lead, Order } from '@/lib/types'
import { ArrowRight, Phone, AtSign, Mail, MapPin, Star, ShoppingBag, Target, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

function StatCard({ label, value, sub, variant }: { label: string; value: string; sub?: string; variant?: 'gold' | 'green' | 'red' }) {
  return (
    <div className={cn(
      'rounded-xl border p-4 text-center',
      variant === 'gold' ? 'bg-amber-50 border-amber-200' :
        variant === 'green' ? 'bg-emerald-50 border-emerald-200' :
          variant === 'red' ? 'bg-red-50 border-red-200' :
            'bg-white border-[#e5ddd0]'
    )}>
      <p className="text-xs text-[#7a6a52] mb-0.5">{label}</p>
      <p className="text-xl font-bold text-[#2c1810]">{value}</p>
      {sub && <p className="text-xs text-[#7a6a52] mt-0.5">{sub}</p>}
    </div>
  )
}

type ActiveTab = 'orders' | 'leads'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ActiveTab>('orders')

  useEffect(() => {
    getCustomerFull(id)
      .then(setCustomer)
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת הלקוח' }))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <Shell title="לקוח">
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#e5ddd0] rounded-xl" />)}
      </div>
    </Shell>
  )

  if (!customer) return (
    <Shell title="לקוח">
      <div className="max-w-3xl mx-auto text-center py-20 text-[#7a6a52]">הלקוח לא נמצא</div>
    </Shell>
  )

  const orders = customer.orders || []
  const convertedLeads = customer.converted_leads || []

  // Use pre-calculated stats if available, fall back to computed
  const totalRevenue = customer.total_revenue ?? orders.reduce((s, o) => s + (o.sale_price ?? 0), 0)
  const totalProfit = customer.total_profit ?? orders.reduce((s, o) => s + (o.net_profit ?? 0), 0)
  const avgMargin = orders.length > 0 ? orders.reduce((s, o) => s + (o.profit_margin ?? 0), 0) / orders.length : 0

  const isVip = customer.customer_status === 'VIP'

  return (
    <Shell title="פרופיל לקוח">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="ghost" size="icon"><ArrowRight size={18} /></Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#2c1810]">{customer.full_name}</h1>
              {isVip && <Star size={16} className="text-[#b8934a] fill-[#b8934a]" />}
            </div>
            <p className="text-sm text-[#7a6a52]">לקוח מאז {formatDate(customer.created_at)}</p>
          </div>
          <Badge variant={getStatusBadgeVariant(customer.customer_status)}>{customer.customer_status}</Badge>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">פרטי קשר</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-[#b8934a] shrink-0" />
                <div>
                  <p className="text-xs text-[#7a6a52]">טלפון</p>
                  <a href={`tel:${customer.phone}`} className="font-medium text-[#b8934a] hover:underline">{customer.phone}</a>
                </div>
              </div>
            )}
            {customer.instagram && (
              <div className="flex items-center gap-2">
                <AtSign size={13} className="text-[#7a6a52] shrink-0" />
                <div>
                  <p className="text-xs text-[#7a6a52]">אינסטגרם</p>
                  <p className="font-medium">{customer.instagram}</p>
                </div>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-[#7a6a52] shrink-0" />
                <div>
                  <p className="text-xs text-[#7a6a52]">אימייל</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
            )}
            {customer.city && (
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-[#7a6a52] shrink-0" />
                <div>
                  <p className="text-xs text-[#7a6a52]">עיר</p>
                  <p className="font-medium">{customer.city}</p>
                </div>
              </div>
            )}
            {customer.source && (
              <div>
                <p className="text-xs text-[#7a6a52] mb-0.5">מקור</p>
                <p className="font-medium">{customer.source}</p>
              </div>
            )}
          </div>
          {customer.notes && (
            <div className="mt-3 pt-3 border-t border-[#f0ebe0]">
              <p className="text-xs text-[#7a6a52] mb-1">הערות</p>
              <p className="text-sm text-[#4a3728]">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="הזמנות" value={String(orders.length)} />
          <StatCard label="לידים שהומרו" value={String(convertedLeads.length)} />
          <StatCard label="סה&quot;כ רכישות" value={formatCurrency(totalRevenue)} variant="gold" />
          <StatCard
            label="רווח כולל"
            value={formatCurrency(totalProfit)}
            sub={orders.length > 0 ? `${avgMargin.toFixed(0)}% מרווח` : undefined}
            variant={totalProfit > 0 ? 'green' : 'red'}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] overflow-hidden">
          <div className="flex border-b border-[#e5ddd0]">
            {([
              { key: 'orders', label: 'הזמנות', count: orders.length, icon: ShoppingBag },
              { key: 'leads', label: 'לידים שהומרו', count: convertedLeads.length, icon: Target },
            ] as const).map(({ key, label, count, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors',
                  tab === key
                    ? 'text-[#b8934a] border-b-2 border-[#b8934a] bg-amber-50'
                    : 'text-[#7a6a52] hover:text-[#4a3728] hover:bg-[#faf8f5]'
                )}
              >
                <Icon size={14} />
                {label}
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  tab === key ? 'bg-amber-100 text-amber-700' : 'bg-[#f0ebe0] text-[#7a6a52]'
                )}>{count}</span>
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Orders tab */}
            {tab === 'orders' && (
              orders.length === 0 ? (
                <p className="text-sm text-[#7a6a52] text-center py-6">אין הזמנות ללקוח זה</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order: Order) => (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <div className="flex items-center justify-between p-3 bg-[#faf8f5] rounded-lg hover:bg-[#f0ebe0] transition-colors cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-[#2c1810] font-mono">{order.order_number}</p>
                          <p className="text-xs text-[#7a6a52]">
                            {order.jewelry_type || '—'} · {formatDate(order.created_at)}
                            {order.delivery_date && ` · מסירה ${formatDate(order.delivery_date)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#b8934a]">{formatCurrency(order.sale_price)}</p>
                            {(order.profit_margin ?? 0) > 0 && (
                              <p className={cn('text-xs', getProfitColor(order.profit_margin ?? 0))}>{(order.profit_margin ?? 0).toFixed(0)}% רווח</p>
                            )}
                          </div>
                          <Badge variant={getStatusBadgeVariant(order.order_status)}>{order.order_status}</Badge>
                          <ExternalLink size={13} className="text-[#7a6a52]" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {/* Converted leads tab */}
            {tab === 'leads' && (
              convertedLeads.length === 0 ? (
                <p className="text-sm text-[#7a6a52] text-center py-6">אין לידים שהומרו להזמנה ללקוח זה</p>
              ) : (
                <div className="space-y-2">
                  {convertedLeads.map((lead: Lead) => (
                    <Link key={lead.id} href={`/leads/${lead.id}`}>
                      <div className="flex items-center justify-between p-3 bg-[#faf8f5] rounded-lg hover:bg-[#f0ebe0] transition-colors cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-[#2c1810]">{lead.jewelry_type || 'ליד'}</p>
                          <p className="text-xs text-[#7a6a52]">{formatDate(lead.created_at)} · {lead.source || ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {lead.budget && <span className="text-xs text-[#7a6a52]">{formatCurrency(lead.budget)}</span>}
                          <Badge variant={getStatusBadgeVariant(lead.lead_status)}>{lead.lead_status}</Badge>
                          <ExternalLink size={13} className="text-[#7a6a52]" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
