'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormField, FormGrid } from '@/components/ui/form-field'
import { MetricCard } from '@/components/dashboard/metric-card'
import { TableSkeleton, MetricsSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getPayments, insertPayment, upsertPayment, deletePayment, getExpenses, insertExpense, upsertExpense, deleteExpense, getOrders, getCustomers, getSuppliers } from '@/lib/data'
import { PAYMENT_TYPES, PAYMENT_METHODS, EXPENSE_TYPES } from '@/lib/constants'
import type { Payment, Expense, Order, Customer, Supplier } from '@/lib/types'
import { Plus, TrendingUp, TrendingDown, DollarSign, PiggyBank, Pencil, Trash2 } from 'lucide-react'

// ─── Payment Form ─────────────────────────────────────────────────────────────

function PaymentForm({ open, onClose, orders, customers, payments, payment, onSave }: {
  open: boolean; onClose: () => void; orders: Order[]; customers: Customer[]
  payments: Payment[]; payment?: Payment; onSave: (data: Partial<Payment>) => void
}) {
  const isEdit = !!payment
  const defaults = (): Partial<Payment> => payment ? { ...payment } : {
    payment_date: new Date().toISOString().split('T')[0],
    is_paid: true,
    amount: 0,
  }
  const [form, setForm] = useState<Partial<Payment>>(defaults())
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setForm(defaults()); setError('') }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof Payment, v: string | number | boolean) => {
    setForm(f => ({ ...f, [k]: v })); setError('')
  }

  const handleCustomerChange = (customerId: string) => {
    setForm(f => {
      const orderStillMatches = customerId && f.order_id
        ? orders.find(o => o.id === f.order_id)?.customer_id === customerId : false
      return { ...f, customer_id: customerId, order_id: orderStillMatches ? f.order_id : '' }
    }); setError('')
  }

  const customerOrders = form.customer_id
    ? orders.filter(o => o.customer_id === form.customer_id) : []

  const handleSave = () => {
    if (!form.customer_id) { setError('נא לבחור לקוח'); return }
    if (!form.amount || form.amount <= 0) { setError('נא להזין סכום חיובי'); return }
    if (!isEdit && form.order_id && form.amount && form.payment_date) {
      const dup = payments.find(p =>
        p.order_id === form.order_id && p.amount === form.amount && p.payment_date === form.payment_date
      )
      if (dup) { setError('קיים תשלום זהה עבור הזמנה זו'); return }
    }
    onSave(form); onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg mx-4">
      <DialogHeader title={isEdit ? 'עריכת תשלום' : 'הוסף תשלום'} onClose={onClose} />
      <DialogBody className="space-y-4">
        <FormGrid>
          <FormField label="לקוח" required htmlFor="pay_customer" error={!form.customer_id && error === 'נא לבחור לקוח' ? error : ''}>
            <Select id="pay_customer" value={form.customer_id || ''} onChange={e => handleCustomerChange(e.target.value)}>
              <option value="">בחר לקוח תחילה</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </Select>
          </FormField>
          <FormField label="הזמנה" htmlFor="pay_order">
            {form.customer_id ? (
              <Select id="pay_order" value={form.order_id || ''} onChange={e => set('order_id', e.target.value)}>
                <option value="">{customerOrders.length === 0 ? 'אין הזמנות ללקוח זה' : 'בחר הזמנה (אופציונלי)'}</option>
                {customerOrders.map(o => (
                  <option key={o.id} value={o.id}>{o.order_number} — {o.description || o.jewelry_type || ''}</option>
                ))}
              </Select>
            ) : (
              <div className="px-3 py-2 rounded-lg border border-[#e5ddd0] bg-[#f5efe0] text-sm text-[#7a6a52] cursor-not-allowed">יש לבחור לקוח תחילה</div>
            )}
          </FormField>
          <FormField label="סוג תשלום" htmlFor="pay_type">
            <Select id="pay_type" value={form.payment_type || ''} onChange={e => set('payment_type', e.target.value)}>
              <option value="">בחר</option>
              {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="אמצעי תשלום" htmlFor="pay_method">
            <Select id="pay_method" value={form.payment_method || ''} onChange={e => set('payment_method', e.target.value)}>
              <option value="">בחר</option>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </FormField>
          <FormField label="סכום (₪)" required htmlFor="pay_amount" error={error !== 'נא לבחור לקוח' ? error : ''}>
            <Input id="pay_amount" type="number" value={form.amount || ''} onChange={e => set('amount', Number(e.target.value))} placeholder="0" />
          </FormField>
          <FormField label="תאריך" htmlFor="pay_date">
            <Input id="pay_date" type="date" value={form.payment_date || ''} onChange={e => set('payment_date', e.target.value)} />
          </FormField>
          <FormField label="שולם?" htmlFor="pay_paid">
            <Select id="pay_paid" value={form.is_paid ? 'yes' : 'no'} onChange={e => set('is_paid', e.target.value === 'yes')}>
              <option value="yes">כן</option>
              <option value="no">לא</option>
            </Select>
          </FormField>
        </FormGrid>
        <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="הערות..." rows={2} />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ביטול</Button>
        <Button onClick={handleSave}>{isEdit ? 'שמור שינויים' : 'הוסף תשלום'}</Button>
      </DialogFooter>
    </Dialog>
  )
}

// ─── Expense Form ─────────────────────────────────────────────────────────────

function ExpenseForm({ open, onClose, orders, suppliers, expenses, expense, onSave }: {
  open: boolean; onClose: () => void; orders: Order[]; suppliers: Supplier[]
  expenses: Expense[]; expense?: Expense; onSave: (data: Partial<Expense>) => void
}) {
  const isEdit = !!expense
  const defaults = (): Partial<Expense> => expense ? { ...expense } : {
    expense_date: new Date().toISOString().split('T')[0],
    is_paid: true,
    amount: 0,
  }
  const [form, setForm] = useState<Partial<Expense>>(defaults())
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setForm(defaults()); setError('') }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof Expense, v: string | number | boolean) => {
    setForm(f => ({ ...f, [k]: v })); setError('')
  }

  const handleSave = () => {
    if (!form.amount || form.amount <= 0) { setError('נא להזין סכום חיובי'); return }
    if (!isEdit && form.order_id && form.amount && form.expense_date) {
      const dup = expenses.find(e =>
        e.order_id === form.order_id && e.amount === form.amount &&
        e.expense_date === form.expense_date && e.expense_type === form.expense_type
      )
      if (dup) { setError('קיימת הוצאה זהה עבור הזמנה זו'); return }
    }
    onSave(form); onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg mx-4">
      <DialogHeader title={isEdit ? 'עריכת הוצאה' : 'הוסף הוצאה'} onClose={onClose} />
      <DialogBody className="space-y-4">
        <FormGrid>
          <FormField label="ספק" htmlFor="exp_supplier">
            <Select id="exp_supplier" value={form.supplier_id || ''} onChange={e => set('supplier_id', e.target.value)}>
              <option value="">בחר ספק</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
          <FormField label="הזמנה" htmlFor="exp_order">
            <Select id="exp_order" value={form.order_id || ''} onChange={e => set('order_id', e.target.value)}>
              <option value="">בחר הזמנה</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} – {o.customers?.full_name}</option>)}
            </Select>
          </FormField>
          <FormField label="סוג הוצאה" htmlFor="exp_type">
            <Select id="exp_type" value={form.expense_type || ''} onChange={e => set('expense_type', e.target.value)}>
              <option value="">בחר</option>
              {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="סכום (₪)" required htmlFor="exp_amount" error={error}>
            <Input id="exp_amount" type="number" value={form.amount || ''} onChange={e => set('amount', Number(e.target.value))} placeholder="0" />
          </FormField>
          <FormField label="תאריך" htmlFor="exp_date">
            <Input id="exp_date" type="date" value={form.expense_date || ''} onChange={e => set('expense_date', e.target.value)} />
          </FormField>
          <FormField label="שולם?" htmlFor="exp_paid">
            <Select id="exp_paid" value={form.is_paid ? 'yes' : 'no'} onChange={e => set('is_paid', e.target.value === 'yes')}>
              <option value="yes">כן</option>
              <option value="no">לא</option>
            </Select>
          </FormField>
        </FormGrid>
        <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="הערות..." rows={2} />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ביטול</Button>
        <Button onClick={handleSave}>{isEdit ? 'שמור שינויים' : 'הוסף הוצאה'}</Button>
      </DialogFooter>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinancialsPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState('payments')
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  // Payment form state
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>()
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<Payment | undefined>()

  // Expense form state
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Expense | undefined>()

  const enrichPayment = useCallback((p: Payment) => ({
    ...p,
    customers: customers.find(c => c.id === p.customer_id),
    orders: orders.find(o => o.id === p.order_id),
  }), [customers, orders])

  const enrichExpense = useCallback((e: Expense) => ({
    ...e,
    suppliers: suppliers.find(s => s.id === e.supplier_id),
    orders: orders.find(o => o.id === e.order_id),
  }), [suppliers, orders])

  useEffect(() => {
    Promise.all([getPayments(), getExpenses(), getOrders(), getCustomers(), getSuppliers()])
      .then(([pay, exp, ord, cust, supp]) => {
        const custMap = Object.fromEntries(cust.map(c => [c.id, c]))
        const suppMap = Object.fromEntries(supp.map(s => [s.id, s]))
        const ordMap = Object.fromEntries(ord.map(o => [o.id, { ...o, customers: custMap[o.customer_id || ''] }]))
        setPayments(pay.map(p => ({ ...p, customers: custMap[p.customer_id || ''], orders: ordMap[p.order_id || ''] })))
        setExpenses(exp.map(e => ({ ...e, suppliers: suppMap[e.supplier_id || ''], orders: ordMap[e.order_id || ''] })))
        setOrders(ord.map(o => ({ ...o, customers: custMap[o.customer_id || ''] })))
        setCustomers(cust)
        setSuppliers(supp)
      })
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת הנתונים' }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { monthlyRevenue, monthlyExpenses, unpaidExpenses } = useMemo(() => {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    return {
      monthlyRevenue: payments.filter(p => p.is_paid && new Date(p.payment_date) >= monthStart).reduce((s, p) => s + p.amount, 0),
      monthlyExpenses: expenses.filter(e => e.is_paid && new Date(e.expense_date) >= monthStart).reduce((s, e) => s + e.amount, 0),
      unpaidExpenses: expenses.filter(e => !e.is_paid).reduce((s, e) => s + e.amount, 0),
    }
  }, [payments, expenses])

  // ── Payment handlers ────────────────────────────────────────────────────────

  const handleSavePayment = useCallback(async (data: Partial<Payment>) => {
    try {
      if (editingPayment) {
        const saved = await upsertPayment({ ...editingPayment, ...data })
        setPayments(prev => prev.map(p => p.id === saved.id ? enrichPayment(saved) : p))
        toast({ type: 'success', title: 'תשלום עודכן' })
      } else {
        const saved = await insertPayment(data)
        setPayments(prev => [enrichPayment(saved), ...prev])
        toast({ type: 'success', title: 'תשלום נוסף' })
      }
    } catch {
      toast({ type: 'error', title: 'שגיאה בשמירת התשלום' })
    }
    setEditingPayment(undefined)
  }, [editingPayment, enrichPayment, toast])

  const handleDeletePayment = useCallback(async () => {
    if (!deletePaymentTarget) return
    try {
      await deletePayment(deletePaymentTarget.id)
      setPayments(prev => prev.filter(p => p.id !== deletePaymentTarget.id))
      toast({ type: 'success', title: 'תשלום נמחק' })
    } catch {
      toast({ type: 'error', title: 'שגיאה במחיקת התשלום' })
    }
    setDeletePaymentTarget(undefined)
  }, [deletePaymentTarget, toast])

  // ── Expense handlers ────────────────────────────────────────────────────────

  const handleSaveExpense = useCallback(async (data: Partial<Expense>) => {
    try {
      if (editingExpense) {
        const saved = await upsertExpense({ ...editingExpense, ...data })
        setExpenses(prev => prev.map(e => e.id === saved.id ? enrichExpense(saved) : e))
        toast({ type: 'success', title: 'הוצאה עודכנה' })
      } else {
        const saved = await insertExpense(data)
        setExpenses(prev => [enrichExpense(saved), ...prev])
        toast({ type: 'success', title: 'הוצאה נוספה' })
      }
    } catch {
      toast({ type: 'error', title: 'שגיאה בשמירת ההוצאה' })
    }
    setEditingExpense(undefined)
  }, [editingExpense, enrichExpense, toast])

  const handleDeleteExpense = useCallback(async () => {
    if (!deleteExpenseTarget) return
    try {
      await deleteExpense(deleteExpenseTarget.id)
      setExpenses(prev => prev.filter(e => e.id !== deleteExpenseTarget.id))
      toast({ type: 'success', title: 'הוצאה נמחקה' })
    } catch {
      toast({ type: 'error', title: 'שגיאה במחיקת ההוצאה' })
    }
    setDeleteExpenseTarget(undefined)
  }, [deleteExpenseTarget, toast])

  return (
    <Shell title="הכנסות והוצאות">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="הכנסות והוצאות" description="ניהול תזרים מזומנים" />

        {loading ? <MetricsSkeleton /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard title="הכנסות החודש" value={formatCurrency(monthlyRevenue)} variant="gold" icon={<TrendingUp size={20} />} />
            <MetricCard title="הוצאות החודש" value={formatCurrency(monthlyExpenses)} variant="warning" icon={<TrendingDown size={20} />} />
            <MetricCard
              title="רווח החודש"
              value={formatCurrency(monthlyRevenue - monthlyExpenses)}
              variant={monthlyRevenue >= monthlyExpenses ? 'success' : 'danger'}
              icon={<DollarSign size={20} />}
            />
            <MetricCard title="הוצאות לא שולמו" value={formatCurrency(unpaidExpenses)} variant={unpaidExpenses > 0 ? 'danger' : 'success'} icon={<PiggyBank size={20} />} />
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="payments">הכנסות ({payments.length})</TabsTrigger>
              <TabsTrigger value="expenses">הוצאות ({expenses.length})</TabsTrigger>
            </TabsList>
            <Button onClick={() => {
              if (tab === 'payments') { setEditingPayment(undefined); setPaymentFormOpen(true) }
              else { setEditingExpense(undefined); setExpenseFormOpen(true) }
            }}>
              <Plus size={16} />
              {tab === 'payments' ? 'הוסף תשלום' : 'הוסף הוצאה'}
            </Button>
          </div>

          {/* ── Payments tab ── */}
          <TabsContent value="payments">
            <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
              {loading ? <TableSkeleton rows={4} cols={6} /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>תאריך</TableHead>
                      <TableHead>לקוח</TableHead>
                      <TableHead className="hidden sm:table-cell">סוג</TableHead>
                      <TableHead className="hidden md:table-cell">אמצעי</TableHead>
                      <TableHead className="hidden md:table-cell">הזמנה</TableHead>
                      <TableHead>סכום</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-[#7a6a52] py-12">אין תשלומים עדיין</TableCell>
                      </TableRow>
                    )}
                    {payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{formatDate(p.payment_date)}</TableCell>
                        <TableCell className="font-medium">{p.customers?.full_name || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-[#7a6a52] text-sm">{p.payment_type || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-[#7a6a52] text-sm">{p.payment_method || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {p.orders ? <span className="font-mono text-xs text-[#b8934a]">{p.orders.order_number}</span> : '—'}
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-700">{formatCurrency(p.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={p.is_paid ? 'success' : 'warning'}>{p.is_paid ? 'שולם' : 'ממתין'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="עריכה"
                              onClick={() => { setEditingPayment(p); setPaymentFormOpen(true) }}>
                              <Pencil size={13} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" title="מחיקה"
                              onClick={() => setDeletePaymentTarget(p)}>
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* ── Expenses tab ── */}
          <TabsContent value="expenses">
            <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
              {loading ? <TableSkeleton rows={4} cols={6} /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>תאריך</TableHead>
                      <TableHead>ספק</TableHead>
                      <TableHead className="hidden sm:table-cell">סוג</TableHead>
                      <TableHead className="hidden md:table-cell">הזמנה</TableHead>
                      <TableHead>סכום</TableHead>
                      <TableHead>שולם</TableHead>
                      <TableHead className="hidden lg:table-cell">הערות</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-[#7a6a52] py-12">אין הוצאות עדיין</TableCell>
                      </TableRow>
                    )}
                    {expenses.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm">{formatDate(e.expense_date)}</TableCell>
                        <TableCell className="font-medium">{e.suppliers?.name || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-[#7a6a52] text-sm">{e.expense_type || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {e.orders ? <span className="font-mono text-xs text-[#b8934a]">{e.orders.order_number}</span> : '—'}
                        </TableCell>
                        <TableCell className="font-semibold text-red-700">{formatCurrency(e.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={e.is_paid ? 'success' : 'warning'}>{e.is_paid ? 'כן' : 'לא'}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-[#7a6a52] text-sm max-w-[200px] truncate">{e.notes || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="עריכה"
                              onClick={() => { setEditingExpense(e); setExpenseFormOpen(true) }}>
                              <Pencil size={13} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" title="מחיקה"
                              onClick={() => setDeleteExpenseTarget(e)}>
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment dialogs */}
        <PaymentForm
          open={paymentFormOpen}
          onClose={() => { setPaymentFormOpen(false); setEditingPayment(undefined) }}
          orders={orders}
          customers={customers}
          payments={payments}
          payment={editingPayment}
          onSave={handleSavePayment}
        />
        <ConfirmDialog
          open={!!deletePaymentTarget}
          onClose={() => setDeletePaymentTarget(undefined)}
          onConfirm={handleDeletePayment}
          title="מחיקת תשלום"
          description={`למחוק תשלום של ${deletePaymentTarget ? formatCurrency(deletePaymentTarget.amount) : ''} מ-${deletePaymentTarget?.customers?.full_name || ''}?`}
          confirmLabel="מחק"
        />

        {/* Expense dialogs */}
        <ExpenseForm
          open={expenseFormOpen}
          onClose={() => { setExpenseFormOpen(false); setEditingExpense(undefined) }}
          orders={orders}
          suppliers={suppliers}
          expenses={expenses}
          expense={editingExpense}
          onSave={handleSaveExpense}
        />
        <ConfirmDialog
          open={!!deleteExpenseTarget}
          onClose={() => setDeleteExpenseTarget(undefined)}
          onConfirm={handleDeleteExpense}
          title="מחיקת הוצאה"
          description={`למחוק הוצאה של ${deleteExpenseTarget ? formatCurrency(deleteExpenseTarget.amount) : ''}?`}
          confirmLabel="מחק"
        />
      </div>
    </Shell>
  )
}
