'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField, FormGrid, FormSection } from '@/components/ui/form-field'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { calculateOrderFinancials, formatCurrency, generateOrderNumber, getProfitColor } from '@/lib/utils'
import { ORDER_STATUSES, PAYMENT_STATUSES, PRODUCTION_STATUSES, JEWELRY_TYPES, GOLD_TYPES, GOLD_COLORS, DIAMOND_TYPES, DIAMOND_ORIGINS, DIAMOND_CERTIFICATES } from '@/lib/constants'
import type { Order, Customer, Supplier } from '@/lib/types'
import { cn } from '@/lib/utils'

interface OrderFormProps {
  open: boolean
  onClose: () => void
  order?: Order
  customers: Customer[]
  suppliers: Supplier[]
  onSave: (data: Partial<Order>) => void
}

const makeDefaults = (): Partial<Order> => ({
  order_number: generateOrderNumber(),
  order_status: 'מחכה למקדמה',
  payment_status: 'לא שולם',
  sale_price: 0,
  deposit_amount: 0,
  total_cost: 0,
})

export function OrderForm({ open, onClose, order, customers, suppliers, onSave }: OrderFormProps) {
  const [form, setForm] = useState<Partial<Order>>(order || makeDefaults())
  const isDirtyRef = useRef(false)
  const [confirmClose, setConfirmClose] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(order || makeDefaults())
      isDirtyRef.current = false
      setConfirmClose(false)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const { balance_due, net_profit, profit_margin } = calculateOrderFinancials(form)

  const set = (key: keyof Order, value: string | number) => {
    setForm(f => ({ ...f, [key]: value }))
    isDirtyRef.current = true
  }

  const handleSave = () => {
    const calcs = calculateOrderFinancials(form)
    onSave({ ...form, ...calcs })
    onClose()
  }

  const handleClose = () => {
    if (isDirtyRef.current) {
      setConfirmClose(true)
    } else {
      onClose()
    }
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} className="max-w-3xl mx-4">
        <DialogHeader title={order ? 'עריכת הזמנה' : 'הזמנה חדשה'} onClose={handleClose} />
        <DialogBody className="space-y-5">
          <FormSection title="פרטי הזמנה">
            <FormGrid cols={3}>
              <FormField label="מספר הזמנה" htmlFor="order_number">
                <Input id="order_number" value={form.order_number || ''} readOnly className="bg-[#faf8f5]" />
              </FormField>
              <FormField label="לקוח" htmlFor="customer_id">
                <Select id="customer_id" value={form.customer_id || ''} onChange={e => set('customer_id', e.target.value)}>
                  <option value="">בחר לקוח</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </Select>
              </FormField>
              <FormField label="ספק" htmlFor="supplier_id">
                <Select id="supplier_id" value={form.supplier_id || ''} onChange={e => set('supplier_id', e.target.value)}>
                  <option value="">בחר ספק</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </FormField>
            </FormGrid>
            <FormField label="תיאור" htmlFor="description">
              <Input id="description" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="תיאור ההזמנה" />
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
              <FormField label="חיתוך (Cut)" htmlFor="diamond_type">
                <Select id="diamond_type" value={form.diamond_type || ''} onChange={e => set('diamond_type', e.target.value)}>
                  <option value="">בחר</option>
                  {DIAMOND_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </FormField>
              <FormField label="מקור יהלום" htmlFor="diamond_origin">
                <Select id="diamond_origin" value={form.diamond_origin || ''} onChange={e => set('diamond_origin', e.target.value)}>
                  <option value="">בחר</option>
                  {DIAMOND_ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                </Select>
              </FormField>
              <FormField label="תעודה" htmlFor="diamond_certificate">
                <Select id="diamond_certificate" value={form.diamond_certificate || ''} onChange={e => set('diamond_certificate', e.target.value)}>
                  <option value="">בחר</option>
                  {DIAMOND_CERTIFICATES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormField>
              <FormField label="מידה" htmlFor="size">
                <Input id="size" value={form.size || ''} onChange={e => set('size', e.target.value)} placeholder="6.5" />
              </FormField>
              <FormField label="חריטה" htmlFor="engraving">
                <Input id="engraving" value={form.engraving || ''} onChange={e => set('engraving', e.target.value)} placeholder="טקסט לחריטה" />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="סטטוס">
            <FormGrid cols={3}>
              <FormField label="סטטוס הזמנה" htmlFor="order_status">
                <Select id="order_status" value={form.order_status || 'מחכה למקדמה'} onChange={e => set('order_status', e.target.value)}>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>
              <FormField label="שלב ייצור" htmlFor="production_status">
                <Select id="production_status" value={form.production_status || ''} onChange={e => set('production_status', e.target.value)}>
                  <option value="">בחר שלב</option>
                  {PRODUCTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>
              <FormField label="סטטוס תשלום" htmlFor="payment_status">
                <Select id="payment_status" value={form.payment_status || 'לא שולם'} onChange={e => set('payment_status', e.target.value)}>
                  {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>
              <FormField label="תאריך מסירה" htmlFor="delivery_date">
                <Input id="delivery_date" type="date" value={form.delivery_date || ''} onChange={e => set('delivery_date', e.target.value)} />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="פיננסי">
            <FormGrid cols={3}>
              <FormField label="מחיר מכירה (₪)" htmlFor="sale_price">
                <Input id="sale_price" type="number" value={form.sale_price || ''} onChange={e => set('sale_price', Number(e.target.value))} placeholder="0" />
              </FormField>
              <FormField label="מקדמה (₪)" htmlFor="deposit_amount">
                <Input id="deposit_amount" type="number" value={form.deposit_amount || ''} onChange={e => set('deposit_amount', Number(e.target.value))} placeholder="0" />
              </FormField>
              <FormField label="עלות כוללת (₪)" htmlFor="total_cost">
                <Input id="total_cost" type="number" value={form.total_cost || ''} onChange={e => set('total_cost', Number(e.target.value))} placeholder="0" />
              </FormField>
            </FormGrid>

            <div className="p-4 bg-[#faf8f5] rounded-xl border border-[#e5ddd0]">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[#7a6a52] text-xs mb-0.5">יתרה לגביה</p>
                  <p className="font-bold text-[#2c1810]">{formatCurrency(balance_due)}</p>
                </div>
                <div>
                  <p className="text-[#7a6a52] text-xs mb-0.5">רווח נקי</p>
                  <p className={cn('font-bold', getProfitColor(profit_margin))}>{formatCurrency(net_profit)}</p>
                </div>
                <div>
                  <p className="text-[#7a6a52] text-xs mb-0.5">מרווח</p>
                  <p className={cn('font-bold', getProfitColor(profit_margin))}>{profit_margin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </FormSection>

          <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="הערות..." rows={2} />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>ביטול</Button>
          <Button onClick={handleSave}>{order ? 'שמור שינויים' : 'צור הזמנה'}</Button>
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
