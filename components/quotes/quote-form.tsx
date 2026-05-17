'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-field'
import { calculateQuoteCosts, formatCurrency, generateQuoteNumber, getProfitColor } from '@/lib/utils'
import type { Quote, Customer } from '@/lib/types'
import { cn } from '@/lib/utils'

interface QuoteFormProps {
  open: boolean
  onClose: () => void
  quote?: Quote
  customers: Customer[]
  onSave: (data: Partial<Quote>) => void
}

const JEWELRY_OPTIONS = ['טבעת אירוסין', 'טבעת נישואין', 'עגילים', 'שרשרת', 'צמיד', 'תליון', 'אחר']
const DIAMOND_OPTIONS = ['עגול', 'מרקיז', 'אובל', 'כרית', 'נסיכה', 'אמרלד', 'לב', 'אחר']
const GOLD_OPTIONS = ['14K', '18K', '9K']
const GOLD_COLOR_OPTIONS = ['צהוב', 'לבן', 'ורוד']
const COLOR_OPTIONS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
const CLARITY_OPTIONS = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']
const CUT_OPTIONS = ['מצוין', 'טוב מאוד', 'טוב']
const STATUS_OPTIONS = ['טיוטה', 'נשלחה', 'אושרה', 'נדחתה', 'פג תוקף']

const COST_FIELDS = [
  { key: 'diamond_cost', label: 'עלות יהלום' },
  { key: 'gold_cost', label: 'עלות זהב' },
  { key: 'labor_cost', label: 'עלות עבודה' },
  { key: 'setting_cost', label: 'עלות שיבוץ' },
  { key: 'packaging_cost', label: 'אריזה' },
  { key: 'shipping_cost', label: 'משלוח' },
  { key: 'other_cost', label: 'אחר' },
] as const

export function QuoteForm({ open, onClose, quote, customers, onSave }: QuoteFormProps) {
  const [form, setForm] = useState<Partial<Quote>>(
    quote || {
      quote_number: generateQuoteNumber(),
      quote_status: 'טיוטה',
      has_certificate: false,
      diamond_cost: 0, gold_cost: 0, labor_cost: 0,
      setting_cost: 0, packaging_cost: 0, shipping_cost: 0, other_cost: 0,
      sale_price: 0,
    }
  )

  const { total_cost, expected_profit, profit_margin } = calculateQuoteCosts(form)

  const set = (key: keyof Quote, value: string | number | boolean) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const handleSave = () => {
    const calcs = calculateQuoteCosts(form)
    onSave({ ...form, ...calcs })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-3xl mx-4">
      <DialogHeader title={quote ? 'עריכת הצעת מחיר' : 'הצעת מחיר חדשה'} onClose={onClose} />
      <DialogBody className="space-y-5">
        <FormSection title="פרטים כלליים">
          <FormGrid cols={3}>
            <FormField label="מספר הצעה" htmlFor="quote_number">
              <Input id="quote_number" value={form.quote_number || ''} readOnly className="bg-[#faf8f5]" />
            </FormField>
            <FormField label="לקוח" htmlFor="customer_id">
              <Select id="customer_id" value={form.customer_id || ''} onChange={e => set('customer_id', e.target.value)}>
                <option value="">בחר לקוח</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </Select>
            </FormField>
            <FormField label="סטטוס" htmlFor="quote_status">
              <Select id="quote_status" value={form.quote_status || 'טיוטה'} onChange={e => set('quote_status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
          </FormGrid>
          <FormField label="תיאור" htmlFor="description">
            <Input id="description" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="תיאור התכשיט" />
          </FormField>
        </FormSection>

        <FormSection title="פרטי תכשיט">
          <FormGrid cols={3}>
            <FormField label="סוג תכשיט" htmlFor="jewelry_type">
              <Select id="jewelry_type" value={form.jewelry_type || ''} onChange={e => set('jewelry_type', e.target.value)}>
                <option value="">בחר</option>
                {JEWELRY_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
              </Select>
            </FormField>
            <FormField label="סוג זהב" htmlFor="gold_type">
              <Select id="gold_type" value={form.gold_type || ''} onChange={e => set('gold_type', e.target.value)}>
                <option value="">בחר</option>
                {GOLD_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
            </FormField>
            <FormField label="צבע זהב" htmlFor="gold_color">
              <Select id="gold_color" value={form.gold_color || ''} onChange={e => set('gold_color', e.target.value)}>
                <option value="">בחר</option>
                {GOLD_COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="פרטי יהלום">
          <FormGrid cols={3}>
            <FormField label="סוג יהלום" htmlFor="diamond_type">
              <Select id="diamond_type" value={form.diamond_type || ''} onChange={e => set('diamond_type', e.target.value)}>
                <option value="">בחר</option>
                {DIAMOND_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FormField>
            <FormField label="קראט" htmlFor="carat">
              <Input id="carat" type="number" step="0.01" value={form.carat || ''} onChange={e => set('carat', Number(e.target.value))} placeholder="1.00" />
            </FormField>
            <FormField label="צבע" htmlFor="diamond_color">
              <Select id="diamond_color" value={form.diamond_color || ''} onChange={e => set('diamond_color', e.target.value)}>
                <option value="">בחר</option>
                {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="ניקיון" htmlFor="diamond_clarity">
              <Select id="diamond_clarity" value={form.diamond_clarity || ''} onChange={e => set('diamond_clarity', e.target.value)}>
                <option value="">בחר</option>
                {CLARITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="ליטוש" htmlFor="diamond_cut">
              <Select id="diamond_cut" value={form.diamond_cut || ''} onChange={e => set('diamond_cut', e.target.value)}>
                <option value="">בחר</option>
                {CUT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="תעודה GIA" htmlFor="has_certificate">
              <Select
                id="has_certificate"
                value={form.has_certificate ? 'yes' : 'no'}
                onChange={e => set('has_certificate', e.target.value === 'yes')}
              >
                <option value="no">ללא תעודה</option>
                <option value="yes">עם תעודה GIA</option>
              </Select>
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="עלויות ותמחור">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COST_FIELDS.map(({ key, label }) => (
              <FormField key={key} label={label} htmlFor={key}>
                <Input
                  id={key}
                  type="number"
                  value={(form[key] as number) || ''}
                  onChange={e => set(key, Number(e.target.value))}
                  placeholder="0"
                />
              </FormField>
            ))}
            <FormField label="מחיר מכירה" htmlFor="sale_price">
              <Input
                id="sale_price"
                type="number"
                value={form.sale_price || ''}
                onChange={e => set('sale_price', Number(e.target.value))}
                placeholder="0"
                className="border-[#b8934a] focus:ring-[#b8934a]"
              />
            </FormField>
          </div>

          {/* Calculated summary */}
          <div className="mt-3 p-4 bg-[#faf8f5] rounded-xl border border-[#e5ddd0]">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[#7a6a52] text-xs mb-0.5">סה"כ עלות</p>
                <p className="font-bold text-[#2c1810]">{formatCurrency(total_cost)}</p>
              </div>
              <div>
                <p className="text-[#7a6a52] text-xs mb-0.5">רווח צפוי</p>
                <p className={cn('font-bold', getProfitColor(profit_margin))}>
                  {formatCurrency(expected_profit)}
                </p>
              </div>
              <div>
                <p className="text-[#7a6a52] text-xs mb-0.5">מרווח</p>
                <p className={cn('font-bold', getProfitColor(profit_margin))}>
                  {profit_margin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </FormSection>

        <FormGrid>
          <FormField label="תוקף עד" htmlFor="valid_until">
            <Input id="valid_until" type="date" value={form.valid_until || ''} onChange={e => set('valid_until', e.target.value)} />
          </FormField>
        </FormGrid>

        <Textarea
          value={form.notes || ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="הערות..."
          rows={2}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>ביטול</Button>
        <Button onClick={handleSave}>{quote ? 'שמור שינויים' : 'צור הצעת מחיר'}</Button>
      </DialogFooter>
    </Dialog>
  )
}
