'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-field'
import { useToast } from '@/components/ui/toast'
import { SOURCES, JEWELRY_TYPES, DIAMOND_TYPES, GOLD_TYPES, GOLD_COLORS } from '@/lib/constants'
import { detectJewelryType, getAutoLeadStatus } from '@/lib/workflow'
import { findCustomerByContact, upsertCustomer, upsertLead } from '@/lib/data'
import type { Lead } from '@/lib/types'

interface InquiryFormProps {
  open: boolean
  onClose: () => void
  onCreated?: (lead: Lead) => void
}

interface FormData {
  customer_name: string
  phone: string
  instagram: string
  email: string
  source: string
  original_message: string
  jewelry_type: string
  budget: string
  diamond_type: string
  gold_type: string
  gold_color: string
  carat: string
  ring_size: string
  desired_style: string
  notes: string
}

const EMPTY: FormData = {
  customer_name: '', phone: '', instagram: '', email: '',
  source: '', original_message: '', jewelry_type: '', budget: '',
  diamond_type: '', gold_type: '', gold_color: '', carat: '',
  ring_size: '', desired_style: '', notes: '',
}

export function InquiryForm({ open, onClose, onCreated }: InquiryFormProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [saving, setSaving] = useState(false)
  const detectedRef = useRef(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setErrors({})
      setSaving(false)
      detectedRef.current = false
    }
  }, [open])

  // Auto-detect jewelry type from message
  useEffect(() => {
    if (form.original_message && !form.jewelry_type && !detectedRef.current) {
      const detected = detectJewelryType(form.original_message)
      if (detected) {
        setForm(f => ({ ...f, jewelry_type: detected }))
        detectedRef.current = true
      }
    }
  }, [form.original_message, form.jewelry_type])

  const set = (key: keyof FormData, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.customer_name.trim()) e.customer_name = 'שם הוא שדה חובה'
    if (!form.phone.trim() && !form.instagram.trim() && !form.email.trim())
      e.phone = 'נדרשת לפחות דרך יצירת קשר אחת (טלפון / אינסטגרם / מייל)'
    if (!form.source) e.source = 'נדרש מקור פנייה'
    if (!form.original_message.trim() && !form.jewelry_type)
      e.original_message = 'נדרשת הודעת פנייה או בחירת סוג תכשיט'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      // 1. Find existing customer by phone → instagram → email
      const existing = await findCustomerByContact(
        form.phone || undefined,
        form.instagram || undefined,
        form.email || undefined,
      )

      let customer = existing
      const isNew = !existing
      if (!customer) {
        customer = await upsertCustomer({
          full_name: form.customer_name,
          phone: form.phone || undefined,
          instagram: form.instagram || undefined,
          email: form.email || undefined,
          source: form.source || undefined,
          customer_status: 'ליד חדש',
        })
      }

      // 2. Build lead and determine auto-status
      const leadData: Partial<Lead> = {
        customer_id: customer.id,
        full_name: form.customer_name,
        phone: form.phone || undefined,
        instagram: form.instagram || undefined,
        email: form.email || undefined,
        source: form.source || undefined,
        original_message: form.original_message || undefined,
        jewelry_type: form.jewelry_type || undefined,
        diamond_type: form.diamond_type || undefined,
        gold_type: form.gold_type || undefined,
        gold_color: form.gold_color || undefined,
        carat: form.carat ? Number(form.carat) : undefined,
        ring_size: form.ring_size || undefined,
        desired_style: form.desired_style || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        notes: form.notes || undefined,
        priority: 'בינוני',
      }
      leadData.lead_status = getAutoLeadStatus(leadData)

      // 3. Create lead
      const lead = await upsertLead(leadData)

      toast({
        type: isNew ? 'success' : 'info',
        title: 'פנייה חדשה נפתחה',
        description: isNew
          ? `לקוח חדש נוצר: "${customer.full_name}" · סטטוס ליד: ${lead.lead_status}`
          : `קושר ללקוח קיים: "${customer.full_name}" · סטטוס ליד: ${lead.lead_status}`,
      })

      onCreated?.(lead)
      onClose()
    } catch (err) {
      console.error('Inquiry submit failed:', err)
      toast({ type: 'error', title: 'שגיאה בפתיחת הפנייה' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl mx-4">
      <DialogHeader title="פנייה חדשה" onClose={onClose} />
      <DialogBody className="space-y-5">

        <FormSection title="פרטי לקוח">
          <FormGrid>
            <FormField label="שם מלא" required error={errors.customer_name} htmlFor="iq_name">
              <Input
                id="iq_name"
                value={form.customer_name}
                onChange={e => set('customer_name', e.target.value)}
                placeholder="שם ומשפחה"
                autoFocus
              />
            </FormField>
            <FormField label="טלפון" error={errors.phone} htmlFor="iq_phone">
              <Input
                id="iq_phone"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="050-0000000"
              />
            </FormField>
            <FormField label="אינסטגרם" htmlFor="iq_ig">
              <Input
                id="iq_ig"
                value={form.instagram}
                onChange={e => set('instagram', e.target.value)}
                placeholder="@username"
              />
            </FormField>
            <FormField label='דוא"ל' htmlFor="iq_email">
              <Input
                id="iq_email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="email@example.com"
              />
            </FormField>
          </FormGrid>
          <FormField label="מקור פנייה" required error={errors.source} htmlFor="iq_source">
            <Select id="iq_source" value={form.source} onChange={e => set('source', e.target.value)}>
              <option value="">בחר מקור</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
        </FormSection>

        <FormSection title="פרטי הפנייה">
          <FormField label="הודעה מקורית מהלקוח" error={errors.original_message} htmlFor="iq_msg">
            <Textarea
              id="iq_msg"
              value={form.original_message}
              onChange={e => set('original_message', e.target.value)}
              placeholder="הדבק כאן את ההודעה שקיבלת מהלקוח — סוג התכשיט יזוהה אוטומטית..."
              rows={3}
            />
          </FormField>

          <FormGrid cols={3}>
            <FormField label="סוג תכשיט" htmlFor="iq_jtype">
              <Select id="iq_jtype" value={form.jewelry_type} onChange={e => { set('jewelry_type', e.target.value); detectedRef.current = true }}>
                <option value="">זוהה אוטומטית / בחר</option>
                {JEWELRY_TYPES.map(j => <option key={j} value={j}>{j}</option>)}
              </Select>
            </FormField>
            <FormField label="תקציב (₪)" htmlFor="iq_budget">
              <Input
                id="iq_budget"
                type="number"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
                placeholder="10000"
              />
            </FormField>
            <FormField label="סגנון רצוי" htmlFor="iq_style">
              <Input
                id="iq_style"
                value={form.desired_style}
                onChange={e => set('desired_style', e.target.value)}
                placeholder="הילה, פאווה, סוליטר..."
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="פרטי תכשיט (אופציונלי)">
          <FormGrid cols={3}>
            <FormField label="סוג יהלום" htmlFor="iq_dtype">
              <Select id="iq_dtype" value={form.diamond_type} onChange={e => set('diamond_type', e.target.value)}>
                <option value="">בחר</option>
                {DIAMOND_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FormField>
            <FormField label="קראט" htmlFor="iq_carat">
              <Input
                id="iq_carat"
                type="number"
                step="0.01"
                value={form.carat}
                onChange={e => set('carat', e.target.value)}
                placeholder="1.00"
              />
            </FormField>
            <FormField label="סוג זהב" htmlFor="iq_gtype">
              <Select id="iq_gtype" value={form.gold_type} onChange={e => set('gold_type', e.target.value)}>
                <option value="">בחר</option>
                {GOLD_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
            </FormField>
            <FormField label="צבע זהב" htmlFor="iq_gcolor">
              <Select id="iq_gcolor" value={form.gold_color} onChange={e => set('gold_color', e.target.value)}>
                <option value="">בחר</option>
                {GOLD_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="מידה (טבעת)" htmlFor="iq_size">
              <Input
                id="iq_size"
                value={form.ring_size}
                onChange={e => set('ring_size', e.target.value)}
                placeholder="6.5"
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormField label="הערות" htmlFor="iq_notes">
          <Textarea
            id="iq_notes"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="הערות נוספות..."
            rows={2}
          />
        </FormField>

      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>ביטול</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'פותח...' : '+ פתח פנייה'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
