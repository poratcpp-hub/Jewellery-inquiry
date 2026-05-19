'use client'

import { useState } from 'react'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-field'
import { LEAD_STATUSES, LEAD_PRIORITIES, SOURCES, JEWELRY_TYPES, DIAMOND_TYPES, GOLD_TYPES } from '@/lib/constants'
import type { Lead, Customer } from '@/lib/types'

interface LeadFormProps {
  open: boolean
  onClose: () => void
  lead?: Lead
  customers?: Customer[]
  onSave: (data: Partial<Lead>) => void
}

export function LeadForm({ open, onClose, lead, customers = [], onSave }: LeadFormProps) {
  const [form, setForm] = useState<Partial<Lead>>(
    lead || { lead_status: 'חדש', priority: 'בינוני' }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: keyof Lead, value: string | number) => {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key as string]) setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name?.trim()) e.full_name = 'שם הוא שדה חובה'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave(form)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl mx-4">
      <DialogHeader title={lead ? 'עריכת ליד' : 'ליד חדש'} onClose={onClose} />
      <DialogBody className="space-y-5">
        <FormSection title="פרטי ליד">
          <FormGrid>
            <FormField label="שם מלא" required error={errors.full_name} htmlFor="full_name">
              <Input
                id="full_name"
                value={form.full_name || ''}
                onChange={e => set('full_name', e.target.value)}
                placeholder="שם ומשפחה"
              />
            </FormField>
            <FormField label="טלפון" htmlFor="phone">
              <Input
                id="phone"
                value={form.phone || ''}
                onChange={e => set('phone', e.target.value)}
                placeholder="050-0000000"
              />
            </FormField>
            <FormField label="מקור" htmlFor="source">
              <Select id="source" value={form.source || ''} onChange={e => set('source', e.target.value)}>
                <option value="">בחר מקור</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="תקציב (₪)" htmlFor="budget">
              <Input
                id="budget"
                type="number"
                value={form.budget || ''}
                onChange={e => set('budget', Number(e.target.value))}
                placeholder="10000"
              />
            </FormField>
          </FormGrid>
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
            <FormField label="סוג זהב" htmlFor="gold_type">
              <Select id="gold_type" value={form.gold_type || ''} onChange={e => set('gold_type', e.target.value)}>
                <option value="">בחר</option>
                {GOLD_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
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
              <Input
                id="follow_up_date"
                type="date"
                value={form.follow_up_date || ''}
                onChange={e => set('follow_up_date', e.target.value)}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="הערות">
          <Textarea
            value={form.notes || ''}
            onChange={e => set('notes', e.target.value)}
            placeholder="הערות על הליד..."
            rows={3}
          />
        </FormSection>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ביטול</Button>
        <Button onClick={handleSave}>{lead ? 'שמור שינויים' : 'הוסף ליד'}</Button>
      </DialogFooter>
    </Dialog>
  )
}
