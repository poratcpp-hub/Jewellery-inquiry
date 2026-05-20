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
import { FormField, FormGrid } from '@/components/ui/form-field'
import { MetricCard } from '@/components/dashboard/metric-card'
import { TableSkeleton, MetricsSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getPayments, insertPayment, getExpenses, insertExpense, getOrders, getCustomers, getSuppliers } from '@/lib/data'
import { PAYMENT_TYPES, PAYMENT_METHODS, EXPENSE_TYPES } from '@/lib/constants'
import type { Payment, Expense, Order, Customer, Supplier } from '@/lib/types'
import { Plus, TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react'

function PaymentForm({ open, onClose, orders, customers, onSave }: {
  open: boolean; onClose: () => void; orders: Order[]; customers: Customer[]
  onSave: (data: Partial<Payment>) => void
}) {
  const [form, setForm] = useState<Partial<Payment>>({ payment_date: new Date().toISOString().split('T')[0], is_paid: true, amount: 0 })
  const [error, setError] = useState('')
  const set = (k: keyof Payment, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.amount || form.amount <= 0) { setError('נא להזין סכום חיובי'); return }
    onSave(form); onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg mx-4">
      <DialogHeader title="הוסף תשלום" onClose={onClose} />
      <DialogBody className="space-y-4">
        <FormGrid>
          <FormField label="לקוח" htmlFor="pay_customer">
            <Select id="pay_customer" value={form.customer_id || ''} onChange={e => set('customer_id', e.target.value)}>
              <option value="">בחר לקוח</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </Select>
          </FormField>
          <FormField label="הזמנה" htmlFor="pay_order">
            <Select id="pay_order" value={form.order_id || ''} onChange={e => set('order_id', e.target.value)}>
              <option value="">בחר הזמנה</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} – {o.customers?.full_name}</option>)}
            </Select>
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
          <FormField label="סכום (₪)" required htmlFor="pay_amount" error={error}>
            <Input id="pay_amount" type="number" value={form.amount || ''} onChange={e => { set('amount', Number(e.target.value)); setError('') }} placeholder="0" />
          </FormField>
          <FormField label="תאריך" htmlFor="pay_date">
            <Input id="pay_date" type="date" value={form.payment_date || ''} onChange={e => set('payment_date', e.target.value)} />
          </FormField>
        </FormGrid>
        <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="הערות..." rows={2} />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ביטול</Button>
        <Button onClick={handleSave}>הוסף תשלום</Button>
      </DialogFooter>
    </Dialog>
  )
}

function ExpenseForm({ open, onClose, orders, suppliers, onSave }: {
  open: boolean; onClose: () => void; orders: Order[]; suppliers: Supplier[]
  onSave: (data: Partial<Expense>) => void
}) {
  const [form, setForm] = useState<Partial<Expense>>({ expense_date: new Date().toISOString().split('T')[0], is_paid: true, amount: 0 })
  const [error, setError] = useState('')
  const set = (k: keyof Expense, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.amount || form.amount <= 0) { setError('נא להזין סכום חיובי'); return }
    onSave(form); onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg mx-4">
      <DialogHeader title="הוסף הוצאה" onClose={onClose} />
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
            <Input id="exp_amount" type="number" value={form.amount || ''} onChange={e => { set('amount', Number(e.target.value)); setError('') }} placeholder="0" />
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
        <Button onClick={handleSave}>הוסף הוצאה</Button>
      </DialogFooter>
    </Dialog>
  )
}

export default function FinancialsPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState('payments')
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)

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
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    return {
      monthlyRevenue: payments.filter(p => p.is_paid && new Date(p.payment_date) >= monthStart).reduce((s, p) => s + p.amount, 0),
      monthlyExpenses: expenses.filter(e => e.is_paid && new Date(e.expense_date) >= monthStart).reduce((s, e) => s + e.amount, 0),
      unpaidExpenses: expenses.filter(e => !e.is_paid).reduce((s, e) => s + e.amount, 0),
    }
  }, [payments, expenses])

  const addPayment = useCallback(async (data: Partial<Payment>) => {
    try {
      const saved = await insertPayment(data)
      const enriched = {
        ...saved,
        customers: customers.find(c => c.id === saved.customer_id),
        orders: orders.find(o => o.id === saved.order_id),
      }
      setPayments(prev => [{ ...enriched, id: enriched.id || Math.random().toString(36).slice(2) }, ...prev])
      toast({ type: 'success', title: 'תשלום נוסף בהצלחה' })
    } catch {
      toast({ type: 'error', title: 'שגיאה בהוספת התשלום' })
    }
  }, [customers, orders, toast])

  const addExpense = useCallback(async (data: Partial<Expense>) => {
    try {
      const saved = await insertExpense(data)
      const enriched = {
        ...saved,
        suppliers: suppliers.find(s => s.id === saved.supplier_id),
        orders: orders.find(o => o.id === saved.order_id),
      }
      setExpenses(prev => [{ ...enriched, id: enriched.id || Math.random().toString(36).slice(2) }, ...prev])
      toast({ type: 'success', title: 'הוצאה נוספה בהצלחה' })
    } catch {
      toast({ type: 'error', title: 'שגיאה בהוספת ההוצאה' })
    }
  }, [suppliers, orders, toast])

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
            <Button onClick={() => tab === 'payments' ? setPaymentFormOpen(true) : setExpenseFormOpen(true)}>
              <Plus size={16} />
              {tab === 'payments' ? 'הוסף תשלום' : 'הוסף הוצאה'}
            </Button>
          </div>

          <TabsContent value="payments">
            <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
              {loading ? <TableSkeleton rows={4} cols={5} /> : (
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-[#7a6a52] py-12">אין תשלומים עדיין</TableCell>
                      </TableRow>
                    )}
                    {payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.payment_date)}</TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
              {loading ? <TableSkeleton rows={4} cols={5} /> : (
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-[#7a6a52] py-12">אין הוצאות עדיין</TableCell>
                      </TableRow>
                    )}
                    {expenses.map(e => (
                      <TableRow key={e.id}>
                        <TableCell>{formatDate(e.expense_date)}</TableCell>
                        <TableCell className="font-medium">{e.suppliers?.name || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-[#7a6a52] text-sm">{e.expense_type || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {e.orders ? <span className="font-mono text-xs text-[#b8934a]">{e.orders.order_number}</span> : '—'}
                        </TableCell>
                        <TableCell className="font-semibold text-red-700">{formatCurrency(e.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={e.is_paid ? 'success' : 'warning'}>{e.is_paid ? 'כן' : 'לא'}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-[#7a6a52] text-sm max-w-[200px] truncate">
                          {e.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <PaymentForm open={paymentFormOpen} onClose={() => setPaymentFormOpen(false)} orders={orders} customers={customers} onSave={addPayment} />
        <ExpenseForm open={expenseFormOpen} onClose={() => setExpenseFormOpen(false)} orders={orders} suppliers={suppliers} onSave={addExpense} />
      </div>
    </Shell>
  )
}
