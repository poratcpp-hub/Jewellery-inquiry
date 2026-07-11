'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Shell } from '@/components/layout/shell'
import { Button } from '@/components/ui/button'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { getOrders } from '@/lib/data'
import { formatCurrency, daysUntil } from '@/lib/utils'
import type { Order } from '@/lib/types'
import { ChevronRight, ChevronLeft, Calendar, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]
const HEBREW_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת הזמנות' }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const deliveryMap = useMemo(() => {
    const map = new Map<string, Order[]>()
    orders.forEach(o => {
      if (!o.delivery_date || ['הושלם', 'בוטל'].includes(o.order_status)) return
      const key = o.delivery_date.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(o)
    })
    return map
  }, [orders])

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay() // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
    // fill to complete last week
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [viewDate])

  const selectedOrders = selectedDay ? (deliveryMap.get(selectedDay) || []) : []

  const upcomingOrders = useMemo(() => {
    const in14 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    return orders
      .filter(o => {
        if (!o.delivery_date || ['הושלם', 'בוטל'].includes(o.order_status)) return false
        const d = new Date(o.delivery_date)
        return d >= today && d <= in14
      })
      .sort((a, b) => a.delivery_date!.localeCompare(b.delivery_date!))
  }, [orders, today])

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const goToday = () => { setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(null) }

  return (
    <Shell title="לוח שנה">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-[#2c1810]">לוח מסירות</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>היום</Button>
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronRight size={18} /></Button>
            <span className="text-base font-semibold text-[#2c1810] min-w-[130px] text-center">
              {HEBREW_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronLeft size={18} /></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar grid */}
          <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden shadow-[0_1px_8px_rgba(26,18,9,0.06)]">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#e5ddd0]">
              {HEBREW_DAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-[#7a6a52]">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            {loading ? (
              <div className="h-64 flex items-center justify-center text-[#7a6a52] text-sm">טוען...</div>
            ) : (
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={i} className="min-h-[80px] border-b border-r border-[#f0ebe0] last:border-r-0 bg-[#faf8f5]" />
                  const key = toDateKey(day)
                  const dayOrders = deliveryMap.get(key) || []
                  const isToday = key === toDateKey(today)
                  const isSelected = key === selectedDay
                  const hasUrgent = dayOrders.some(o => {
                    const d = daysUntil(o.delivery_date!)
                    return d !== null && d <= 3
                  })
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedDay(isSelected ? null : key)}
                      className={cn(
                        'min-h-[80px] border-b border-r border-[#f0ebe0] last:border-r-0 p-1.5 cursor-pointer transition-colors',
                        isSelected ? 'bg-[#f5efe0]' : 'hover:bg-[#faf8f5]',
                        i % 7 === 6 ? 'border-r-0' : ''
                      )}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 mx-auto',
                        isToday ? 'bg-[#b8934a] text-white' : 'text-[#4a3728]'
                      )}>
                        {day.getDate()}
                      </div>
                      {dayOrders.length > 0 && (
                        <div className="space-y-0.5">
                          {dayOrders.slice(0, 2).map(o => (
                            <div key={o.id} className={cn(
                              'text-[10px] rounded px-1 py-0.5 truncate font-medium',
                              hasUrgent ? 'bg-red-100 text-red-700' : 'bg-[#f0ebe0] text-[#4a3728]'
                            )}>
                              {o.customers?.full_name || o.order_number}
                            </div>
                          ))}
                          {dayOrders.length > 2 && (
                            <div className="text-[10px] text-[#7a6a52] px-1">+{dayOrders.length - 2} עוד</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            {/* Selected day detail */}
            {selectedDay && (
              <div className="glass-card rounded-xl p-4 shadow-[0_1px_8px_rgba(26,18,9,0.06)]">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={15} className="text-[#b8934a]" />
                  <h3 className="font-semibold text-[#2c1810] text-sm">
                    {(() => {
                      const d = new Date(selectedDay + 'T00:00:00')
                      return `${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`
                    })()}
                  </h3>
                </div>
                {selectedOrders.length === 0 ? (
                  <p className="text-sm text-[#7a6a52]">אין מסירות ביום זה</p>
                ) : (
                  <div className="space-y-2">
                    {selectedOrders.map(o => (
                      <Link key={o.id} href={`/orders/${o.id}`}>
                        <div className="p-3 rounded-lg bg-[#faf8f5] hover:bg-[#f5efe0] transition-colors cursor-pointer">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-[#7a6a52]">{o.order_number}</span>
                            <Badge variant={getStatusBadgeVariant(o.order_status)}>{o.order_status}</Badge>
                          </div>
                          <p className="text-sm font-medium text-[#2c1810]">{o.customers?.full_name || '—'}</p>
                          {o.jewelry_type && <p className="text-xs text-[#7a6a52]">{o.jewelry_type}</p>}
                          <p className="text-xs text-[#b8934a] font-medium mt-1">{formatCurrency(o.sale_price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming 14 days */}
            <div className="glass-card rounded-xl p-4 shadow-[0_1px_8px_rgba(26,18,9,0.06)]">
              <h3 className="font-semibold text-[#2c1810] text-sm mb-3">מסירות ב-14 ימים הקרובים</h3>
              {loading ? (
                <p className="text-sm text-[#7a6a52]">טוען...</p>
              ) : upcomingOrders.length === 0 ? (
                <p className="text-sm text-[#7a6a52]">אין מסירות קרובות</p>
              ) : (
                <div className="space-y-2">
                  {upcomingOrders.map(o => {
                    const days = daysUntil(o.delivery_date!)
                    const urgent = days !== null && days <= 3
                    return (
                      <Link key={o.id} href={`/orders/${o.id}`}>
                        <div className={cn(
                          'flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors',
                          urgent ? 'bg-red-50 hover:bg-red-100' : 'bg-[#faf8f5] hover:bg-[#f5efe0]'
                        )}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#2c1810] truncate">{o.customers?.full_name || '—'}</p>
                            <p className="text-xs text-[#7a6a52]">{o.order_number}</p>
                          </div>
                          <div className="text-right shrink-0 mr-2">
                            {urgent && <AlertTriangle size={12} className="text-red-500 inline ml-1" />}
                            <span className={cn('text-xs font-semibold', urgent ? 'text-red-600' : 'text-[#7a6a52]')}>
                              {days === 0 ? 'היום' : `${days} ימים`}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
