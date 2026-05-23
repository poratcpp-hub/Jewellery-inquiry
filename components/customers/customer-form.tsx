'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-field'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Customer } from '@/lib/types'

interface CustomerFormProps {
  open: boolean
  onClose: () => void
  customer?: Customer
  onSave: (data: Partial<Customer>) => void
}

const STATUS_OPTIONS = ['לקוח חדש', 'לקוח חוזר', 'VIP', 'לא פעיל']
const SOURCE_OPTIONS = ['אינסטגרם', 'פייסבוק', 'המלצה', 'אתר', 'גוגל', 'אחר']

const DEFAULTS: Partial<Customer> = { customer_status: 'לקוח חדש' }

export function CustomerForm({ open, onClose, customer, onSave }: CustomerFormProps) {
  const [form, setForm] = useState<Partial<Customer>>(customer || DEFAULTS)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isDirtyRef = useRef(false)
  const [confirmClose, setConfirmClose] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(customer || DEFAULTS)
      setErrors({})
      isDirtyRef.current = false
      setConfirmClose(false)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof Customer, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    isDirtyRef.current = true
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name?.trim()) e.full_name = 'שם מלא הוא שדה חובה'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave(form)
    onClose()
  }

  const handleClose = () => {
    if (isDirtyRef.current) {
      setConfirmClose(true)
    } else {
      onClose()
    }
  }

  const isEdit = !!customer

  return (
    <>
      <Dialog open={open} onClose={handleClose} className="max-w-xl mx-4">
        <DialogHeader title={isEdit ? 'עריכת לקוח' : 'לקוח חדש'} onClose={handleClose} />
        <DialogBody className="space-y-5">
          <FormSection title="פרטים אישיים">
            <FormField label="שם מלא" required error={errors.full_name} htmlFor="full_name">
              <Input
                id="full_name"
                value={form.full_name || ''}
                onChange={e => set('full_name', e.target.value)}
                placeholder="שם ומשפחה"
                error={!!errors.full_name}
              />
            </FormField>
            <FormGrid>
              <FormField label="טלפון" htmlFor="phone">
                <Input
                  id="phone"
                  value={form.phone || ''}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="050-0000000"
                  type="tel"
                />
              </FormField>
              <FormField label="אינסטגרם" htmlFor="instagram">
                <Input
                  id="instagram"
                  value={form.instagram || ''}
                  onChange={e => set('instagram', e.target.value)}
                  placeholder="@username"
                />
              </FormField>
              <FormField label='דוא"ל' htmlFor="email">
                <Input
                  id="email"
                  value={form.email || ''}
                  onChange={e => set('email', e.target.value)}
                  placeholder="example@mail.com"
                  type="email"
                />
              </FormField>
              <FormField label="עיר" htmlFor="city">
                <Input
                  id="city"
                  value={form.city || ''}
                  onChange={e => set('city', e.target.value)}
                  placeholder="תל אביב"
                />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="סיווג">
            <FormGrid>
              <FormField label="מקור" htmlFor="source">
                <Select id="source" value={form.source || ''} onChange={e => set('source', e.target.value)}>
                  <option value="">בחר מקור</option>
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>
              <FormField label="סטטוס לקוח" htmlFor="customer_status">
                <Select
                  id="customer_status"
                  value={form.customer_status || 'לקוח חדש'}
                  onChange={e => set('customer_status', e.target.value)}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="הערות">
            <Textarea
              value={form.notes || ''}
              onChange={e => set('notes', e.target.value)}
              placeholder="הערות נוספות על הלקוח..."
              rows={3}
            />
          </FormSection>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>ביטול</Button>
          <Button onClick={handleSave}>{isEdit ? 'שמור שינויים' : 'הוסף לקוח'}</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => { setConfirmClose(false); onClose() }}
        title="יציאה ללא שמירה"
        description="יש פרטים שלא נשמרו. האם לצאת?"
        confirmLabel="צא ללא שמירה"
      />
    </>
  )
}
