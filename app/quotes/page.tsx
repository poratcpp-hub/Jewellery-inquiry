'use client'

import { useState, useMemo } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { QuoteForm } from '@/components/quotes/quote-form'
import { formatCurrency, formatDate, getProfitColor } from '@/lib/utils'
import { demoQuotes, demoCustomers } from '@/lib/demo-data'
import type { Quote, Customer } from '@/lib/types'
import { Plus, Search, Pencil, ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(
    demoQuotes.map(q => ({
      ...q,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customers: demoCustomers.find(c => c.id === q.customer_id)
        ? { ...demoCustomers.find(c => c.id === q.customer_id)!, created_at: '', updated_at: '' }
        : undefined,
    }))
  )
  const [customers] = useState<Customer[]>(
    demoCustomers.map(c => ({ ...c, created_at: '', updated_at: '' }))
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Quote | undefined>()

  const filtered = useMemo(() => {
    return quotes.filter(q => {
      const customerName = q.customers?.full_name || ''
      const matchSearch = q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
        customerName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || q.quote_status === statusFilter
      return matchSearch && matchStatus
    })
  }, [quotes, search, statusFilter])

  const handleSave = (data: Partial<Quote>) => {
    if (editing) {
      setQuotes(prev => prev.map(q => q.id === editing.id ? { ...q, ...data, updated_at: new Date().toISOString() } : q))
    } else {
      const newQuote: Quote = {
        ...data as Quote,
        id: Math.random().toString(36).slice(2),
        quote_status: data.quote_status || 'טיוטה',
        has_certificate: data.has_certificate || false,
        diamond_cost: data.diamond_cost || 0,
        gold_cost: data.gold_cost || 0,
        labor_cost: data.labor_cost || 0,
        setting_cost: data.setting_cost || 0,
        packaging_cost: data.packaging_cost || 0,
        shipping_cost: data.shipping_cost || 0,
        other_cost: data.other_cost || 0,
        total_cost: data.total_cost || 0,
        sale_price: data.sale_price || 0,
        expected_profit: data.expected_profit || 0,
        profit_margin: data.profit_margin || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customers: customers.find(c => c.id === data.customer_id),
      }
      setQuotes(prev => [newQuote, ...prev])
    }
    setEditing(undefined)
  }

  const convertToOrder = (quote: Quote) => {
    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, quote_status: 'אושרה' } : q))
    alert(`הצעת המחיר "${quote.quote_number}" הומרה להזמנה! ניתן להוסיפה בדף ההזמנות.`)
  }

  const totalValue = filtered.reduce((sum, q) => sum + q.sale_price, 0)

  return (
    <Shell title="הצעות מחיר">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="הצעות מחיר"
          description={`${filtered.length} הצעות · שווי ${formatCurrency(totalValue)}`}
          action={
            <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
              <Plus size={16} />
              הצעה חדשה
            </Button>
          }
        />

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
            <Input className="pr-9" placeholder="חיפוש לפי מספר הצעה, לקוח..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select className="w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">כל הסטטוסים</option>
            {['טיוטה', 'נשלחה', 'אושרה', 'נדחתה', 'פג תוקף'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מספר הצעה</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead className="hidden md:table-cell">תכשיט</TableHead>
                <TableHead className="hidden lg:table-cell">עלות</TableHead>
                <TableHead>מחיר מכירה</TableHead>
                <TableHead className="hidden md:table-cell">מרווח</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="hidden lg:table-cell">תוקף</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-[#7a6a52] py-12">
                    לא נמצאו הצעות מחיר
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(quote => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <span className="font-mono text-sm font-medium text-[#b8934a]">
                      {quote.quote_number}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-[#2c1810]">
                    {quote.customers?.full_name || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-[#7a6a52]">
                    {quote.jewelry_type || '—'}
                    {quote.carat && <span className="text-xs"> · {quote.carat}ct</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{formatCurrency(quote.total_cost)}</TableCell>
                  <TableCell className="font-semibold text-[#2c1810]">
                    {formatCurrency(quote.sale_price)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className={cn('font-medium text-sm', getProfitColor(quote.profit_margin))}>
                      {quote.profit_margin.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(quote.quote_status)}>
                      {quote.quote_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-[#7a6a52]">
                    {formatDate(quote.valid_until)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(quote); setFormOpen(true) }} title="עריכה">
                        <Pencil size={15} />
                      </Button>
                      {!['אושרה', 'נדחתה'].includes(quote.quote_status) && (
                        <Button variant="ghost" size="icon" onClick={() => convertToOrder(quote)} title="המר להזמנה" className="text-[#b8934a]">
                          <ArrowLeftRight size={15} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <QuoteForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          quote={editing}
          customers={customers}
          onSave={handleSave}
        />
      </div>
    </Shell>
  )
}
