'use client'

import { useState, useMemo } from 'react'
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
import { FormField, FormGrid, FormSection } from '@/components/ui/form-field'
import { MetricCard } from '@/components/dashboard/metric-card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { demoPayments, demoExpenses, demoOrders, demoCustomers, demoSuppliers } from '@/lib/demo-data'
import type { Payment, Expense, Order, Customer, Supplier } from '@/lib/types'
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

function PaymentForm({ open, onClose, orders, customers, onSave }: {
  open: boolean
  onClose: () => void
  orders: Order[]
  customers: Customer[]
  onSave: (data: Partial<Payment>) => void
}) {
  const [form, setForm] = useState<Partial<Payment>>({
    payment_date: new Date().toISOString().split('T')[0],
    is_paid: true,
    amount: 0,
  })
  const set = (k: keyof Payment, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }))

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
              {orders.map(o => <option key={o.id} value={o.id}>{o.order_number}</option>)}
            </Select>
          </FormField>
          <FormField label="סוג תשלום" htmlFor="pay_type">
            <Select id="pay_type" value={form.payment_type || ''} onChange={e => set('payment_type', e.target.value)}>
              <option value="">בחר</option>
              {['מקדמה', 'יתרה', 'תשלום מלא', 'החזר'].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="אמצעי תשלום" htmlFor="pay_method">
            <Select id="pay_method" value={form.payment_method || ''} onChange={e => set('payment_method', e.target.value)}>
              <option value="">בחר</option>
              {['מזומן', 'כרטיס אשראי', 'העברה בנקאית', 'ביט', 'פייפאל'].map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </FormField>
          <FormField label="סכום (₪)" htmlFor="pay_amount" required>
            <Input id="pay_amount" type="number" value={form.amount || ''} onChange={e => set('amount', Number(e.target.value))} placeholder="0" />
          </FormField>
          <FormField label="תאריך" htmlFor="pay_date">
            <Input id="pay_date" type="date" value={form.payment_date || ''} onChange={e => set('payment_date', e.target.value)} />
          </FormField>
        </FormGrid>
        <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="הערות..." rows={2} />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ביטול</Button>
        <Button onClick={() => { onSave(form); onClose() }}>הוסף תשלום</Button>
      </DialogFooter>
    </Dialog>
  )
}

function ExpenseForm({ open, onClose, orders, suppliers, onSave }: {
  open: boolean
  onClose: () => void
  orders: Order[]
  suppliers: Supplier[]
  onSave: (data: Partial<Expense>) => void
}) {
  const [form, setForm] = useState<Partial<Expense>>({
    expense_date: new Date().toISOString().split('T')[0],
    is_paid: true,
    amount: 0,
  })
  const set = (k: keyof Expense, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }))

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
              {orders.map(o => <option key={o.id} value={o.id}>{o.order_number}</option>)}
            </Select>
          </FormField>
          <FormField label="סוג הוצאה" htmlFor="exp_type">
            <Select id="exp_type" value={form.expense_type || ''} onChange={e => set('expense_type', e.target.value)}>
              <option value="">בחר</option>
              {['יהלום', 'זהב', 'עבודת ייצור', 'שיבוץ', 'אריזה', 'משלוח', 'שיווק', 'אחר'].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="סכום (₪)" htmlFor="exp_amount" required>
            <Input id="exp_amount" type="number" value={form.amount || ''} onChange={e => set('amount', Number(e.target.value))} placeholder="0" />
          </FormField>
          <FormField label="תאריך" htmlFor="exp_date">
            <Input id="exp_date" type="date" value={form.expense_date || ''} onChange={e => set('expense_date', e.target.value)} />
          </FormField>
          <FormField label="שולם" htmlFor="exp_paid">
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
        <Button onClick={() => { onSave(form); onClose() }}>הוסף הוצאה</Button>
      </DialogFooter>
    </Dialog>
  )
}

export default function FinancialsPage() {
  const [tab, setTab] = useState('payments')
  const [payments, setPayments] = useState<Payment[]>(
    demoPayments.map(p => ({ ...p, created_at: new Date().toISOString() }))
  )
  const [expenses, setExpenses] = useState<Expense[]>(
    demoExpenses.map(e => ({ ...e, created_at: new Date().toISOString() }))
  )
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)

  const orders: Order[] = demoOrders.map(o => ({
    ...o, created_at: '', updated_at: '',
    customers: demoCustomers.find(c => c.id === o.customer_id)
      ? { ...demoCustomers.find(c => c.id === o.customer_id)!, created_at: '', updated_at: '' } : undefined
  }))
  const customers: Customer[] = demoCustomers.map(c => ({ ...c, created_at: '', updated_at: '' }))
  const suppliers: Supplier[] = demoSuppliers.map(s => ({ ...s, created_at: '' }))

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyRevenue = payments.filter(p => new Date(p.payment_date) >= monthStart && p.is_paid).reduce((s, p) => s + p.amount, 0)
  const monthlyExpenses = expenses.filter(e => new Date(e.expense_date) >= monthStart && e.is_paid).reduce((s, e) => s + e.amount, 0)
  const totalRevenue = payments.filter(p => p.is_paid).reduce((s, p) => s + p.amount, 0)
  const totalExpenses = expenses.filter(e => e.is_paid).reduce((s, e) => s + e.amount, 0)

  const addPayment = (data: Partial<Payment>) => {
    const p: Payment = {
      ...data as Payment,
      id: Math.random().toString(36).slice(2),
      amount: data.amount || 0,
      payment_date: data.payment_date || new Date().toISOString().split('T')[0],
      is_paid: data.is_paid !== false,
      created_at: new Date().toISOString(),
      customers: customers.find(c => c.id === data.customer_id),
      orders: orders.find(o => o.id === data.order_id),
    }
    setPayments(prev => [p, ...prev])
  }

  const addExpense = (data: Partial<Expense>) => {
    const e: Expense = {
      ...data as Expense,
      id: Math.random().toString(36).slice(2),
      amount: data.amount || 0,
      expense_date: data.expense_date || new Date().toISOString().split('T')[0],
      is_paid: data.is_paid !== false,
      created_at: new Date().toISOString(),
      suppliers: suppliers.find(s => s.id === data.supplier_id),
      orders: orders.find(o => o.id === data.order_id),
    }
    setExpenses(prev => [e, ...prev])
  }

  return (
    <Shell title="הכנסות והוצאות">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="הכנסות והוצאות" description="ניהול תזרים מזומנים" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard title="הכנסות החודש" value={formatCurrency(monthlyRevenue)} variant="gold" icon={<TrendingUp size={20} />} />
          <MetricCard title="הוצאות החודש" value={formatCurrency(monthlyExpenses)} variant="warning" icon={<TrendingDown size={20} />} />
          <MetricCard title="רווח החודש" value={formatCurrency(monthlyRevenue - monthlyExpenses)} variant={monthlyRevenue >= monthlyExpenses ? 'success' : 'danger'} icon={<DollarSign size={20} />} />
          <MetricCard title="סה״כ הכנסות" value={formatCurrency(totalRevenue)} icon={<TrendingUp size={20} />} />
        </div>

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
                  {payments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.payment_date)}</TableCell>
                      <TableCell className="font-medium">{p.customers?.full_name || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-[#7a6a52]">{p.payment_type || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-[#7a6a52]">{p.payment_method || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p.orders ? (
                          <span className="font-mono text-xs text-[#b8934a]">{p.orders.order_number}</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-700">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={p.is_paid ? 'success' : 'warning'}>
                          {p.is_paid ? 'שולם' : 'ממתין'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>תאריך</TableHead>
                    <TableHead>ספק</TableHead>
                    <TableHead className="hidden sm:table-cell">סוג</TableHead>
                    <TableHead className="hidden md:table-cell">הזמנה</TableHead>
                    <TableHead>סכום</TableHead>
                    <TableHead>שולם</TableHead>
                    <TableHead className="hidden md:table-cell">הערות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{formatDate(e.expense_date)}</TableCell>
                      <TableCell className="font-medium">{e.suppliers?.name || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-[#7a6a52]">{e.expense_type || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {e.orders ? (
                          <span className="font-mono text-xs text-[#b8934a]">{e.orders.order_number}</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="font-semibold text-red-700">{formatCurrency(e.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={e.is_paid ? 'success' : 'warning'}>
                          {e.is_paid ? 'כן' : 'לא'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-[#7a6a52] max-w-[200px] truncate">
                        {e.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <PaymentForm
          open={paymentFormOpen}
          onClose={() => setPaymentFormOpen(false)}
          orders={orders}
          customers={customers}
          onSave={addPayment}
        />
        <ExpenseForm
          open={expenseFormOpen}
          onClose={() => setExpenseFormOpen(false)}
          orders={orders}
          suppliers={suppliers}
          onSave={addExpense}
        />
      </div>
    </Shell>
  )
}
