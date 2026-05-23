'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Shell } from '@/components/layout/shell'
import { Button } from '@/components/ui/button'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { QuoteForm } from '@/components/quotes/quote-form'
import { formatCurrency, formatDate, generateOrderNumber, getProfitColor } from '@/lib/utils'
import { getQuote, upsertQuote, upsertOrder, getCustomers, findCustomerByContact, upsertCustomer, upsertLead, refreshCustomerStats, patchQuote } from '@/lib/data'
import { getDealQuality, generateQuoteMessage } from '@/lib/workflow'
import { QUOTE_STATUSES } from '@/lib/constants'
import type { Quote, Customer } from '@/lib/types'
import { ArrowRight, Copy, Pencil, ShoppingBag, Send, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const COST_ROWS = [
  { key: 'diamond_cost', label: 'עלות יהלום' },
  { key: 'gold_cost', label: 'עלות זהב' },
  { key: 'labor_cost', label: 'עלות עבודה' },
  { key: 'setting_cost', label: 'עלות שיבוץ' },
  { key: 'packaging_cost', label: 'אריזה' },
  { key: 'shipping_cost', label: 'משלוח' },
  { key: 'other_cost', label: 'אחר' },
] as const

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    Promise.all([getQuote(id), getCustomers()])
      .then(([q, c]) => { setQuote(q); setCustomers(c) })
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת הצעת המחיר' }))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyMessage = useCallback(() => {
    if (!quote) return
    const msg = generateQuoteMessage(quote, quote.customers?.full_name)
    navigator.clipboard.writeText(msg).then(() => {
      toast({ type: 'success', title: 'הצעת המחיר הועתקה', description: 'ניתן להדביק בוואטסאפ' })
    })
  }, [quote, toast])

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!quote) return
    try {
      await patchQuote(quote.id, { quote_status: newStatus })
      setQuote(q => q ? { ...q, quote_status: newStatus } : q)
      toast({ type: 'success', title: 'סטטוס עודכן' })
    } catch {
      toast({ type: 'error', title: 'שגיאה בעדכון סטטוס' })
    }
  }, [quote, toast])

  const handleConvertToOrder = useCallback(async () => {
    if (!quote) return
    setConverting(true)
    try {
      const lead = quote.leads

      // Find or create customer
      let customer = quote.customers || null
      if (!customer) {
        customer = await findCustomerByContact(
          lead?.phone || undefined,
          lead?.instagram || undefined,
          lead?.email || undefined,
        )
      }
      if (!customer) {
        customer = await upsertCustomer({
          full_name: lead?.full_name || 'לקוח חדש',
          phone: lead?.phone || undefined,
          instagram: lead?.instagram || undefined,
          email: lead?.email || undefined,
          source: lead?.source || undefined,
          customer_status: 'לקוח חדש',
        })
        toast({ type: 'success', title: 'לקוח חדש נוצר', description: `"${customer.full_name}" נוסף לרשימת הלקוחות` })
      }

      // Create order
      const order = await upsertOrder({
        order_number: generateOrderNumber(),
        customer_id: customer.id,
        quote_id: quote.id,
        lead_id: lead?.id || undefined,
        jewelry_type: quote.jewelry_type,
        description: quote.description,
        diamond_type: quote.diamond_type,
        diamond_origin: quote.diamond_origin,
        diamond_certificate: quote.diamond_certificate,
        gold_type: quote.gold_type,
        gold_color: quote.gold_color,
        carat: quote.carat,
        order_status: 'מחכה למקדמה',
        payment_status: 'לא שולם',
        sale_price: quote.sale_price,
        deposit_amount: 0,
        balance_due: quote.sale_price,
        total_cost: quote.total_cost,
        net_profit: quote.expected_profit,
        profit_margin: quote.profit_margin,
      })

      // Update quote and lead atomically
      await Promise.all([
        upsertQuote({ ...quote, quote_status: 'אושרה', order_id: order.id, customer_id: customer.id }),
        lead?.id ? upsertLead({
          ...lead,
          lead_status: 'נסגר להזמנה',
          order_id: order.id,
          customer_id: customer.id,
        }) : Promise.resolve(),
      ])

      await refreshCustomerStats(customer.id)

      setQuote(q => q ? { ...q, quote_status: 'אושרה', order_id: order.id, customer_id: customer!.id, customers: customer! } : q)
      toast({
        type: 'success',
        title: 'הזמנה נוצרה!',
        description: `הזמנה ${order.order_number} נפתחה ומחכה למקדמה`,
      })
    } catch (err) {
      console.error(err)
      toast({ type: 'error', title: 'שגיאה ביצירת הזמנה' })
    } finally {
      setConverting(false)
    }
  }, [quote, toast])

  const handleSaveEdit = useCallback(async (data: Partial<Quote>) => {
    if (!quote) return
    try {
      const updated = await upsertQuote({ ...quote, ...data })
      setQuote({ ...updated, customers: quote.customers })
      toast({ type: 'success', title: 'הצעת המחיר עודכנה' })
    } catch {
      toast({ type: 'error', title: 'שגיאה בשמירה' })
    }
  }, [quote, toast])

  if (loading) return (
    <Shell title="הצעת מחיר">
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#e5ddd0] rounded-xl" />)}
      </div>
    </Shell>
  )

  if (!quote) return (
    <Shell title="הצעת מחיר">
      <div className="max-w-3xl mx-auto text-center py-20 text-[#7a6a52]">הצעת המחיר לא נמצאה</div>
    </Shell>
  )

  const { label: dealLabel, color: dealColor } = getDealQuality(quote.profit_margin ?? 0)
  const isClosed = ['אושרה', 'נדחתה', 'פג תוקף'].includes(quote.quote_status)

  return (
    <Shell title="הצעת מחיר">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/quotes">
            <Button variant="ghost" size="icon"><ArrowRight size={18} /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#2c1810] font-mono">{quote.quote_number}</h1>
            <p className="text-sm text-[#7a6a52]">{formatDate(quote.created_at)}</p>
          </div>
          <div className="mr-auto flex items-center gap-2 flex-wrap">
            <Select
              className="text-sm h-8 w-36"
              value={quote.quote_status}
              onChange={e => handleStatusChange(e.target.value)}
            >
              {QUOTE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil size={14} />עריכה
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyMessage}>
              <Send size={14} />שלח ללקוח
            </Button>
            {!isClosed && (
              <Button size="sm" onClick={handleConvertToOrder} disabled={converting}>
                <ShoppingBag size={14} />{converting ? 'יוצר...' : 'המר להזמנה'}
              </Button>
            )}
          </div>
        </div>

        {/* Linked order banner */}
        {quote.order_id && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-800">הצעה זו הומרה להזמנה</span>
            <Link href={`/orders/${quote.order_id}`}>
              <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                <ExternalLink size={13} />פתח הזמנה
              </Button>
            </Link>
          </div>
        )}

        {/* Customer card */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">לקוח</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#2c1810]">{quote.customers?.full_name || quote.leads?.full_name || '—'}</p>
              {(quote.customers?.phone || quote.leads?.phone) && (
                <p className="text-sm text-[#7a6a52]">{quote.customers?.phone || quote.leads?.phone}</p>
              )}
            </div>
            {quote.customers?.id && (
              <Link href={`/customers/${quote.customers.id}`}>
                <Button variant="ghost" size="sm"><ExternalLink size={14} />פרופיל לקוח</Button>
              </Link>
            )}
            {!quote.customers?.id && quote.leads?.id && (
              <Link href={`/leads/${quote.leads.id}`}>
                <Button variant="ghost" size="sm"><ExternalLink size={14} />פרטי ליד</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Jewelry details */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">פרטי תכשיט</h2>
          {quote.description && (
            <p className="text-sm text-[#4a3728] mb-3 bg-[#faf8f5] rounded-lg p-2">{quote.description}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'סוג תכשיט', value: quote.jewelry_type },
              { label: 'סוג זהב', value: quote.gold_type },
              { label: 'צבע זהב', value: quote.gold_color },
              { label: 'תוקף עד', value: quote.valid_until ? formatDate(quote.valid_until) : null },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-[#7a6a52] mb-0.5">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Diamond details */}
        {(quote.diamond_type || quote.carat) && (
          <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
            <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">פרטי יהלום</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                { label: 'חיתוך', value: quote.diamond_type },
                { label: 'קראט', value: quote.carat ? `${quote.carat} ct` : null },
                { label: 'מקור', value: quote.diamond_origin },
                { label: 'צבע', value: quote.diamond_color },
                { label: 'ניקיון', value: quote.diamond_clarity },
                { label: 'ליטוש', value: quote.diamond_cut },
                { label: 'תעודה', value: quote.diamond_certificate },
              ].filter(r => r.value).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-[#7a6a52] mb-0.5">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost breakdown */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">עלויות ורווח</h2>
          <div className="space-y-1.5 mb-4">
            {COST_ROWS.filter(r => (quote[r.key] || 0) > 0).map(({ key, label }) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-[#7a6a52]">{label}</span>
                <span className="font-medium">{formatCurrency(quote[key])}</span>
              </div>
            ))}
            <div className="border-t border-[#e5ddd0] pt-1.5 flex justify-between text-sm font-semibold">
              <span>סה&quot;כ עלות</span>
              <span>{formatCurrency(quote.total_cost)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-[#b8934a]">
              <span>מחיר מכירה</span>
              <span>{formatCurrency(quote.sale_price)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 p-3 bg-[#faf8f5] rounded-xl border border-[#e5ddd0]">
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">רווח צפוי</p>
              <p className={cn('font-bold text-sm', getProfitColor(quote.profit_margin))}>
                {formatCurrency(quote.expected_profit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">מרווח</p>
              <p className={cn('font-bold text-sm', getProfitColor(quote.profit_margin))}>
                {(quote.profit_margin ?? 0).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">איכות</p>
              <p className={cn('font-bold text-sm', dealColor)}>{dealLabel}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
            <h2 className="font-semibold text-[#2c1810] mb-2 text-sm">הערות</h2>
            <p className="text-sm text-[#4a3728] whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex gap-2 justify-end pb-4">
          <Button variant="outline" onClick={handleCopyMessage}>
            <Copy size={15} />העתק הצעה לשליחה
          </Button>
          {!isClosed && (
            <Button onClick={handleConvertToOrder} disabled={converting}>
              <ShoppingBag size={15} />{converting ? 'יוצר הזמנה...' : 'המר להזמנה'}
            </Button>
          )}
        </div>
      </div>

      <QuoteForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        quote={quote}
        customers={customers}
        onSave={handleSaveEdit}
      />
    </Shell>
  )
}
