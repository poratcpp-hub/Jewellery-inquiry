'use client'

import { useState, useMemo } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { CustomerForm } from '@/components/customers/customer-form'
import { formatDate } from '@/lib/utils'
import { demoCustomers } from '@/lib/demo-data'
import type { Customer } from '@/lib/types'
import { Plus, Search, Pencil, Phone, AtSign } from 'lucide-react'

function generateId() {
  return Math.random().toString(36).slice(2)
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(
    demoCustomers.map(c => ({ ...c, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))
  )
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | undefined>()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.instagram || '').toLowerCase().includes(q) ||
      (c.city || '').includes(q)
    )
  }, [customers, search])

  const handleSave = (data: Partial<Customer>) => {
    if (editing) {
      setCustomers(prev => prev.map(c =>
        c.id === editing.id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
      ))
    } else {
      const newCustomer: Customer = {
        ...data as Customer,
        id: generateId(),
        customer_status: data.customer_status || 'חדש',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setCustomers(prev => [newCustomer, ...prev])
    }
    setEditing(undefined)
  }

  const openEdit = (c: Customer) => {
    setEditing(c)
    setFormOpen(true)
  }

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <Shell title="לקוחות">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="לקוחות"
          description={`${customers.length} לקוחות במערכת`}
          action={
            <Button onClick={openNew}>
              <Plus size={16} />
              לקוח חדש
            </Button>
          }
        />

        {/* Search */}
        <div className="mb-4 relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
          <Input
            className="pr-9"
            placeholder="חיפוש לפי שם, טלפון, אינסטגרם..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
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
                    לא נמצאו לקוחות
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(customer => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium text-[#2c1810]">{customer.full_name}</div>
                    {customer.email && (
                      <div className="text-xs text-[#7a6a52]">{customer.email}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.phone ? (
                      <a
                        href={`tel:${customer.phone}`}
                        className="flex items-center gap-1 text-[#b8934a] hover:underline"
                      >
                        <Phone size={12} />
                        {customer.phone}
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {customer.instagram ? (
                      <span className="flex items-center gap-1 text-[#7a6a52]">
                        <AtSign size={12} />
                        {customer.instagram}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{customer.city || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell">{customer.source || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(customer.customer_status)}>
                      {customer.customer_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-[#7a6a52]">
                    {formatDate(customer.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(customer)}
                      title="עריכה"
                    >
                      <Pencil size={15} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <CustomerForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          customer={editing}
          onSave={handleSave}
        />
      </div>
    </Shell>
  )
}
