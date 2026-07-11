'use client'

import { useState, useRef } from 'react'
import { useResetOnOpen } from '@/lib/hooks'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-field'
import { useToast } from '@/components/ui/toast'
import { SOURCES, JEWELRY_TYPES, DIAMOND_TYPES, GOLD_TYPES, GOLD_COLORS } from '@/lib/constants'
import { detectJewelryType, getAutoLeadStatus } from '@/lib/workflow'
import { upsertLead, findOrCreateCustomerFromLead } from '@/lib/data'
import { isValidIsraeliMobilePhone, isValidEmail, normalizeIsraeliPhone, PHONE_ERROR, EMAIL_ERROR } from '@/lib/validation'
import type { Lead } from '@/lib/types'

interface InquiryFormProps {
  open: boolean
  onClose: () => void
  onCreated?: (lead: Lead) => void
}

interface FormData {
  full_name: string
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
  full_name: '', phone: '', instagram: '', email: '',
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

  useResetOnOpen(open, () => {
    setForm(EMPTY)
    setErrors({})
    setSaving(false)
    detectedRef.current = false
  })

  const set = (key: keyof FormData, value: string) => {
    // Auto-detect the jewelry type from the inquiry message (once, and only
    // until the user picks a type manually).
    let detectedType: string | null = null
    if (key === 'original_message' && value && !form.jewelry_type && !detectedRef.current) {
      detectedType = detectJewelryType(value)
      if (detectedType) detectedRef.current = true
    }
    setForm(f => ({ ...f, [key]: value, ...(detectedType ? { jewelry_type: detectedType } : {}) }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.full_name.trim()) e.full_name = 'שם הוא שדה חובה'

    const phone = form.phone.trim()
    if (phone) {
      if (!isValidIsraeliMobilePhone(phone)) e.phone = PHONE_ERROR
    }

    const email = form.email.trim()
    if (email && !isValidEmail(email)) e.email = EMAIL_ERROR

    if (!form.phone.trim() && !form.instagram.trim() && !form.email.trim())
      e.phone = e.phone || 'נדרשת לפחות דרך יצירת קשר אחת'

    if (!form.source) e.source = 'נדרש מקור'
    if (!form.original_message.trim() && !form.jewelry_type)
      e.original_message = 'נדרשת הודעת פנייה או סוג תכשיט'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const normalizedPhone = form.phone ? normalizeIsraeliPhone(form.phone) : undefined
      const leadData: Partial<Lead> = {
        full_name: form.full_name,
        phone: normalizedPhone || undefined,
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

      const lead = await upsertLead(leadData)

      // Auto-link or create customer
      let customerDesc = ''
      try {
        const { customer, created } = await findOrCreateCustomerFromLead(lead)
        if (lead.id) {
          await upsertLead({ id: lead.id, customer_id: customer.id })
        }
        customerDesc = created ? 'נוצר לקוח חדש וקושר לליד' : 'הליד קושר ללקוח קיים'
      } catch { /* non-fatal */ }

      toast({
        type: 'success',
        title: `ליד חדש נפתח`,
        description: customerDesc || `${form.full_name} · סטטוס: ${lead.lead_status}`,
      })

      onCreated?.(lead)
      onClose()
    } catch (err) {
      console.error('Lead creation failed:', err)
      toast({ type: 'error', title: 'שגיאה בפתיחת הליד' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl mx-4">
      <DialogHeader title="+ ליד חדש" onClose={onClose} />
      <DialogBody className="space-y-5">

        <FormSection title="פרטי ליד">
          <FormGrid>
            <FormField label="שם מלא" required error={errors.full_name} htmlFor="lf_name">
              <Input
                id="lf_name"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                placeholder="שם ומשפחה"
                autoFocus
              />
            </FormField>
            <FormField label="טלפון" error={errors.phone} htmlFor="lf_phone">
              <Input
                id="lf_phone"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="0500000000"
                error={!!errors.phone}
              />
            </FormField>
            <FormField label="אינסטגרם" htmlFor="lf_ig">
              <Input
                id="lf_ig"
                value={form.instagram}
                onChange={e => set('instagram', e.target.value)}
                placeholder="@username"
              />
            </FormField>
            <FormField label='דוא"ל' error={errors.email} htmlFor="lf_email">
              <Input
                id="lf_email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="email@example.com"
                error={!!errors.email}
              />
            </FormField>
          </FormGrid>
          <FormField label="מקור" required error={errors.source} htmlFor="lf_source">
            <Select id="lf_source" value={form.source} onChange={e => set('source', e.target.value)}>
              <option value="">בחר מקור</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
        </FormSection>

        <FormSection title="פרטי הפנייה">
          <FormField label="הודעה מקורית" error={errors.original_message} htmlFor="lf_msg">
            <Textarea
              id="lf_msg"
              value={form.original_message}
              onChange={e => set('original_message', e.target.value)}
              placeholder="הדבק את ההודעה שקיבלת — סוג התכשיט יזוהה אוטומטית..."
              rows={3}
            />
          </FormField>

          <FormGrid cols={3}>
            <FormField label="סוג תכשיט" htmlFor="lf_jtype">
              <Select id="lf_jtype" value={form.jewelry_type} onChange={e => { set('jewelry_type', e.target.value); detectedRef.current = true }}>
                <option value="">זיהוי אוטומטי / בחר</option>
                {JEWELRY_TYPES.map(j => <option key={j} value={j}>{j}</option>)}
              </Select>
            </FormField>
            <FormField label="תקציב (₪)" htmlFor="lf_budget">
              <Input id="lf_budget" type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="10000" />
            </FormField>
            <FormField label="סגנון רצוי" htmlFor="lf_style">
              <Input id="lf_style" value={form.desired_style} onChange={e => set('desired_style', e.target.value)} placeholder="הילה, פאווה, סוליטר..." />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="פרטי תכשיט (אופציונלי)">
          <FormGrid cols={3}>
            <FormField label="סוג יהלום" htmlFor="lf_dtype">
              <Select id="lf_dtype" value={form.diamond_type} onChange={e => set('diamond_type', e.target.value)}>
                <option value="">בחר</option>
                {DIAMOND_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FormField>
            <FormField label="קראט" htmlFor="lf_carat">
              <Input id="lf_carat" type="number" step="0.01" value={form.carat} onChange={e => set('carat', e.target.value)} placeholder="1.00" />
            </FormField>
            <FormField label="סוג זהב" htmlFor="lf_gtype">
              <Select id="lf_gtype" value={form.gold_type} onChange={e => set('gold_type', e.target.value)}>
                <option value="">בחר</option>
                {GOLD_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
            </FormField>
            <FormField label="צבע זהב" htmlFor="lf_gcolor">
              <Select id="lf_gcolor" value={form.gold_color} onChange={e => set('gold_color', e.target.value)}>
                <option value="">בחר</option>
                {GOLD_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="מידה" htmlFor="lf_size">
              <Input id="lf_size" value={form.ring_size} onChange={e => set('ring_size', e.target.value)} placeholder="6.5" />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormField label="הערות" htmlFor="lf_notes">
          <Textarea id="lf_notes" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="הערות נוספות..." rows={2} />
        </FormField>

      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>ביטול</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'פותח...' : '+ ליד חדש'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
