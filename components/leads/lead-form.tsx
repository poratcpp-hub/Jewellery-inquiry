'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-field'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LEAD_STATUSES, LEAD_PRIORITIES, SOURCES, JEWELRY_TYPES, DIAMOND_TYPES, GOLD_TYPES, GOLD_COLORS } from '@/lib/constants'
import { isValidIsraeliMobilePhone, isValidEmail, normalizeIsraeliPhone, PHONE_ERROR, EMAIL_ERROR } from '@/lib/validation'
import { useUnsavedChanges } from '@/lib/hooks'
import type { Lead, Customer } from '@/lib/types'

interface LeadFormProps {
  open: boolean
  onClose: () => void
  lead?: Lead
  customers?: Customer[]
  onSave: (data: Partial<Lead>) => void
}

const DEFAULTS: Partial<Lead> = { lead_status: 'חדש', priority: 'בינוני' }

export function LeadForm({ open, onClose, lead, customers = [], onSave }: LeadFormProps) {
  const [form, setForm] = useState<Partial<Lead>>(lead || DEFAULTS)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { isDirtyRef, confirmClose, setConfirmClose, markDirty, markClean, tryClose, confirmAndClose } = useUnsavedChanges(open)

  useEffect(() => {
    if (open) {
      setForm(lead || DEFAULTS)
      setErrors({})
      markClean()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof Lead, value: string | number) => {
    setForm(f => ({ ...f, [key]: value }))
    markDirty()
    if (errors[key as string]) setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name?.trim()) e.full_name = 'שם הוא שדה חובה'

    const phone = form.phone?.trim() || ''
    if (phone) {
      if (!isValidIsraeliMobilePhone(phone)) e.phone = PHONE_ERROR
    }

    const email = form.email?.trim() || ''
    if (email && !isValidEmail(email)) e.email = EMAIL_ERROR

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const normalized = form.phone ? normalizeIsraeliPhone(form.phone) : form.phone
    isDirtyRef.current = false
    onSave({ ...form, phone: normalized || undefined })
    onClose()
  }

  const handleClose = () => tryClose(onClose)

  return (
    <>
      <Dialog open={open} onClose={handleClose} className="max-w-2xl mx-4">
        <DialogHeader title={lead ? 'עריכת ליד' : 'ליד חדש'} onClose={handleClose} />
        <DialogBody className="space-y-5">
          <FormSection title="פרטי ליד">
            <FormGrid>
              <FormField label="שם מלא" required error={errors.full_name} htmlFor="full_name">
                <Input id="full_name" value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} placeholder="שם ומשפחה" error={!!errors.full_name} />
              </FormField>
              <FormField label="טלפון" error={errors.phone} htmlFor="phone">
                <Input id="phone" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="0500000000" error={!!errors.phone} />
              </FormField>
              <FormField label="אינסטגרם" htmlFor="instagram">
                <Input id="instagram" value={form.instagram || ''} onChange={e => set('instagram', e.target.value)} placeholder="@username" />
              </FormField>
              <FormField label='דוא"ל' error={errors.email} htmlFor="email">
                <Input id="email" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="example@email.com" error={!!errors.email} />
              </FormField>
              <FormField label="מקור" htmlFor="source">
                <Select id="source" value={form.source || ''} onChange={e => set('source', e.target.value)}>
                  <option value="">בחר מקור</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>
              <FormField label="תקציב (₪)" htmlFor="budget">
                <Input id="budget" type="number" value={form.budget || ''} onChange={e => set('budget', Number(e.target.value))} placeholder="10000" />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="הודעת הפנייה">
            <FormField label="הודעה מקורית" htmlFor="original_message">
              <Textarea
                id="original_message"
                value={form.original_message || ''}
                onChange={e => set('original_message', e.target.value)}
                placeholder="תוכן הפנייה של הלקוח..."
                rows={3}
              />
            </FormField>
          </FormSection>

          <FormSection title="פרטי תכשיט">
            <FormGrid cols={3}>
              <FormField label="סוג תכשיט" htmlFor="jewelry_type">
                <Select id="jewelry_type" value={form.jewelry_type || ''} onChange={e => set('jewelry_type', e.target.value)}>
                  <option value="">בחר</option>
                  {JEWELRY_TYPES.map(j => <option key={j} value={j}>{j}</option>)}
                </Select>
              </FormField>
              <FormField label="סוג יהלום" htmlFor="diamond_type">
                <Select id="diamond_type" value={form.diamond_type || ''} onChange={e => set('diamond_type', e.target.value)}>
                  <option value="">בחר</option>
                  {DIAMOND_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </FormField>
              <FormField label="קראט" htmlFor="carat">
                <Input id="carat" type="number" step="0.01" value={form.carat || ''} onChange={e => set('carat', Number(e.target.value))} placeholder="1.00" />
              </FormField>
              <FormField label="סוג זהב" htmlFor="gold_type">
                <Select id="gold_type" value={form.gold_type || ''} onChange={e => set('gold_type', e.target.value)}>
                  <option value="">בחר</option>
                  {GOLD_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                </Select>
              </FormField>
              <FormField label="צבע זהב" htmlFor="gold_color">
                <Select id="gold_color" value={form.gold_color || ''} onChange={e => set('gold_color', e.target.value)}>
                  <option value="">בחר</option>
                  {GOLD_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormField>
              <FormField label="מידה" htmlFor="ring_size">
                <Input id="ring_size" value={form.ring_size || ''} onChange={e => set('ring_size', e.target.value)} placeholder="6.5" />
              </FormField>
              <FormField label="סגנון רצוי" htmlFor="desired_style">
                <Input id="desired_style" value={form.desired_style || ''} onChange={e => set('desired_style', e.target.value)} placeholder="סוליטר, הילה, פאווה..." />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="ניהול ליד">
            <FormGrid>
              <FormField label="סטטוס" htmlFor="lead_status">
                <Select id="lead_status" value={form.lead_status || 'חדש'} onChange={e => set('lead_status', e.target.value)}>
                  {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>
              <FormField label="עדיפות" htmlFor="priority">
                <Select id="priority" value={form.priority || 'בינוני'} onChange={e => set('priority', e.target.value)}>
                  {LEAD_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </Select>
              </FormField>
              <FormField label="תאריך מעקב" htmlFor="follow_up_date">
                <Input id="follow_up_date" type="date" value={form.follow_up_date || ''} onChange={e => set('follow_up_date', e.target.value)} />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="הערות">
            <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="הערות על הליד..." rows={3} />
          </FormSection>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>ביטול</Button>
          <Button onClick={handleSave}>{lead ? 'שמור שינויים' : 'הוסף ליד'}</Button>
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
