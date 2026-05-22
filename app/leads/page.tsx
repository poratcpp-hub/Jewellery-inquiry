'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, SortableHead, TableCell } from '@/components/ui/table'
import { LeadForm } from '@/components/leads/lead-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useDebounce, useTableSort } from '@/lib/hooks'
import { formatCurrency, formatDate, isOverdue, exportCsv } from '@/lib/utils'
import { getLeads, upsertLead, deleteLead, getCustomers, upsertCustomer } from '@/lib/data'
import { LEAD_STATUSES } from '@/lib/constants'
import type { Lead, Customer } from '@/lib/types'
import { Plus, Search, Pencil, Trash2, ArrowLeftRight, AlertTriangle, Download } from 'lucide-react'

export default function LeadsPage() {
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Lead | undefined>()

  useEffect(() => {
    Promise.all([getLeads(), getCustomers()])
      .then(([l, c]) => { setLeads(l); setCustomers(c) })
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת הנתונים' }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useDebounce(useCallback((q: string) => setSearch(q), []), 200)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter(l => {
      const matchSearch = !q || (l.full_name || '').toLowerCase().includes(q) || (l.phone || '').includes(q)
      return matchSearch && (!statusFilter || l.lead_status === statusFilter)
    })
  }, [leads, search, statusFilter])

  const { sorted, sortKey, sortDir, toggleSort } = useTableSort<Lead>(filtered, 'created_at', 'desc')

  const activeCount = useMemo(
    () => leads.filter(l => !['הומר', 'נסגר'].includes(l.lead_status)).length,
    [leads]
  )

  const handleSave = useCallback(async (data: Partial<Lead>) => {
    try {
      if (!editing && data.phone) {
        // Block duplicate leads by phone
        const dupLead = leads.find(l => l.phone === data.phone)
        if (dupLead) {
          toast({ type: 'error', title: 'כפילות', description: `כבר קיים ליד עם מספר זה: "${dupLead.full_name}"` })
          return
        }
      }

      // Auto-link customer by phone on new lead creation
      let finalData = { ...data }
      if (!editing && !data.customer_id && data.phone) {
        const existingCustomer = customers.find(c => c.phone === data.phone)
        if (existingCustomer) {
          finalData = { ...finalData, customer_id: existingCustomer.id }
        }
      }

      const saved = await upsertLead(editing ? { ...editing, ...finalData } : finalData)
      const withCustomer = { ...saved, customers: customers.find(c => c.id === saved.customer_id) }
      if (editing) {
        setLeads(prev => prev.map(l => l.id === editing.id ? withCustomer : l))
        toast({ type: 'success', title: 'הליד עודכן' })
      } else {
        setLeads(prev => [{ ...withCustomer, id: withCustomer.id || Math.random().toString(36).slice(2) }, ...prev])
        toast({ type: 'success', title: 'ליד חדש נוסף' })
      }
    } catch {
      toast({ type: 'error', title: 'שגיאה בשמירת הליד' })
    }
    setEditing(undefined)
  }, [editing, customers, leads, toast])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteLead(deleteTarget.id)
      setLeads(prev => prev.filter(l => l.id !== deleteTarget.id))
      toast({ type: 'success', title: 'הליד נמחק' })
    } catch {
      toast({ type: 'error', title: 'שגיאה במחיקת הליד' })
    }
    setDeleteTarget(undefined)
  }, [deleteTarget, toast])

  const convertToQuote = useCallback(async (lead: Lead) => {
    try {
      let customerId = lead.customer_id
      if (!customerId) {
        const byPhone = lead.phone ? customers.find(c => c.phone === lead.phone) : undefined
        const byName = !byPhone
          ? customers.find(c => c.full_name.toLowerCase() === (lead.full_name || '').toLowerCase())
          : undefined
        const existing = byPhone || byName
        if (existing) {
          customerId = existing.id
          toast({ type: 'success', title: 'קושר ללקוח קיים', description: `"${existing.full_name}"` })
        } else {
          const newCustomer = await upsertCustomer({
            full_name: lead.full_name || '',
            phone: lead.phone,
            source: lead.source,
            customer_status: 'חדש',
          })
          customerId = newCustomer.id
          setCustomers(prev => [newCustomer, ...prev])
          toast({ type: 'success', title: 'לקוח חדש נוצר', description: `"${newCustomer.full_name}" נוסף ללקוחות` })
        }
      }
      await upsertLead({ ...lead, lead_status: 'הומר', customer_id: customerId })
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lead_status: 'הומר', customer_id: customerId } : l))
      toast({ type: 'success', title: 'הליד הומר', description: 'ניתן כעת ליצור הצעת מחיר' })
    } catch {
      toast({ type: 'error', title: 'שגיאה בהמרת הליד' })
    }
  }, [customers, toast])

  const handleExport = useCallback(() => {
    exportCsv('leads', sorted.map(l => ({
      שם: l.full_name || '',
      טלפון: l.phone || '',
      'סוג תכשיט': l.jewelry_type || '',
      תקציב: l.budget || '',
      סטטוס: l.lead_status,
      עדיפות: l.priority,
      מקור: l.source || '',
      'תאריך מעקב': l.follow_up_date || '',
    })))
  }, [sorted])

  const openEdit = useCallback((l: Lead) => { setEditing(l); setFormOpen(true) }, [])
  const openNew = useCallback(() => { setEditing(undefined); setFormOpen(true) }, [])
  const closeForm = useCallback(() => { setFormOpen(false); setEditing(undefined) }, [])

  return (
    <Shell title="לידים">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="לידים"
          description={`${leads.length} לידים · ${activeCount} פעילים`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} title="ייצוא CSV">
                <Download size={15} /><span className="hidden sm:inline">ייצוא</span>
              </Button>
              <Button onClick={openNew}><Plus size={16} />ליד חדש</Button>
            </div>
          }
        />

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
            <Input className="pr-9" placeholder="חיפוש לפי שם, טלפון..." onChange={e => handleSearch(e.target.value)} />
          </div>
          <Select className="w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">כל הסטטוסים</option>
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>

        <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
          {loading ? <TableSkeleton rows={5} cols={6} /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead sortKey="full_name" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Lead)}>שם</SortableHead>
                  <SortableHead className="hidden sm:table-cell">טלפון</SortableHead>
                  <SortableHead className="hidden md:table-cell">תכשיט / תקציב</SortableHead>
                  <SortableHead sortKey="lead_status" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Lead)}>סטטוס</SortableHead>
                  <SortableHead sortKey="priority" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Lead)}>עדיפות</SortableHead>
                  <SortableHead sortKey="follow_up_date" activeSortKey={sortKey as string} sortDir={sortDir} onSort={k => toggleSort(k as keyof Lead)} className="hidden md:table-cell">מעקב</SortableHead>
                  <SortableHead>פעולות</SortableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-[#7a6a52] py-12 text-sm">
                    {search || statusFilter ? 'לא נמצאו לידים התואמים לחיפוש' : 'אין לידים עדיין — הוסף ליד ראשון'}
                  </td></tr>
                )}
                {sorted.map(lead => {
                  const overdue = lead.follow_up_date && isOverdue(lead.follow_up_date) &&
                    !['הומר', 'נסגר'].includes(lead.lead_status)
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium text-[#2c1810]">{lead.full_name || '—'}</div>
                        {lead.source && <div className="text-xs text-[#7a6a52]">{lead.source}</div>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{lead.phone || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">{lead.jewelry_type || '—'}</div>
                        {lead.budget && <div className="text-xs text-[#7a6a52]">{formatCurrency(lead.budget)}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(lead.lead_status)}>{lead.lead_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(lead.priority)}>{lead.priority}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {lead.follow_up_date ? (
                          <span className={overdue ? 'text-red-600 flex items-center gap-1 text-sm' : 'text-[#7a6a52] text-sm'}>
                            {overdue && <AlertTriangle size={12} />}
                            {formatDate(lead.follow_up_date)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(lead)} title="עריכה"><Pencil size={15} /></Button>
                          {!['הומר', 'נסגר'].includes(lead.lead_status) && (
                            <Button variant="ghost" size="icon" onClick={() => convertToQuote(lead)} title="המר לטיפול" className="text-[#b8934a]">
                              <ArrowLeftRight size={15} />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(lead)} title="מחיקה" className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={15} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <LeadForm open={formOpen} onClose={closeForm} lead={editing} customers={customers} onSave={handleSave} />
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(undefined)}
          onConfirm={handleDelete}
          title="מחיקת ליד"
          description={`האם אתה בטוח שברצונך למחוק את "${deleteTarget?.full_name}"?`}
          confirmLabel="מחק"
        />
      </div>
    </Shell>
  )
}
