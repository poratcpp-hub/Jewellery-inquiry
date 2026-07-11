'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterChips } from '@/components/ui/filter-chips'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, SortableHead, TableCell } from '@/components/ui/table'
import { QuoteForm } from '@/components/quotes/quote-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useDebounce, useTableSort } from '@/lib/hooks'
import { formatCurrency, formatDate, getProfitColor, exportCsv } from '@/lib/utils'
import { getQuotes, upsertQuote, deleteQuote, getCustomers, autoExpireQuotes, changeQuoteStatus } from '@/lib/data'
import { QUOTE_STATUSES } from '@/lib/constants'
import { InlineStatusSelect } from '@/components/ui/inline-status-select'
import type { Quote, Customer } from '@/lib/types'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Download, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function QuotesPage() {
  const { toast } = useToast()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Quote | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Quote | undefined>()

  useEffect(() => {
    Promise.all([getQuotes(), getCustomers()])
      .then(async ([q, c]) => {
        const fresh = await autoExpireQuotes(q)
        const custMap = Object.fromEntries(c.map(x => [x.id, x]))
        setQuotes(fresh.map(quote => ({ ...quote, customers: custMap[quote.customer_id || ''] || quote.customers })))
        setCustomers(c)
      })
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת הנתונים' }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useDebounce(useCallback((q: string) => setSearch(q), []), 200)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return quotes.filter(quote => {
      const matchSearch = !q || (quote.quote_number || '').toLowerCase().includes(q) ||
        (quote.customers?.full_name || '').toLowerCase().includes(q)
      return matchSearch && (!statusFilter || quote.quote_status === statusFilter)
    })
  }, [quotes, search, statusFilter])

  const { sorted, sortKey, sortDir, toggleSort } = useTableSort<Quote>(filtered, 'created_at', 'desc')

  const totalValue = useMemo(() => filtered.reduce((s, q) => s + q.sale_price, 0), [filtered])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    quotes.forEach(q => { counts[q.quote_status] = (counts[q.quote_status] || 0) + 1 })
    return counts
  }, [quotes])

  const handleSave = useCallback(async (data: Partial<Quote>) => {
    try {
      const saved = await upsertQuote(editing ? { ...editing, ...data } : data)
      const custMap = Object.fromEntries(customers.map(c => [c.id, c]))
      const enriched = { ...saved, customers: custMap[saved.customer_id || ''] || saved.customers }
      if (editing) {
        setQuotes(prev => prev.map(q => q.id === editing.id ? enriched : q))
        toast({ type: 'success', title: 'הצעת המחיר עודכנה' })
      } else {
        setQuotes(prev => [{ ...enriched, id: enriched.id || Math.random().toString(36).slice(2) }, ...prev])
        toast({ type: 'success', title: 'הצעת מחיר חדשה נוצרה' })
      }
    } catch {
      toast({ type: 'error', title: 'שגיאה בשמירת הצעת המחיר' })
    }
    setEditing(undefined)
  }, [editing, customers, toast])

  const handleStatusChange = useCallback(async (quote: Quote, newStatus: string) => {
    try {
      const result = await changeQuoteStatus(quote, newStatus)
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, ...result.quote, customers: q.customers } : q))
      if (result.order) {
        toast({
          type: 'success',
          title: result.orderCreated ? 'ההצעה אושרה — נפתחה הזמנה' : 'ההצעה אושרה',
          description: `הזמנה ${result.order.order_number}${result.orderCreated ? ' נוצרה אוטומטית כולל רישום העלויות בהוצאות' : ' כבר מקושרת'}`,
        })
      } else if (newStatus === 'נשלחה ללקוח' && quote.lead_id) {
        toast({ type: 'info', title: 'הליד עודכן', description: 'נקבע מעקב אוטומטי בעוד 3 ימים' })
      }
    } catch {
      toast({ type: 'error', title: 'שגיאה בעדכון סטטוס' })
    }
  }, [toast])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteQuote(deleteTarget.id)
      setQuotes(prev => prev.filter(q => q.id !== deleteTarget.id))
      toast({ type: 'success', title: 'הצעת המחיר נמחקה' })
    } catch {
      toast({ type: 'error', title: 'שגיאה במחיקה' })
    }
    setDeleteTarget(undefined)
  }, [deleteTarget, toast])

  const handleExport = useCallback(() => {
    exportCsv('quotes', sorted.map(q => ({
      'מספר הצעה': q.quote_number,
      לקוח: q.customers?.full_name || '',
      'סוג תכשיט': q.jewelry_type || '',
      'סוג יהלום': q.diamond_type || '',
      קראט: q.carat || '',
      'עלות כוללת': q.total_cost,
      'מחיר מכירה': q.sale_price,
      'מרווח %': (q.profit_margin ?? 0).toFixed(1),
      סטטוס: q.quote_status,
      'תוקף עד': q.valid_until || '',
    })))
  }, [sorted])

  const openEdit = useCallback((q: Quote) => { setEditing(q); setFormOpen(true) }, [])
  const openNew = useCallback(() => { setEditing(undefined); setFormOpen(true) }, [])
  const closeForm = useCallback(() => { setFormOpen(false); setEditing(undefined) }, [])

  return (
    <Shell title="הצעות מחיר">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="הצעות מחיר"
          description={`${filtered.length} הצעות · שווי ${formatCurrency(totalValue)}`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} title="ייצוא CSV">
                <Download size={15} /><span className="hidden sm:inline">ייצוא</span>
              </Button>
              <Button onClick={openNew}><Plus size={16} />הצעה חדשה</Button>
            </div>
          }
        />

        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
            <Input className="pr-9" placeholder="חיפוש לפי מספר הצעה, לקוח..." onChange={e => handleSearch(e.target.value)} />
          </div>
          <FilterChips options={QUOTE_STATUSES} value={statusFilter} onChange={setStatusFilter} counts={statusCounts} allCount={quotes.length} />
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? <TableSkeleton rows={5} cols={7} /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead sortKey="quote_number" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Quote)}>מספר הצעה</SortableHead>
                  <SortableHead sortKey="customers" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Quote)}>לקוח</SortableHead>
                  <SortableHead className="hidden md:table-cell">תכשיט</SortableHead>
                  <SortableHead sortKey="total_cost" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Quote)} className="hidden lg:table-cell">עלות</SortableHead>
                  <SortableHead sortKey="sale_price" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Quote)}>מחיר מכירה</SortableHead>
                  <SortableHead sortKey="profit_margin" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Quote)} className="hidden md:table-cell">מרווח</SortableHead>
                  <SortableHead sortKey="quote_status" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Quote)}>סטטוס</SortableHead>
                  <SortableHead sortKey="valid_until" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Quote)} className="hidden lg:table-cell">תוקף</SortableHead>
                  <SortableHead>פעולות</SortableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-[#7a6a52] py-12 text-sm">
                    {search || statusFilter ? 'לא נמצאו הצעות התואמות לחיפוש' : 'אין הצעות מחיר עדיין'}
                  </td></tr>
                )}
                {sorted.map(quote => (
                  <TableRow key={quote.id}>
                    <TableCell><span className="font-mono text-sm font-medium text-[#b8934a]">{quote.quote_number}</span></TableCell>
                    <TableCell className="font-medium text-[#2c1810]">{quote.customers?.full_name || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-[#7a6a52] text-sm">
                      {quote.jewelry_type || '—'}
                      {quote.carat && <span className="text-xs"> · {quote.carat}ct</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{formatCurrency(quote.total_cost)}</TableCell>
                    <TableCell className="font-semibold text-[#2c1810]">{formatCurrency(quote.sale_price)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={cn('font-medium text-sm', getProfitColor(quote.profit_margin))}>
                        {(quote.profit_margin ?? 0).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <InlineStatusSelect value={quote.quote_status} options={QUOTE_STATUSES} onChange={s => handleStatusChange(quote, s)} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[#7a6a52] text-sm">{formatDate(quote.valid_until)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/quotes/${quote.id}`}><Button variant="ghost" size="icon" title="פרטים"><Eye size={15} /></Button></Link>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(quote)} title="עריכה"><Pencil size={15} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(quote)} title="מחיקה" className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={15} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <QuoteForm open={formOpen} onClose={closeForm} quote={editing} customers={customers} onSave={handleSave} />
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(undefined)}
          onConfirm={handleDelete}
          title="מחיקת הצעת מחיר"
          description={`האם אתה בטוח שברצונך למחוק את "${deleteTarget?.quote_number}"?`}
          confirmLabel="מחק"
        />
      </div>
    </Shell>
  )
}
