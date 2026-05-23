'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Shell } from '@/components/layout/shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, daysUntil, getProfitColor } from '@/lib/utils'
import { getOrder, upsertOrder, insertPayment, patchOrder } from '@/lib/data'
import { PRODUCTION_STATUSES, ORDER_STATUSES, PAYMENT_TYPES, PAYMENT_METHODS } from '@/lib/constants'
import type { Order, Payment } from '@/lib/types'
import { ArrowRight, ExternalLink, Plus, CheckCircle, Circle, Calendar, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

function ProductionStepper({ current }: { current?: string }) {
  const steps = PRODUCTION_STATUSES
  const idx = current ? steps.indexOf(current as typeof steps[number]) : -1
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <div key={step} className="flex items-center gap-1 shrink-0">
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
              done ? 'bg-emerald-100 text-emerald-700' :
                active ? 'bg-[#b8934a] text-white shadow-sm' :
                  'bg-[#f0ebe0] text-[#7a6a52]'
            )}>
              {done ? <CheckCircle size={12} /> : <Circle size={12} />}
              {step}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-4 h-0.5 shrink-0', done ? 'bg-emerald-400' : 'bg-[#e5ddd0]')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingPayment, setAddingPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_type: 'יתרה', payment_method: 'העברה בנקאית', notes: '' })

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת ההזמנה' }))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = useCallback(async (field: 'order_status' | 'production_status', value: string) => {
    if (!order) return
    try {
      await patchOrder(order.id, { [field]: value })
      setOrder(o => o ? { ...o, [field]: value } : o)
      toast({ type: 'success', title: 'סטטוס עודכן' })
    } catch {
      toast({ type: 'error', title: 'שגיאה בעדכון' })
    }
  }, [order, toast])

  const handleAddPayment = useCallback(async () => {
    if (!order || !paymentForm.amount) return
    setAddingPayment(true)
    try {
      const amount = Number(paymentForm.amount)
      const newPayment = await insertPayment({
        order_id: order.id,
        customer_id: order.customer_id,
        payment_type: paymentForm.payment_type,
        payment_method: paymentForm.payment_method,
        amount,
        payment_date: new Date().toISOString().split('T')[0],
        is_paid: true,
        notes: paymentForm.notes,
      })
      const totalPaid = (order.payments || []).filter(p => p.is_paid).reduce((s, p) => s + p.amount, 0) + amount
      const newBalance = Math.max(0, order.sale_price - totalPaid)
      const newPaymentStatus = newBalance === 0 ? 'שולם במלואו' : 'שולם חלקית'
      const updated = await upsertOrder({ ...order, balance_due: newBalance, payment_status: newPaymentStatus })
      setOrder(o => o ? {
        ...o,
        balance_due: updated.balance_due,
        payment_status: updated.payment_status,
        payments: [...(o.payments || []), newPayment],
      } : o)
      setPaymentForm({ amount: '', payment_type: 'יתרה', payment_method: 'העברה בנקאית', notes: '' })
      toast({ type: 'success', title: `תשלום של ${formatCurrency(amount)} נרשם` })
    } catch {
      toast({ type: 'error', title: 'שגיאה ברישום תשלום' })
    } finally {
      setAddingPayment(false)
    }
  }, [order, paymentForm, toast])

  if (loading) return (
    <Shell title="הזמנה">
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#e5ddd0] rounded-xl" />)}
      </div>
    </Shell>
  )

  if (!order) return (
    <Shell title="הזמנה">
      <div className="max-w-3xl mx-auto text-center py-20 text-[#7a6a52]">ההזמנה לא נמצאה</div>
    </Shell>
  )

  const daysLeft = order.delivery_date ? daysUntil(order.delivery_date) : null
  const isUrgent = daysLeft !== null && daysLeft <= 3 && !['הושלם', 'בוטל'].includes(order.order_status)
  const payments = order.payments || []
  const expenses = order.expenses || []
  const totalPaid = payments.filter(p => p.is_paid).reduce((s, p) => s + p.amount, 0)

  return (
    <Shell title="הזמנה">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/orders">
            <Button variant="ghost" size="icon"><ArrowRight size={18} /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#2c1810] font-mono">{order.order_number}</h1>
            <p className="text-sm text-[#7a6a52]">{formatDate(order.created_at)}</p>
          </div>
          <div className="mr-auto flex items-center gap-2 flex-wrap">
            <Badge variant={getStatusBadgeVariant(order.order_status)}>{order.order_status}</Badge>
            <Badge variant={getStatusBadgeVariant(order.payment_status)}>{order.payment_status}</Badge>
          </div>
        </div>

        {/* Urgency */}
        {isUrgent && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {daysLeft === 0 ? 'מסירה היום!' : `${daysLeft} ימים למסירה`}
            </p>
          </div>
        )}

        {/* Customer + Supplier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
            <h2 className="font-semibold text-[#2c1810] mb-2 text-sm">לקוח</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{order.customers?.full_name || '—'}</p>
                {order.customers?.phone && <p className="text-xs text-[#7a6a52]">{order.customers.phone}</p>}
              </div>
              {order.customers?.id && (
                <Link href={`/customers/${order.customers.id}`}>
                  <Button variant="ghost" size="icon" title="פרופיל לקוח"><ExternalLink size={14} /></Button>
                </Link>
              )}
            </div>
          </div>
          {order.suppliers && (
            <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
              <h2 className="font-semibold text-[#2c1810] mb-2 text-sm">ספק</h2>
              <p className="font-medium">{order.suppliers.name}</p>
              {order.suppliers.contact_name && <p className="text-xs text-[#7a6a52]">{order.suppliers.contact_name}</p>}
              {order.suppliers.delivery_time && <p className="text-xs text-[#7a6a52]">{order.suppliers.delivery_time}</p>}
            </div>
          )}
        </div>

        {/* Production stepper */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#2c1810] text-sm">שלב ייצור</h2>
            <Select
              className="text-xs h-7 w-40"
              value={order.production_status || ''}
              onChange={e => handleStatusChange('production_status', e.target.value)}
            >
              <option value="">בחר שלב</option>
              {PRODUCTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <ProductionStepper current={order.production_status} />
        </div>

        {/* Jewelry specs */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">פרטי תכשיט</h2>
          {order.description && (
            <p className="text-sm text-[#4a3728] mb-3 bg-[#faf8f5] rounded-lg p-2">{order.description}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'סוג תכשיט', value: order.jewelry_type },
              { label: 'יהלום', value: order.diamond_type },
              { label: 'מקור', value: order.diamond_origin },
              { label: 'תעודה', value: order.diamond_certificate },
              { label: 'זהב', value: order.gold_type },
              { label: 'צבע זהב', value: order.gold_color },
              { label: 'מידה', value: order.size },
              { label: 'חריטה', value: order.engraving },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-[#7a6a52] mb-0.5">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery */}
        {order.delivery_date && (
          <div className={cn(
            'rounded-xl border p-4 flex items-center gap-3',
            isUrgent ? 'bg-red-50 border-red-200' : 'bg-white border-[#e5ddd0]'
          )}>
            <Calendar size={18} className={isUrgent ? 'text-red-600' : 'text-[#7a6a52]'} />
            <div>
              <p className="text-sm font-medium text-[#2c1810]">תאריך מסירה: {formatDate(order.delivery_date)}</p>
              {daysLeft !== null && !['הושלם', 'בוטל'].includes(order.order_status) && (
                <p className={cn('text-xs', isUrgent ? 'text-red-600' : 'text-[#7a6a52]')}>
                  {daysLeft === 0 ? 'מסירה היום' : daysLeft > 0 ? `בעוד ${daysLeft} ימים` : `${Math.abs(daysLeft)} ימים באיחור`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Financial summary */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">מידע פיננסי</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">מחיר מכירה</p>
              <p className="font-bold text-[#2c1810]">{formatCurrency(order.sale_price)}</p>
            </div>
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">שולם</p>
              <p className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">יתרה לגביה</p>
              <p className={cn('font-bold', order.balance_due > 0 ? 'text-red-600' : 'text-emerald-600')}>
                {formatCurrency(order.balance_due)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">עלות כוללת</p>
              <p className="font-medium">{formatCurrency(order.total_cost)}</p>
            </div>
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">רווח נקי</p>
              <p className={cn('font-medium', getProfitColor(order.profit_margin ?? 0))}>{formatCurrency(order.net_profit ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">מרווח</p>
              <p className={cn('font-medium', getProfitColor(order.profit_margin ?? 0))}>{(order.profit_margin ?? 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#2c1810] text-sm">תשלומים ({payments.length})</h2>
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-[#7a6a52] text-center py-3">אין תשלומים עדיין</p>
          ) : (
            <div className="space-y-2 mb-3">
              {payments.map((p: Payment) => (
                <div key={p.id} className="flex items-center justify-between text-sm bg-[#faf8f5] rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium">{p.payment_type}</span>
                    <span className="text-[#7a6a52] mx-1">·</span>
                    <span className="text-[#7a6a52]">{p.payment_method}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-[#7a6a52]">{formatDate(p.payment_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add payment */}
          {order.balance_due > 0 && (
            <div className="border-t border-[#e5ddd0] pt-3">
              <p className="text-xs font-semibold text-[#7a6a52] mb-2">רישום תשלום חדש</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Input
                  type="number"
                  placeholder={`יתרה: ${formatCurrency(order.balance_due)}`}
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                />
                <Select value={paymentForm.payment_method} onChange={e => setPaymentForm(f => ({ ...f, payment_method: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
                <Select value={paymentForm.payment_type} onChange={e => setPaymentForm(f => ({ ...f, payment_type: e.target.value }))}>
                  {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Input placeholder="הערות" value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button size="sm" onClick={handleAddPayment} disabled={!paymentForm.amount || addingPayment}>
                <Plus size={14} />{addingPayment ? 'שומר...' : 'רשום תשלום'}
              </Button>
            </div>
          )}
        </div>

        {/* Expenses */}
        {expenses.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
            <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">הוצאות ({expenses.length})</h2>
            <div className="space-y-2">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between text-sm bg-[#faf8f5] rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium">{e.expense_type}</span>
                    {e.suppliers && <span className="text-[#7a6a52] text-xs mx-1">· {e.suppliers.name}</span>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(e.amount)}</p>
                    <p className="text-xs text-[#7a6a52]">{e.is_paid ? 'שולם' : 'ממתין'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status change */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">עדכון סטטוס הזמנה</h2>
          <div className="flex gap-2 flex-wrap">
            {ORDER_STATUSES.map(s => (
              <Button
                key={s}
                size="sm"
                variant={order.order_status === s ? 'default' : 'outline'}
                onClick={() => handleStatusChange('order_status', s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-xl border border-[#e5ddd0] p-4 pb-6">
            <h2 className="font-semibold text-[#2c1810] mb-2 text-sm">הערות</h2>
            <p className="text-sm text-[#4a3728] whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}
      </div>
    </Shell>
  )
}
