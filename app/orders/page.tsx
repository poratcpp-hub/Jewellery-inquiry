'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FilterChips } from '@/components/ui/filter-chips'
import { Table, TableHeader, TableBody, TableRow, SortableHead, TableCell } from '@/components/ui/table'
import { OrderForm } from '@/components/orders/order-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { FormField, FormGrid } from '@/components/ui/form-field'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useDebounce, useTableSort, useResetOnOpen } from '@/lib/hooks'
import { formatCurrency, formatDate, daysUntil, exportCsv } from '@/lib/utils'
import { getOrders, upsertOrder, createOrder, changeOrderStatus, deleteOrder, getCustomers, getSuppliers, refreshCustomerStats, syncOrderPaymentStateById, recordOrderPayment } from '@/lib/data'
import { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS, CLOSED_ORDER_STATUSES } from '@/lib/constants'
import { InlineStatusSelect } from '@/components/ui/inline-status-select'
import type { Order, Customer, Supplier, Payment } from '@/lib/types'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, AlertTriangle, Download, Eye, HandCoins } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Quick payment ────────────────────────────────────────────────────────────
// One-click payment recording straight from the orders table. The payment is
// booked into the income ledger and the order's balance/status re-derive.

function QuickPaymentDialog({ order, onClose, onSave }: {
  order?: Order
  onClose: () => void
  onSave: (order: Order, data: Partial<Payment>) => Promise<void>
}) {
  const open = !!order
  const balance = Math.max(0, Number(order?.balance_due ?? 0))
  const nothingPaid = order?.payment_status === 'לא שולם'

  const defaults = (): Partial<Payment> => ({
    amount: balance > 0 ? balance : undefined,
    payment_type: nothingPaid ? (balance > 0 && balance === Number(order?.sale_price ?? 0) ? 'תשלום מלא' : 'מקדמה') : 'יתרה',
    payment_method: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [form, setForm] = useState<Partial<Payment>>(defaults())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useResetOnOpen(open, () => { setForm(defaults()); setError(''); setSaving(false) })

  const set = (k: keyof Payment, v: string | number) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const handleSave = async () => {
    if (!order) return
    const amount = Number(form.amount ?? 0)
    if (!amount || amount <= 0) { setError('נא להזין סכום חיובי'); return }
    setSaving(true)
    try {
      await onSave(order, { ...form, amount })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!order) return null
  return (
    <Dialog open={open} onClose={onClose} className="max-w-md mx-4">
      <DialogHeader title={`תשלום עבור ${order.order_number}`} onClose={onClose} />
      <DialogBody className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-champagne/60 px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-ink">{order.customers?.full_name || '—'}</p>
            <p className="text-xs text-clay">{order.jewelry_type || order.description || ''}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-clay">יתרה לתשלום</p>
            <p className={cn('font-bold tabular-nums', balance > 0 ? 'text-red-600' : 'text-emerald-600')}>{formatCurrency(balance)}</p>
          </div>
        </div>
        <FormGrid>
          <FormField label="סכום (₪)" required htmlFor="qp_amount" error={error}>
            <Input id="qp_amount" type="number" value={form.amount ?? ''} onChange={e => set('amount', Number(e.target.value))} placeholder="0" />
          </FormField>
          <FormField label="סוג תשלום" htmlFor="qp_type">
            <Select id="qp_type" value={form.payment_type || ''} onChange={e => set('payment_type', e.target.value)}>
              <option value="מקדמה">מקדמה</option>
              <option value="יתרה">יתרה</option>
              <option value="תשלום מלא">תשלום מלא</option>
            </Select>
          </FormField>
          <FormField label="אמצעי תשלום" htmlFor="qp_method">
            <Select id="qp_method" value={form.payment_method || ''} onChange={e => set('payment_method', e.target.value)}>
              <option value="">בחר</option>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </FormField>
          <FormField label="תאריך" htmlFor="qp_date">
            <Input id="qp_date" type="date" value={form.payment_date || ''} onChange={e => set('payment_date', e.target.value)} />
          </FormField>
        </FormGrid>
        <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="הערות..." rows={2} />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ביטול</Button>
        <Button onClick={handleSave} disabled={saving}>
          <HandCoins size={15} />
          {saving ? 'שומר...' : 'רשום תשלום'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

export default function OrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Order | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Order | undefined>()
  const [paymentTarget, setPaymentTarget] = useState<Order | undefined>()

  useEffect(() => {
    Promise.all([getOrders(), getCustomers(), getSuppliers()])
      .then(([o, c, s]) => {
        const custMap = Object.fromEntries(c.map(x => [x.id, x]))
        const suppMap = Object.fromEntries(s.map(x => [x.id, x]))
        setOrders(o.map(order => ({
          ...order,
          customers: custMap[order.customer_id || ''] || order.customers,
          suppliers: suppMap[order.supplier_id || ''] || order.suppliers,
        })))
        setCustomers(c)
        setSuppliers(s)
      })
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת הנתונים' }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useDebounce(useCallback((q: string) => setSearch(q), []), 200)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o => {
      const match = !q || (o.order_number || '').toLowerCase().includes(q) ||
        (o.customers?.full_name || '').toLowerCase().includes(q)
      return match && (!statusFilter || o.order_status === statusFilter)
    })
  }, [orders, search, statusFilter])

  const { sorted, sortKey, sortDir, toggleSort } = useTableSort<Order>(filtered, 'created_at', 'desc')

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    orders.forEach(o => { counts[o.order_status] = (counts[o.order_status] || 0) + 1 })
    return counts
  }, [orders])

  const { totalRevenue, totalBalance } = useMemo(() => ({
    totalRevenue: filtered.reduce((s, o) => s + o.sale_price, 0),
    totalBalance: filtered.filter(o => o.payment_status !== 'שולם במלואו').reduce((s, o) => s + o.balance_due, 0),
  }), [filtered])

  const enrich = useCallback((order: Partial<Order>) => ({
    ...order,
    customers: customers.find(c => c.id === order.customer_id) || (order as Order).customers,
    suppliers: suppliers.find(s => s.id === order.supplier_id) || (order as Order).suppliers,
  }), [customers, suppliers])

  const handleSave = useCallback(async (data: Partial<Order>) => {
    try {
      if (editing) {
        const saved = await upsertOrder({ ...editing, ...data })
        // If the sale price changed, re-derive balance/payment status from
        // the payments actually recorded on the order
        const synced = await syncOrderPaymentStateById(saved.id, { onlyIfPayments: true })
        const next = enrich(synced ? { ...saved, ...synced } : saved)
        setOrders(prev => prev.map(o => o.id === editing.id ? next as Order : o))
        toast({ type: 'success', title: 'ההזמנה עודכנה' })
      } else {
        // createOrder books the deposit as a payment and advances the status
        const saved = await createOrder(data)
        setOrders(prev => [enrich(saved) as Order, ...prev])
        const deposit = Number(data.deposit_amount ?? 0)
        toast({
          type: 'success',
          title: 'הזמנה חדשה נוצרה',
          description: deposit > 0 ? `מקדמה של ${formatCurrency(deposit)} נרשמה אוטומטית בהכנסות` : undefined,
        })
      }
      // Fire-and-forget: refresh customer stats after save
      if (data.customer_id) {
        refreshCustomerStats(data.customer_id).catch(() => {})
      }
    } catch (err) {
      console.error('[handleSave] Error saving order:', err)
      toast({ type: 'error', title: 'שגיאה בשמירת ההזמנה' })
    }
    setEditing(undefined)
  }, [editing, enrich, toast])

  const handleStatusChange = useCallback(async (order: Order, newStatus: string) => {
    try {
      const updated = await changeOrderStatus(order, newStatus)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, order_status: updated.order_status } : o))
    } catch {
      toast({ type: 'error', title: 'שגיאה בעדכון סטטוס' })
    }
  }, [toast])

  const handlePaymentStatusChange = useCallback(async (order: Order, newStatus: string) => {
    try {
      await upsertOrder({ id: order.id, payment_status: newStatus, customer_id: order.customer_id || undefined })
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status: newStatus } : o))
    } catch {
      toast({ type: 'error', title: 'שגיאה בעדכון סטטוס תשלום' })
    }
  }, [toast])

  const handleQuickPayment = useCallback(async (order: Order, data: Partial<Payment>) => {
    try {
      const { order: synced } = await recordOrderPayment(order, data)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...synced, customers: o.customers, suppliers: o.suppliers } : o))
      toast({
        type: 'success',
        title: 'התשלום נרשם בהכנסות',
        description: `${formatCurrency(Number(data.amount ?? 0))} עבור ${order.order_number} · יתרה מעודכנת: ${formatCurrency(synced.balance_due)}`,
      })
      refreshCustomerStats(order.customer_id).catch(() => {})
    } catch {
      toast({ type: 'error', title: 'שגיאה ברישום התשלום' })
      throw new Error('payment failed')
    }
  }, [toast])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteOrder(deleteTarget.id)
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id))
      toast({ type: 'success', title: 'ההזמנה נמחקה' })
    } catch {
      toast({ type: 'error', title: 'שגיאה במחיקת ההזמנה' })
    }
    setDeleteTarget(undefined)
  }, [deleteTarget, toast])

  const handleExport = useCallback(() => {
    exportCsv('orders', sorted.map(o => ({
      'מספר הזמנה': o.order_number,
      לקוח: o.customers?.full_name || '',
      תכשיט: o.jewelry_type || '',
      'סוג יהלום': o.diamond_type || '',
      'סטטוס הזמנה': o.order_status,
      'סטטוס תשלום': o.payment_status,
      'מחיר מכירה': o.sale_price,
      'יתרה לגביה': o.balance_due,
      'תאריך מסירה': o.delivery_date || '',
    })))
  }, [sorted])

  const openEdit = useCallback((o: Order) => { setEditing(o); setFormOpen(true) }, [])
  const openNew = useCallback(() => { setEditing(undefined); setFormOpen(true) }, [])
  const closeForm = useCallback(() => { setFormOpen(false); setEditing(undefined) }, [])

  return (
    <Shell title="הזמנות">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="הזמנות"
          description={`${filtered.length} הזמנות · שווי ${formatCurrency(totalRevenue)} · יתרה ${formatCurrency(totalBalance)}`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} title="ייצוא CSV">
                <Download size={15} /><span className="hidden sm:inline">ייצוא</span>
              </Button>
              <Button onClick={openNew}><Plus size={16} />הזמנה חדשה</Button>
            </div>
          }
        />

        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
            <Input className="pr-9" placeholder="חיפוש לפי מספר הזמנה, לקוח..." onChange={e => handleSearch(e.target.value)} />
          </div>
          <FilterChips options={ORDER_STATUSES} value={statusFilter} onChange={setStatusFilter} counts={statusCounts} allCount={orders.length} />
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? <TableSkeleton rows={5} cols={7} /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead sortKey="order_number" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Order)}>מספר הזמנה</SortableHead>
                  <SortableHead>לקוח</SortableHead>
                  <SortableHead className="hidden md:table-cell">תכשיט</SortableHead>
                  <SortableHead sortKey="order_status" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Order)}>סטטוס</SortableHead>
                  <SortableHead className="hidden sm:table-cell">תשלום</SortableHead>
                  <SortableHead sortKey="sale_price" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Order)}>מחיר</SortableHead>
                  <SortableHead sortKey="balance_due" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Order)} className="hidden lg:table-cell">יתרה</SortableHead>
                  <SortableHead sortKey="delivery_date" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Order)} className="hidden md:table-cell">מסירה</SortableHead>
                  <SortableHead>פעולות</SortableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-[#7a6a52] py-12 text-sm">
                    {search || statusFilter ? 'לא נמצאו הזמנות התואמות לחיפוש' : 'אין הזמנות עדיין'}
                  </td></tr>
                )}
                {sorted.map(order => {
                  const days = daysUntil(order.delivery_date)
                  const isUrgent = days !== null && days <= 3 && !CLOSED_ORDER_STATUSES.has(order.order_status)
                  return (
                    <TableRow key={order.id}>
                      <TableCell><span className="font-mono text-sm font-medium text-[#b8934a]">{order.order_number}</span></TableCell>
                      <TableCell>
                        <div className="font-medium text-[#2c1810]">{order.customers?.full_name || '—'}</div>
                        {order.production_status && <div className="text-xs text-[#7a6a52]">{order.production_status}</div>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-[#7a6a52] text-sm">
                        {order.jewelry_type || '—'}{order.gold_type && <span className="text-xs"> · {order.gold_type}</span>}
                      </TableCell>
                      <TableCell>
                        <InlineStatusSelect value={order.order_status} options={ORDER_STATUSES} onChange={s => handleStatusChange(order, s)} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <InlineStatusSelect value={order.payment_status} options={PAYMENT_STATUSES} onChange={s => handlePaymentStatusChange(order, s)} />
                      </TableCell>
                      <TableCell className="font-semibold text-[#2c1810]">{formatCurrency(order.sale_price)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {order.balance_due > 0
                          ? <span className="text-red-600 font-medium text-sm">{formatCurrency(order.balance_due)}</span>
                          : <span className="text-emerald-600 text-sm">שולם</span>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {order.delivery_date ? (
                          <span className={cn('flex items-center gap-1 text-sm', isUrgent ? 'text-amber-600 font-medium' : 'text-[#7a6a52]')}>
                            {isUrgent && <AlertTriangle size={12} />}
                            {formatDate(order.delivery_date)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {order.order_status !== 'בוטל' && order.payment_status !== 'שולם במלואו' && (
                            <Button variant="ghost" size="icon" onClick={() => setPaymentTarget(order)} title="הוסף תשלום" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"><HandCoins size={15} /></Button>
                          )}
                          <Link href={`/orders/${order.id}`}><Button variant="ghost" size="icon" title="פרטים"><Eye size={15} /></Button></Link>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(order)} title="עריכה"><Pencil size={15} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(order)} title="מחיקה" className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={15} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <OrderForm open={formOpen} onClose={closeForm} order={editing} customers={customers} suppliers={suppliers} onSave={handleSave} />
        <QuickPaymentDialog order={paymentTarget} onClose={() => setPaymentTarget(undefined)} onSave={handleQuickPayment} />
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(undefined)}
          onConfirm={handleDelete}
          title="מחיקת הזמנה"
          description={`האם אתה בטוח שברצונך למחוק את "${deleteTarget?.order_number}"?`}
          confirmLabel="מחק"
        />
      </div>
    </Shell>
  )
}
