'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, SortableHead, TableCell } from '@/components/ui/table'
import { CustomerForm } from '@/components/customers/customer-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useDebounce, useTableSort } from '@/lib/hooks'
import { formatDate, exportCsv, generateQuoteNumber } from '@/lib/utils'
import { getCustomers, upsertCustomer, deleteCustomer, upsertLead, upsertQuote } from '@/lib/data'
import type { Customer } from '@/lib/types'
import { Plus, Search, Pencil, Trash2, Phone, AtSign, Download, ClipboardList } from 'lucide-react'

function WaLink({ phone }: { phone: string }) {
  const normalized = phone.replace(/^0/, '').replace(/\D/g, '')
  return (
    <a
      href={`https://wa.me/972${normalized}`}
      target="_blank"
      rel="noopener noreferrer"
      title="פתח ב-WhatsApp"
      className="text-emerald-600 hover:text-emerald-700 transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  )
}

export default function CustomersPage() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Customer | undefined>()

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת לקוחות' }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useDebounce(
    useCallback((q: string) => setSearch(q), []),
    200
  )

  const filtered = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.instagram || '').toLowerCase().includes(q) ||
      (c.city || '').includes(q)
    )
  }, [customers, search])

  const { sorted, sortKey, sortDir, toggleSort } = useTableSort<Customer>(filtered, 'full_name')

  const handleSave = useCallback(async (data: Partial<Customer>) => {
    if (!editing && data.phone) {
      const dup = customers.find(c => c.phone === data.phone)
      if (dup) {
        toast({ type: 'error', title: 'כפילות', description: `כבר קיים לקוח עם מספר זה: "${dup.full_name}"` })
        return
      }
    }

    let saved: Customer
    try {
      saved = await upsertCustomer(editing ? { ...editing, ...data } : data)
    } catch {
      toast({ type: 'error', title: 'שגיאה בשמירת הלקוח' })
      return
    }

    if (editing) {
      setCustomers(prev => prev.map(c => c.id === editing.id ? saved : c))
      toast({ type: 'success', title: 'הלקוח עודכן בהצלחה' })
      setEditing(undefined)
      return
    }

    setCustomers(prev => [saved, ...prev])

    // Auto-open lead + quote for every new customer — separate try/catch so
    // a Supabase / RLS failure here doesn't swallow the customer success.
    try {
      const [, newQuote] = await Promise.all([
        upsertLead({
          full_name: saved.full_name,
          phone: saved.phone,
          source: saved.source,
          customer_id: saved.id,
          lead_status: 'חדש',
          priority: 'בינוני',
        }),
        upsertQuote({
          quote_number: generateQuoteNumber(),
          customer_id: saved.id,
          quote_status: 'טיוטה',
          diamond_cost: 0, gold_cost: 0, labor_cost: 0,
          setting_cost: 0, packaging_cost: 0, shipping_cost: 0, other_cost: 0,
          total_cost: 0, sale_price: 0, expected_profit: 0, profit_margin: 0,
        }),
      ])
      toast({
        type: 'info',
        title: `נפתחו אוטומטית עבור "${saved.full_name}"`,
        description: `ליד חדש + הצעת מחיר ${newQuote.quote_number} — יש למלא את הפרטים`,
      })
    } catch (err) {
      console.error('Auto-create lead/quote failed:', err)
      toast({ type: 'warning', title: 'הלקוח נוסף', description: 'לא הצלחנו לפתוח ליד/הצעת מחיר אוטומטית' })
    }

    setEditing(undefined)
  }, [editing, customers, toast])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteCustomer(deleteTarget.id)
      setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id))
      toast({ type: 'success', title: 'הלקוח נמחק' })
    } catch {
      toast({ type: 'error', title: 'שגיאה במחיקת הלקוח' })
    }
    setDeleteTarget(undefined)
  }, [deleteTarget, toast])

  const handleExport = useCallback(() => {
    exportCsv('customers', sorted.map(c => ({
      שם: c.full_name,
      טלפון: c.phone || '',
      אינסטגרם: c.instagram || '',
      'דוא"ל': c.email || '',
      עיר: c.city || '',
      מקור: c.source || '',
      סטטוס: c.customer_status,
    })))
  }, [sorted])

  const openLeadForCustomer = useCallback(async (customer: Customer) => {
    try {
      await upsertLead({
        full_name: customer.full_name,
        phone: customer.phone,
        source: customer.source,
        customer_id: customer.id,
        lead_status: 'חדש',
        priority: 'בינוני',
      })
      toast({
        type: 'info',
        title: `ליד נפתח עבור "${customer.full_name}"`,
        description: 'הליד נוסף לרשימת הלידים — יש למלא את הפרטים',
      })
    } catch (err) {
      console.error('Open lead failed:', err)
      toast({ type: 'error', title: 'שגיאה בפתיחת ליד' })
    }
  }, [toast])

  const openEdit = useCallback((c: Customer) => { setEditing(c); setFormOpen(true) }, [])
  const openNew = useCallback(() => { setEditing(undefined); setFormOpen(true) }, [])
  const closeForm = useCallback(() => { setFormOpen(false); setEditing(undefined) }, [])

  return (
    <Shell title="לקוחות">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="לקוחות"
          description={`${customers.length} לקוחות במערכת · ${filtered.length} מוצגים`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} title="ייצוא CSV">
                <Download size={15} /><span className="hidden sm:inline">ייצוא</span>
              </Button>
              <Button onClick={openNew}><Plus size={16} />לקוח חדש</Button>
            </div>
          }
        />

        <div className="mb-4 relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
          <Input className="pr-9" placeholder="חיפוש לפי שם, טלפון, אינסטגרם, עיר..." onChange={e => handleSearch(e.target.value)} />
        </div>

        <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
          {loading ? <TableSkeleton rows={5} cols={6} /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead sortKey="full_name" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Customer)}>שם מלא</SortableHead>
                  <SortableHead>טלפון</SortableHead>
                  <SortableHead className="hidden sm:table-cell">אינסטגרם</SortableHead>
                  <SortableHead sortKey="city" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Customer)} className="hidden md:table-cell">עיר</SortableHead>
                  <SortableHead className="hidden md:table-cell">מקור</SortableHead>
                  <SortableHead sortKey="customer_status" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Customer)}>סטטוס</SortableHead>
                  <SortableHead sortKey="created_at" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Customer)} className="hidden lg:table-cell">נוסף</SortableHead>
                  <SortableHead>פעולות</SortableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-[#7a6a52] py-12 text-sm">
                    {search ? 'לא נמצאו תוצאות לחיפוש זה' : 'אין לקוחות עדיין — הוסף לקוח ראשון'}
                  </td></tr>
                )}
                {sorted.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium text-[#2c1810]">{customer.full_name}</div>
                      {customer.email && <div className="text-xs text-[#7a6a52]">{customer.email}</div>}
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5">
                          <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-[#b8934a] hover:underline text-sm">
                            <Phone size={12} />{customer.phone}
                          </a>
                          <WaLink phone={customer.phone} />
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {customer.instagram ? (
                        <span className="flex items-center gap-1 text-[#7a6a52] text-sm">
                          <AtSign size={12} />{customer.instagram}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{customer.city || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-[#7a6a52]">{customer.source || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(customer.customer_status)}>{customer.customer_status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[#7a6a52] text-sm">{formatDate(customer.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(customer)} title="עריכה"><Pencil size={15} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openLeadForCustomer(customer)} title="פתח ליד" className="text-[#b8934a] hover:text-[#a07840] hover:bg-[#fdf6ec]"><ClipboardList size={15} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(customer)} title="מחיקה" className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={15} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <CustomerForm open={formOpen} onClose={closeForm} customer={editing} onSave={handleSave} />
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(undefined)}
          onConfirm={handleDelete}
          title="מחיקת לקוח"
          description={`האם אתה בטוח שברצונך למחוק את "${deleteTarget?.full_name}"? לא ניתן לבטל פעולה זו.`}
          confirmLabel="מחק"
        />
      </div>
    </Shell>
  )
}
