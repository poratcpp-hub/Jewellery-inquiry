'use client'

import { useState, useMemo, useEffect } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { CustomerForm } from '@/components/customers/customer-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import { getCustomers, upsertCustomer, deleteCustomer } from '@/lib/data'
import type { Customer } from '@/lib/types'
import { Plus, Search, Pencil, Trash2, Phone, AtSign } from 'lucide-react'

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
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.instagram || '').toLowerCase().includes(q) ||
      (c.city || '').includes(q)
    )
  }, [customers, search])

  const handleSave = async (data: Partial<Customer>) => {
    try {
      const saved = await upsertCustomer(editing ? { ...editing, ...data } : data)
      if (editing) {
        setCustomers(prev => prev.map(c => c.id === editing.id ? saved : c))
        toast({ type: 'success', title: 'הלקוח עודכן בהצלחה' })
      } else {
        setCustomers(prev => [{ ...saved, id: saved.id || Math.random().toString(36).slice(2) }, ...prev])
        toast({ type: 'success', title: 'הלקוח נוסף בהצלחה' })
      }
    } catch {
      toast({ type: 'error', title: 'שגיאה בשמירת הלקוח' })
    }
    setEditing(undefined)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCustomer(deleteTarget.id)
      setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id))
      toast({ type: 'success', title: 'הלקוח נמחק' })
    } catch {
      toast({ type: 'error', title: 'שגיאה במחיקת הלקוח' })
    }
    setDeleteTarget(undefined)
  }

  return (
    <Shell title="לקוחות">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="לקוחות"
          description={`${customers.length} לקוחות במערכת`}
          action={
            <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
              <Plus size={16} />
              לקוח חדש
            </Button>
          }
        />

        <div className="mb-4 relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
          <Input
            className="pr-9"
            placeholder="חיפוש לפי שם, טלפון, אינסטגרם, עיר..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם מלא</TableHead>
                  <TableHead>טלפון</TableHead>
                  <TableHead className="hidden sm:table-cell">אינסטגרם</TableHead>
                  <TableHead className="hidden md:table-cell">עיר</TableHead>
                  <TableHead className="hidden md:table-cell">מקור</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead className="hidden lg:table-cell">נוסף</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-[#7a6a52] py-12">
                      {search ? 'לא נמצאו תוצאות לחיפוש זה' : 'אין לקוחות עדיין — הוסף לקוח ראשון'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium text-[#2c1810]">{customer.full_name}</div>
                      {customer.email && <div className="text-xs text-[#7a6a52]">{customer.email}</div>}
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-[#b8934a] hover:underline text-sm">
                          <Phone size={12} />
                          {customer.phone}
                        </a>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {customer.instagram ? (
                        <span className="flex items-center gap-1 text-[#7a6a52] text-sm">
                          <AtSign size={12} />
                          {customer.instagram}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{customer.city || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-[#7a6a52]">{customer.source || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(customer.customer_status)}>
                        {customer.customer_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[#7a6a52] text-sm">
                      {formatDate(customer.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(customer); setFormOpen(true) }} title="עריכה">
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(customer)} title="מחיקה" className="text-red-500 hover:text-red-700 hover:bg-red-50">
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

        <CustomerForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          customer={editing}
          onSave={handleSave}
        />
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
