'use client'

import { useState, useMemo } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { OrderForm } from '@/components/orders/order-form'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { demoOrders, demoCustomers, demoSuppliers } from '@/lib/demo-data'
import type { Order, Customer, Supplier } from '@/lib/types'
import { Plus, Search, Pencil, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(
    demoOrders.map(o => ({
      ...o,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customers: demoCustomers.find(c => c.id === o.customer_id)
        ? { ...demoCustomers.find(c => c.id === o.customer_id)!, created_at: '', updated_at: '' }
        : undefined,
      suppliers: demoSuppliers.find(s => s.id === o.supplier_id)
        ? { ...demoSuppliers.find(s => s.id === o.supplier_id)!, created_at: '' }
        : undefined,
    }))
  )
  const [customers] = useState<Customer[]>(demoCustomers.map(c => ({ ...c, created_at: '', updated_at: '' })))
  const [suppliers] = useState<Supplier[]>(demoSuppliers.map(s => ({ ...s, created_at: '' })))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Order | undefined>()

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = search.toLowerCase()
      const customerName = o.customers?.full_name || ''
      const matchSearch = o.order_number.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q)
      const matchStatus = !statusFilter || o.order_status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const handleSave = (data: Partial<Order>) => {
    if (editing) {
      setOrders(prev => prev.map(o => o.id === editing.id ? { ...o, ...data, updated_at: new Date().toISOString() } : o))
    } else {
      const newOrder: Order = {
        ...data as Order,
        id: Math.random().toString(36).slice(2),
        order_status: data.order_status || 'הזמנה חדשה',
        payment_status: data.payment_status || 'לא שולם',
        sale_price: data.sale_price || 0,
        deposit_amount: data.deposit_amount || 0,
        balance_due: data.balance_due || 0,
        total_cost: data.total_cost || 0,
        net_profit: data.net_profit || 0,
        profit_margin: data.profit_margin || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customers: customers.find(c => c.id === data.customer_id),
        suppliers: suppliers.find(s => s.id === data.supplier_id),
      }
      setOrders(prev => [newOrder, ...prev])
    }
    setEditing(undefined)
  }

  const totalRevenue = filtered.reduce((s, o) => s + o.sale_price, 0)
  const totalBalance = filtered.filter(o => o.payment_status !== 'שולם במלואו').reduce((s, o) => s + o.balance_due, 0)

  return (
    <Shell title="הזמנות">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="הזמנות"
          description={`${filtered.length} הזמנות · שווי ${formatCurrency(totalRevenue)} · יתרה ${formatCurrency(totalBalance)}`}
          action={
            <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
              <Plus size={16} />
              הזמנה חדשה
            </Button>
          }
        />

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
            <Input className="pr-9" placeholder="חיפוש לפי מספר הזמנה, לקוח..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select className="w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">כל הסטטוסים</option>
            {['הזמנה חדשה', 'בייצור', 'מוכן', 'נמסר', 'בוטל'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מספר הזמנה</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead className="hidden md:table-cell">תכשיט</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="hidden sm:table-cell">תשלום</TableHead>
                <TableHead>מחיר</TableHead>
                <TableHead className="hidden lg:table-cell">יתרה</TableHead>
                <TableHead className="hidden md:table-cell">מסירה</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-[#7a6a52] py-12">
                    לא נמצאו הזמנות
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(order => {
                const days = daysUntil(order.delivery_date)
                const isUrgent = days !== null && days <= 3 && !['נמסר', 'בוטל'].includes(order.order_status)
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-mono text-sm font-medium text-[#b8934a]">
                        {order.order_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-[#2c1810]">{order.customers?.full_name || '—'}</div>
                      {order.production_status && (
                        <div className="text-xs text-[#7a6a52]">{order.production_status}</div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-[#7a6a52]">
                      {order.jewelry_type || '—'}
                      {order.gold_type && <span className="text-xs"> · {order.gold_type}</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.order_status)}>
                        {order.order_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={getStatusBadgeVariant(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-[#2c1810]">
                      {formatCurrency(order.sale_price)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {order.balance_due > 0 ? (
                        <span className="text-red-600 font-medium">{formatCurrency(order.balance_due)}</span>
                      ) : (
                        <span className="text-emerald-600">שולם</span>
                      )}
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
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(order); setFormOpen(true) }} title="עריכה">
                        <Pencil size={15} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <OrderForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          order={editing}
          customers={customers}
          suppliers={suppliers}
          onSave={handleSave}
        />
      </div>
    </Shell>
  )
}
