'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Shell } from '@/components/layout/shell'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-field'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useUnsavedChanges } from '@/lib/hooks'
import { isValidIsraeliMobilePhone, normalizeIsraeliPhone, PHONE_ERROR } from '@/lib/validation'
import { getSuppliers, upsertSupplier, deleteSupplier } from '@/lib/data'
import { SUPPLIER_CATEGORIES } from '@/lib/constants'
import type { Supplier } from '@/lib/types'
import { Plus, Search, Pencil, Trash2, Star } from 'lucide-react'

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="transition-opacity hover:opacity-100" style={{ opacity: n <= value ? 1 : 0.3 }}>
          <Star size={18} className="text-[#b8934a]" fill={n <= value ? '#b8934a' : 'none'} />
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
        <Star key={n} size={12} className={n <= value ? 'text-[#b8934a]' : 'text-[#e5ddd0]'} fill={n <= value ? '#b8934a' : '#e5ddd0'} />
      ))}
    </div>
  )
}

function SupplierForm({ open, onClose, supplier, onSave }: {
  open: boolean; onClose: () => void; supplier?: Supplier
  onSave: (data: Partial<Supplier>) => void
}) {
  const [form, setForm] = useState<Partial<Supplier>>(supplier || {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { isDirtyRef, confirmClose, setConfirmClose, markDirty, markClean, tryClose, confirmAndClose } = useUnsavedChanges(open)

  useEffect(() => {
    if (open) { setForm(supplier || {}); setErrors({}); markClean() }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof Supplier, v: string | number) => {
    setForm(f => ({ ...f, [k]: v }))
    markDirty()
    if (errors[k as string]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const handleSave = () => {
    const e: Record<string, string> = {}
    if (!form.name?.trim()) e.name = 'שם הספק הוא שדה חובה'
    const phone = form.phone?.trim() || ''
    if (phone && !isValidIsraeliMobilePhone(phone)) e.phone = PHONE_ERROR
    setErrors(e)
    if (Object.keys(e).length > 0) return
    const normalized = phone ? normalizeIsraeliPhone(phone) : phone
    isDirtyRef.current = false
    onSave({ ...form, phone: normalized || undefined })
    onClose()
  }

  const handleClose = () => tryClose(onClose)

  return (
    <>
      <Dialog open={open} onClose={handleClose} className="max-w-xl mx-4">
        <DialogHeader title={supplier ? 'עריכת ספק' : 'ספק חדש'} onClose={handleClose} />
        <DialogBody className="space-y-5">
          <FormSection title="פרטי ספק">
            <FormField label="שם הספק" required error={errors.name} htmlFor="sup_name">
              <Input id="sup_name" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="שם הספק" error={!!errors.name} />
            </FormField>
            <FormGrid>
              <FormField label="איש קשר" htmlFor="sup_contact">
                <Input id="sup_contact" value={form.contact_name || ''} onChange={e => set('contact_name', e.target.value)} placeholder="שם איש קשר" />
              </FormField>
              <FormField label="טלפון" error={errors.phone} htmlFor="sup_phone">
                <Input id="sup_phone" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="0500000000" error={!!errors.phone} />
              </FormField>
              <FormField label="קטגוריה" htmlFor="sup_category">
                <Select id="sup_category" value={form.category || ''} onChange={e => set('category', e.target.value)}>
                  <option value="">בחר קטגוריה</option>
                  {SUPPLIER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
              {[
                { label: 'איכות', key: 'quality_rating' as keyof Supplier },
                { label: 'אמינות', key: 'reliability_rating' as keyof Supplier },
                { label: 'מחיר', key: 'price_rating' as keyof Supplier },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-[#4a3728]">{label}</span>
                  <StarRating value={(form[key] as number) || 0} onChange={v => set(key, v)} />
                </div>
              ))}
            </div>
          </FormSection>
          <FormSection title="הערות">
            <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="הערות על הספק..." rows={3} />
          </FormSection>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>ביטול</Button>
          <Button onClick={handleSave}>{supplier ? 'שמור שינויים' : 'הוסף ספק'}</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => confirmAndClose(onClose)}
        title="יציאה ללא שמירה"
        description="יש שינויים שלא נשמרו. לצאת בלי לשמור?"
        confirmLabel="צא בלי לשמור"
        cancelLabel="המשך עריכה"
        variant="default"
      />
    </>
  )
}

export default function SuppliersPage() {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Supplier | undefined>()

  useEffect(() => {
    getSuppliers()
      .then(setSuppliers)
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת ספקים' }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q) ||
      (s.location || '').includes(q)
    )
  }, [suppliers, search])

  const handleSave = useCallback(async (data: Partial<Supplier>) => {
    try {
      const saved = await upsertSupplier(editing ? { ...editing, ...data } : data)
      if (editing) {
        setSuppliers(prev => prev.map(s => s.id === editing.id ? saved : s))
        toast({ type: 'success', title: 'הספק עודכן' })
      } else {
        setSuppliers(prev => [{ ...saved, id: saved.id || Math.random().toString(36).slice(2) }, ...prev])
        toast({ type: 'success', title: 'ספק חדש נוסף' })
      }
    } catch {
      toast({ type: 'error', title: 'שגיאה בשמירת הספק' })
    }
    setEditing(undefined)
  }, [editing, toast])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteSupplier(deleteTarget.id)
      setSuppliers(prev => prev.filter(s => s.id !== deleteTarget.id))
      toast({ type: 'success', title: 'הספק נמחק' })
    } catch {
      toast({ type: 'error', title: 'שגיאה במחיקת הספק' })
    }
    setDeleteTarget(undefined)
  }, [deleteTarget, toast])

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
          {loading ? <TableSkeleton rows={4} cols={6} /> : (
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
                      {search ? 'לא נמצאו ספקים' : 'אין ספקים עדיין — הוסף ספק ראשון'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="font-medium text-[#2c1810]">{supplier.name}</div>
                      {supplier.contact_name && <div className="text-xs text-[#7a6a52]">{supplier.contact_name}</div>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#f5efe0] text-[#4a3728]">
                        {supplier.category || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-[#7a6a52] text-sm">{supplier.phone || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-[#7a6a52] text-sm">{supplier.location || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-[#7a6a52] text-sm">{supplier.delivery_time || '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell"><StarDisplay value={supplier.quality_rating} /></TableCell>
                    <TableCell className="hidden lg:table-cell"><StarDisplay value={supplier.reliability_rating} /></TableCell>
                    <TableCell className="hidden lg:table-cell"><StarDisplay value={supplier.price_rating} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(supplier); setFormOpen(true) }} title="עריכה">
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(supplier)} title="מחיקה" className="text-red-500 hover:text-red-700 hover:bg-red-50">
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

        <SupplierForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(undefined) }} supplier={editing} onSave={handleSave} />
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(undefined)}
          onConfirm={handleDelete}
          title="מחיקת ספק"
          description={`האם אתה בטוח שברצונך למחוק את "${deleteTarget?.name}"?`}
          confirmLabel="מחק"
        />
      </div>
    </Shell>
  )
}
