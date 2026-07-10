'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Shell } from '@/components/layout/shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, daysUntil, getProfitColor } from '@/lib/utils'
import { getOrder, upsertOrder, recordOrderPayment, syncOrderPaymentState, upsertPayment, deletePayment, upsertExpense, deleteExpense } from '@/lib/data'
import { PRODUCTION_STATUSES, ORDER_STATUSES, PAYMENT_TYPES, PAYMENT_METHODS, EXPENSE_TYPES } from '@/lib/constants'
import type { Order, Payment, Expense } from '@/lib/types'
import { ArrowRight, ExternalLink, Plus, CheckCircle, Circle, Calendar, AlertTriangle, Pencil, Trash2, X, Check } from 'lucide-react'
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

const EMPTY_EXPENSE = { expense_type: '', amount: '', expense_date: new Date().toISOString().split('T')[0], is_paid: false, notes: '' }

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  // Payment state
  const [addingPayment, setAddingPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_type: 'יתרה', payment_method: 'העברה בנקאית', notes: '' })

  // Expense state
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [addExpenseForm, setAddExpenseForm] = useState(EMPTY_EXPENSE)
  const [savingExpense, setSavingExpense] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editExpenseForm, setEditExpenseForm] = useState(EMPTY_EXPENSE)
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Expense | undefined>()

  // Payment edit state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', payment_type: 'יתרה', payment_method: 'העברה בנקאית', notes: '' })
  const [savingPayment, setSavingPayment] = useState(false)
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<Payment | undefined>()

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת ההזמנה' }))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = useCallback(async (field: 'order_status' | 'production_status', value: string) => {
    if (!order) return
    try {
      const updated = await upsertOrder({ ...order, [field]: value })
      setOrder(o => o ? { ...o, [field]: updated[field] } : o)
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
      const { order: synced } = await recordOrderPayment(order, {
        payment_type: paymentForm.payment_type,
        payment_method: paymentForm.payment_method,
        amount,
        notes: paymentForm.notes,
      })
      setOrder(synced)
      setPaymentForm({ amount: '', payment_type: 'יתרה', payment_method: 'העברה בנקאית', notes: '' })
      toast({ type: 'success', title: `תשלום של ${formatCurrency(amount)} נרשם` })
    } catch {
      toast({ type: 'error', title: 'שגיאה ברישום תשלום' })
    } finally {
      setAddingPayment(false)
    }
  }, [order, paymentForm, toast])

  const startEditPayment = useCallback((p: Payment) => {
    setEditingPaymentId(p.id)
    setEditPaymentForm({ amount: String(p.amount), payment_type: p.payment_type || 'יתרה', payment_method: p.payment_method || 'העברה בנקאית', notes: p.notes || '' })
  }, [])

  const recalcAndSavePayments = useCallback(async (newPayments: Payment[]) => {
    if (!order) return
    const synced = await syncOrderPaymentState(order, newPayments)
    setOrder(synced)
  }, [order])

  const handleSaveEditPayment = useCallback(async (paymentId: string) => {
    if (!order) return
    setSavingPayment(true)
    try {
      const original = (order.payments || []).find(p => p.id === paymentId)
      const updated = await upsertPayment({
        id: paymentId,
        order_id: order.id,
        customer_id: order.customer_id,
        payment_type: editPaymentForm.payment_type,
        payment_method: editPaymentForm.payment_method,
        amount: Number(editPaymentForm.amount),
        payment_date: original?.payment_date || new Date().toISOString().split('T')[0],
        is_paid: true,
        notes: editPaymentForm.notes,
      })
      const newPayments = (order.payments || []).map(p => p.id === paymentId ? updated : p)
      await recalcAndSavePayments(newPayments)
      setEditingPaymentId(null)
      toast({ type: 'success', title: 'תשלום עודכן' })
    } catch {
      toast({ type: 'error', title: 'שגיאה בעדכון תשלום' })
    } finally {
      setSavingPayment(false)
    }
  }, [order, editPaymentForm, recalcAndSavePayments, toast])

  const handleDeletePayment = useCallback(async () => {
    if (!deletePaymentTarget || !order) return
    try {
      await deletePayment(deletePaymentTarget.id)
      const newPayments = (order.payments || []).filter(p => p.id !== deletePaymentTarget.id)
      await recalcAndSavePayments(newPayments)
      toast({ type: 'success', title: 'תשלום נמחק' })
    } catch {
      toast({ type: 'error', title: 'שגיאה במחיקת תשלום' })
    }
    setDeletePaymentTarget(undefined)
  }, [deletePaymentTarget, order, recalcAndSavePayments, toast])

  const handleAddExpense = useCallback(async () => {
    if (!order || !addExpenseForm.amount) return
    setSavingExpense(true)
    try {
      const saved = await upsertExpense({
        order_id: order.id,
        expense_type: addExpenseForm.expense_type || undefined,
        amount: Number(addExpenseForm.amount),
        expense_date: addExpenseForm.expense_date,
        is_paid: addExpenseForm.is_paid,
        notes: addExpenseForm.notes || undefined,
      })
      setOrder(o => o ? { ...o, expenses: [...(o.expenses || []), saved] } : o)
      setAddExpenseForm(EMPTY_EXPENSE)
      setShowAddExpense(false)
      toast({ type: 'success', title: `הוצאה של ${formatCurrency(Number(addExpenseForm.amount))} נרשמה` })
    } catch {
      toast({ type: 'error', title: 'שגיאה ברישום הוצאה' })
    } finally {
      setSavingExpense(false)
    }
  }, [order, addExpenseForm, toast])

  const startEditExpense = useCallback((expense: Expense) => {
    setEditingExpenseId(expense.id)
    setEditExpenseForm({
      expense_type: expense.expense_type || '',
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      is_paid: expense.is_paid,
      notes: expense.notes || '',
    })
  }, [])

  const handleSaveEditExpense = useCallback(async (expenseId: string) => {
    if (!order) return
    setSavingExpense(true)
    try {
      const saved = await upsertExpense({
        id: expenseId,
        order_id: order.id,
        expense_type: editExpenseForm.expense_type || undefined,
        amount: Number(editExpenseForm.amount),
        expense_date: editExpenseForm.expense_date,
        is_paid: editExpenseForm.is_paid,
        notes: editExpenseForm.notes || undefined,
      })
      setOrder(o => o ? { ...o, expenses: (o.expenses || []).map(e => e.id === expenseId ? saved : e) } : o)
      setEditingExpenseId(null)
      toast({ type: 'success', title: 'הוצאה עודכנה' })
    } catch {
      toast({ type: 'error', title: 'שגיאה בעדכון הוצאה' })
    } finally {
      setSavingExpense(false)
    }
  }, [order, editExpenseForm, toast])

  const handleToggleExpensePaid = useCallback(async (expense: Expense) => {
    try {
      const saved = await upsertExpense({ ...expense, is_paid: !expense.is_paid })
      setOrder(o => o ? { ...o, expenses: (o.expenses || []).map(e => e.id === expense.id ? saved : e) } : o)
    } catch {
      toast({ type: 'error', title: 'שגיאה בעדכון סטטוס הוצאה' })
    }
  }, [toast])

  const handleDeleteExpense = useCallback(async () => {
    if (!deleteExpenseTarget || !order) return
    try {
      await deleteExpense(deleteExpenseTarget.id)
      setOrder(o => o ? { ...o, expenses: (o.expenses || []).filter(e => e.id !== deleteExpenseTarget.id) } : o)
      toast({ type: 'success', title: 'הוצאה נמחקה' })
    } catch {
      toast({ type: 'error', title: 'שגיאה במחיקת הוצאה' })
    }
    setDeleteExpenseTarget(undefined)
  }, [deleteExpenseTarget, order, toast])

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
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const unpaidExpenses = expenses.filter(e => !e.is_paid).reduce((s, e) => s + e.amount, 0)

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
              <p className="text-xs text-[#7a6a52] mb-0.5">שולם ע&quot;י לקוח</p>
              <p className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div className={cn('rounded-lg p-2 -m-2', order.balance_due > 0 ? 'bg-red-50' : 'bg-emerald-50')}>
              <p className="text-xs text-[#7a6a52] mb-0.5">נשאר לגבות מלקוח</p>
              <p className={cn('font-bold text-base', order.balance_due > 0 ? 'text-red-600' : 'text-emerald-600')}>
                {formatCurrency(order.balance_due)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">סה&quot;כ הוצאות</p>
              <p className="font-medium text-[#2c1810]">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className={cn('rounded-lg p-2 -m-2', unpaidExpenses > 0 ? 'bg-amber-50' : '')}>
              <p className="text-xs text-[#7a6a52] mb-0.5">נשאר לשלם לספקים</p>
              <p className={cn('font-bold text-base', unpaidExpenses > 0 ? 'text-amber-700' : 'text-emerald-600')}>
                {formatCurrency(unpaidExpenses)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">רווח נקי</p>
              <p className={cn('font-medium', getProfitColor(order.profit_margin))}>{formatCurrency(order.net_profit)}</p>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#2c1810] text-sm">תשלומים מלקוח ({payments.length})</h2>
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-[#7a6a52] text-center py-3">אין תשלומים עדיין</p>
          ) : (
            <div className="space-y-2 mb-3">
              {payments.map((p: Payment) => (
                <div key={p.id}>
                  {editingPaymentId === p.id ? (
                    <div className="bg-[#faf8f5] rounded-lg px-3 py-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="סכום" value={editPaymentForm.amount} onChange={e => setEditPaymentForm(f => ({ ...f, amount: e.target.value }))} />
                        <Select value={editPaymentForm.payment_method} onChange={e => setEditPaymentForm(f => ({ ...f, payment_method: e.target.value }))}>
                          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </Select>
                        <Select value={editPaymentForm.payment_type} onChange={e => setEditPaymentForm(f => ({ ...f, payment_type: e.target.value }))}>
                          {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                        <Input placeholder="הערות" value={editPaymentForm.notes} onChange={e => setEditPaymentForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEditPayment(p.id)} disabled={savingPayment}>
                          <Check size={13} />{savingPayment ? 'שומר...' : 'שמור'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingPaymentId(null)}>
                          <X size={13} />ביטול
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm bg-[#faf8f5] rounded-lg px-3 py-2">
                      <div>
                        <span className="font-medium">{p.payment_type}</span>
                        <span className="text-[#7a6a52] mx-1">·</span>
                        <span className="text-[#7a6a52]">{p.payment_method}</span>
                        {p.notes && <span className="text-[#7a6a52] mx-1">· {p.notes}</span>}
                        <p className="text-xs text-[#7a6a52]">{formatDate(p.payment_date)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-emerald-600 ml-2">{formatCurrency(p.amount)}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditPayment(p)} title="עריכה">
                          <Pencil size={13} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletePaymentTarget(p)} title="מחיקה">
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-[#2c1810] text-sm">הוצאות ({expenses.length})</h2>
              {unpaidExpenses > 0 && (
                <p className="text-xs text-amber-700 mt-0.5">נשאר לשלם: {formatCurrency(unpaidExpenses)}</p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => { setShowAddExpense(v => !v); setAddExpenseForm(EMPTY_EXPENSE) }}>
              <Plus size={14} />הוסף הוצאה
            </Button>
          </div>

          {/* Expense rows */}
          {expenses.length === 0 && !showAddExpense ? (
            <p className="text-sm text-[#7a6a52] text-center py-3">אין הוצאות רשומות</p>
          ) : (
            <div className="space-y-2">
              {expenses.map(expense => (
                <div key={expense.id}>
                  {editingExpenseId === expense.id ? (
                    /* Inline edit form */
                    <div className="bg-[#faf8f5] rounded-lg px-3 py-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={editExpenseForm.expense_type} onChange={e => setEditExpenseForm(f => ({ ...f, expense_type: e.target.value }))}>
                          <option value="">סוג הוצאה</option>
                          {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                        <Input type="number" placeholder="סכום" value={editExpenseForm.amount} onChange={e => setEditExpenseForm(f => ({ ...f, amount: e.target.value }))} />
                        <Input type="date" value={editExpenseForm.expense_date} onChange={e => setEditExpenseForm(f => ({ ...f, expense_date: e.target.value }))} />
                        <Input placeholder="הערות" value={editExpenseForm.notes} onChange={e => setEditExpenseForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={editExpenseForm.is_paid} onChange={e => setEditExpenseForm(f => ({ ...f, is_paid: e.target.checked }))} className="rounded" />
                        <span>שולם</span>
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEditExpense(expense.id)} disabled={savingExpense}>
                          <Check size={13} />{savingExpense ? 'שומר...' : 'שמור'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingExpenseId(null)}>
                          <X size={13} />ביטול
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display row */
                    <div className="flex items-center justify-between text-sm bg-[#faf8f5] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => handleToggleExpensePaid(expense)}
                          title={expense.is_paid ? 'סמן כלא שולם' : 'סמן כשולם'}
                          className="shrink-0"
                        >
                          {expense.is_paid
                            ? <CheckCircle size={16} className="text-emerald-500" />
                            : <Circle size={16} className="text-amber-400" />}
                        </button>
                        <div className="min-w-0">
                          <span className="font-medium">{expense.expense_type || 'הוצאה'}</span>
                          {expense.notes && <span className="text-[#7a6a52] text-xs mx-1">· {expense.notes}</span>}
                          <p className="text-xs text-[#7a6a52]">
                            {formatDate(expense.expense_date)} · {expense.is_paid ? 'שולם' : 'ממתין לתשלום'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className={cn('font-bold ml-2', expense.is_paid ? 'text-[#7a6a52]' : 'text-amber-700')}>
                          {formatCurrency(expense.amount)}
                        </p>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditExpense(expense)} title="עריכה">
                          <Pencil size={13} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteExpenseTarget(expense)} title="מחיקה">
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add expense form */}
          {showAddExpense && (
            <div className="mt-3 border-t border-[#e5ddd0] pt-3 space-y-2">
              <p className="text-xs font-semibold text-[#7a6a52]">הוצאה חדשה</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={addExpenseForm.expense_type} onChange={e => setAddExpenseForm(f => ({ ...f, expense_type: e.target.value }))}>
                  <option value="">סוג הוצאה</option>
                  {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Input type="number" placeholder="סכום (₪)" value={addExpenseForm.amount} onChange={e => setAddExpenseForm(f => ({ ...f, amount: e.target.value }))} />
                <Input type="date" value={addExpenseForm.expense_date} onChange={e => setAddExpenseForm(f => ({ ...f, expense_date: e.target.value }))} />
                <Input placeholder="הערות (אופציונלי)" value={addExpenseForm.notes} onChange={e => setAddExpenseForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={addExpenseForm.is_paid} onChange={e => setAddExpenseForm(f => ({ ...f, is_paid: e.target.checked }))} className="rounded" />
                <span>שולם</span>
              </label>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddExpense} disabled={!addExpenseForm.amount || savingExpense}>
                  <Plus size={14} />{savingExpense ? 'שומר...' : 'הוסף הוצאה'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddExpense(false)}><X size={13} />ביטול</Button>
              </div>
            </div>
          )}
        </div>

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

      <ConfirmDialog
        open={!!deleteExpenseTarget}
        onClose={() => setDeleteExpenseTarget(undefined)}
        onConfirm={handleDeleteExpense}
        title="מחיקת הוצאה"
        description={`למחוק הוצאה של ${deleteExpenseTarget ? formatCurrency(deleteExpenseTarget.amount) : ''}?`}
        confirmLabel="מחק"
      />
      <ConfirmDialog
        open={!!deletePaymentTarget}
        onClose={() => setDeletePaymentTarget(undefined)}
        onConfirm={handleDeletePayment}
        title="מחיקת תשלום"
        description={`למחוק תשלום של ${deletePaymentTarget ? formatCurrency(deletePaymentTarget.amount) : ''}?`}
        confirmLabel="מחק"
      />
    </Shell>
  )
}
