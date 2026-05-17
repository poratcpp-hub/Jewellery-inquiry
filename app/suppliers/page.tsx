'use client'

import { useState, useMemo } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-field'
import { demoSuppliers } from '@/lib/demo-data'
import type { Supplier } from '@/lib/types'
import { Plus, Search, Pencil, Star } from 'lucide-react'

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="text-[#b8934a] transition-opacity hover:opacity-100"
          style={{ opacity: n <= value ? 1 : 0.3 }}
        >
          <Star size={18} fill={n <= value ? '#b8934a' : 'none'} />
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ value }: { value?: number }) {
  if (!value) return <span className="text-[#7a6a52]">—</span>
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={12}
          className={n <= value ? 'text-[#b8934a]' : 'text-[#e5ddd0]'}
          fill={n <= value ? '#b8934a' : '#e5ddd0'}
        />
      ))}
    </div>
  )
}

function SupplierForm({ open, onClose, supplier, onSave }: {
  open: boolean
  onClose: () => void
  supplier?: Supplier
  onSave: (data: Partial<Supplier>) => void
}) {
  const [form, setForm] = useState<Partial<Supplier>>(supplier || {})
  const set = (k: keyof Supplier, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const CATEGORIES = ['יהלומים', 'זהב', 'כסף', 'ייצור', 'אריזה', 'משלוח', 'אחר']

  return (
    <Dialog open={open} onClose={onClose} className="max-w-xl mx-4">
      <DialogHeader title={supplier ? 'עריכת ספק' : 'ספק חדש'} onClose={onClose} />
      <DialogBody className="space-y-5">
        <FormSection title="פרטי ספק">
          <FormField label="שם הספק" required htmlFor="sup_name">
            <Input id="sup_name" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="שם הספק" />
          </FormField>
          <FormGrid>
            <FormField label="איש קשר" htmlFor="sup_contact">
              <Input id="sup_contact" value={form.contact_name || ''} onChange={e => set('contact_name', e.target.value)} placeholder="שם איש קשר" />
            </FormField>
            <FormField label="טלפון" htmlFor="sup_phone">
              <Input id="sup_phone" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="03-0000000" />
            </FormField>
            <FormField label="קטגוריה" htmlFor="sup_category">
              <Select id="sup_category" value={form.category || ''} onChange={e => set('category', e.target.value)}>
                <option value="">בחר קטגוריה</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="מיקום" htmlFor="sup_location">
              <Input id="sup_location" value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="עיר / אזור" />
            </FormField>
            <FormField label="זמן אספקה" htmlFor="sup_delivery">
              <Input id="sup_delivery" value={form.delivery_time || ''} onChange={e => set('delivery_time', e.target.value)} placeholder="3-5 ימי עסקים" />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="דירוג">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4a3728]">איכות</span>
              <StarRating value={form.quality_rating || 0} onChange={v => set('quality_rating', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4a3728]">אמינות</span>
              <StarRating value={form.reliability_rating || 0} onChange={v => set('reliability_rating', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4a3728]">מחיר</span>
              <StarRating value={form.price_rating || 0} onChange={v => set('price_rating', v)} />
            </div>
          </div>
        </FormSection>

        <FormSection title="הערות">
          <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="הערות על הספק..." rows={3} />
        </FormSection>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ביטול</Button>
        <Button onClick={() => { if (form.name) { onSave(form); onClose() } }}>
          {supplier ? 'שמור שינויים' : 'הוסף ספק'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(
    demoSuppliers.map(s => ({ ...s, created_at: new Date().toISOString() }))
  )
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | undefined>()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q) ||
      (s.location || '').includes(q)
    )
  }, [suppliers, search])

  const handleSave = (data: Partial<Supplier>) => {
    if (editing) {
      setSuppliers(prev => prev.map(s => s.id === editing.id ? { ...s, ...data } : s))
    } else {
      setSuppliers(prev => [{
        ...data as Supplier,
        id: Math.random().toString(36).slice(2),
        created_at: new Date().toISOString(),
      }, ...prev])
    }
    setEditing(undefined)
  }

  return (
    <Shell title="ספקים">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="ספקים"
          description={`${suppliers.length} ספקים`}
          action={
            <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
              <Plus size={16} />
              ספק חדש
            </Button>
          }
        />

        <div className="mb-4 relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a52]" />
          <Input className="pr-9" placeholder="חיפוש לפי שם, קטגוריה, מיקום..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="bg-white rounded-xl border border-[#e5ddd0] shadow-[0_1px_8px_rgba(26,18,9,0.06)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם ספק</TableHead>
                <TableHead className="hidden sm:table-cell">קטגוריה</TableHead>
                <TableHead className="hidden md:table-cell">טלפון</TableHead>
                <TableHead className="hidden md:table-cell">מיקום</TableHead>
                <TableHead className="hidden lg:table-cell">זמן אספקה</TableHead>
                <TableHead className="hidden sm:table-cell">איכות</TableHead>
                <TableHead className="hidden lg:table-cell">אמינות</TableHead>
                <TableHead className="hidden lg:table-cell">מחיר</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-[#7a6a52] py-12">
                    לא נמצאו ספקים
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="font-medium text-[#2c1810]">{supplier.name}</div>
                    {supplier.contact_name && (
                      <div className="text-xs text-[#7a6a52]">{supplier.contact_name}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#f5efe0] text-[#4a3728]">
                      {supplier.category || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-[#7a6a52]">{supplier.phone || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell text-[#7a6a52]">{supplier.location || '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-[#7a6a52]">{supplier.delivery_time || '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell"><StarDisplay value={supplier.quality_rating} /></TableCell>
                  <TableCell className="hidden lg:table-cell"><StarDisplay value={supplier.reliability_rating} /></TableCell>
                  <TableCell className="hidden lg:table-cell"><StarDisplay value={supplier.price_rating} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(supplier); setFormOpen(true) }} title="עריכה">
                      <Pencil size={15} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <SupplierForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          supplier={editing}
          onSave={handleSave}
        />
      </div>
    </Shell>
  )
}
