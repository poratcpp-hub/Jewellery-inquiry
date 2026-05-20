'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { QuoteForm } from '@/components/quotes/quote-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useDebounce } from '@/lib/hooks'
import { formatCurrency, formatDate, getProfitColor } from '@/lib/utils'
import { getQuotes, upsertQuote, deleteQuote, getCustomers } from '@/lib/data'
import { QUOTE_STATUSES } from '@/lib/constants'
import type { Quote, Customer } from '@/lib/types'
import { Plus, Search, Pencil, Trash2, ArrowLeftRight } from 'lucide-react'
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
      .then(([q, c]) => {
        const custMap = Object.fromEntries(c.map(x => [x.id, x]))
        setQuotes(q.map(quote => ({ ...quote, customers: custMap[quote.customer_id || ''] || quote.customers })))
        setCustomers(c)
      })
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת הנתונים' }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useDebounce(
    useCallback((q: string) => setSearch(q), []),
    200
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return quotes.filter(quote => {
      const matchSearch = !q || quote.quote_number.toLowerCase().includes(q) ||
        (quote.customers?.full_name || '').toLowerCase().includes(q)
      return matchSearch && (!statusFilter || quote.quote_status === statusFilter)
    })
  }, [quotes, search, statusFilter])

  const totalValue = useMemo(() => filtered.reduce((s, q) => s + q.sale_price, 0), [filtered])

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

  const convertToOrder = useCallback(async (quote: Quote) => {
    try {
      await upsertQuote({ ...quote, quote_status: 'אושרה' })
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, quote_status: 'אושרה' } : q))
      toast({ type: 'success', title: 'הצעה אושרה', description: 'כעת ניתן ליצור הזמנה' })
    } catch {
      toast({ type: 'error', title: 'שגיאה בהמרה' })
    }
  }, [toast])

  const openEdit = useCallback((q: Quote) => { setEditing(q); setFormOpen(true) }, [])
  const openNew = useCallback(() => { setEditing(undefined); setFormOpen(true) }, [])
  const closeForm = useCallback(() => { setFormOpen(false); setEditing(undefined) }, [])

  return (
    <Shell title="הצעות מחיר">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="הצעות מחיר"
          description={`${filtered.length} הצעות · שווי ${formatCurrency(totalValue)}`}
          action={<Button onClick={openNew}><Plus size={16} />הצעה חדשה</Button>}
        />

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
            <Input className="pr-9" placeholder="חיפוש לפי מספר הצעה, לקוח..." onChange={e => handleSearch(e.target.value)} />
          </div>
          <Select className="w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">כל הסטטוסים</option>
            {QUOTE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
          {loading ? <TableSkeleton rows={5} cols={7} /> : (
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
                      {search || statusFilter ? 'לא נמצאו הצעות התואמות לחיפוש' : 'אין הצעות מחיר עדיין'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(quote => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <span className="font-mono text-sm font-medium text-[#b8934a]">{quote.quote_number}</span>
                    </TableCell>
                    <TableCell className="font-medium text-[#2c1810]">{quote.customers?.full_name || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-[#7a6a52] text-sm">
                      {quote.jewelry_type || '—'}
                      {quote.carat && <span className="text-xs"> · {quote.carat}ct</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{formatCurrency(quote.total_cost)}</TableCell>
                    <TableCell className="font-semibold text-[#2c1810]">{formatCurrency(quote.sale_price)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={cn('font-medium text-sm', getProfitColor(quote.profit_margin))}>
                        {quote.profit_margin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(quote.quote_status)}>{quote.quote_status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[#7a6a52] text-sm">
                      {formatDate(quote.valid_until)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(quote)} title="עריכה">
                          <Pencil size={15} />
                        </Button>
                        {!['אושרה', 'נדחתה'].includes(quote.quote_status) && (
                          <Button variant="ghost" size="icon" onClick={() => convertToOrder(quote)} title="אשר הצעה" className="text-[#b8934a]">
                            <ArrowLeftRight size={15} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(quote)} title="מחיקה" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 size={15} />
                        </Button>
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
