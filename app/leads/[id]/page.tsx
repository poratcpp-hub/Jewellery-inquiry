'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Shell } from '@/components/layout/shell'
import { Button } from '@/components/ui/button'
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, generateQuoteNumber } from '@/lib/utils'
import { getLead, upsertQuote, upsertLead } from '@/lib/data'
import { getMissingDetails, generateMissingDetailsMessage, getNextAction } from '@/lib/workflow'
import type { Lead } from '@/lib/types'
import { ArrowRight, Copy, FileText, Phone, AtSign, AlertTriangle, CheckCircle, Clock, MessageSquare } from 'lucide-react'

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingQuote, setCreatingQuote] = useState(false)

  useEffect(() => {
    getLead(id)
      .then(setLead)
      .catch(() => toast({ type: 'error', title: 'שגיאה בטעינת הליד' }))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const missingDetails = lead ? getMissingDetails(lead) : []
  const nextAction = lead ? getNextAction(lead) : null

  const handleCopyMessage = useCallback(() => {
    if (!lead) return
    const msg = generateMissingDetailsMessage(lead)
    if (!msg) { toast({ type: 'info', title: 'אין פרטים חסרים' }); return }
    navigator.clipboard.writeText(msg).then(() => {
      toast({ type: 'success', title: 'הודעה הועתקה', description: 'ניתן להדביק בוואטסאפ' })
    })
  }, [lead, toast])

  const handleCreateQuote = useCallback(async () => {
    if (!lead) return
    setCreatingQuote(true)
    try {
      const quote = await upsertQuote({
        quote_number: generateQuoteNumber(),
        customer_id: lead.customer_id,
        lead_id: lead.id,
        jewelry_type: lead.jewelry_type,
        description: lead.original_message,
        diamond_type: lead.diamond_type,
        gold_type: lead.gold_type,
        gold_color: lead.gold_color,
        carat: lead.carat,
        quote_status: 'טיוטה',
        diamond_cost: 0, gold_cost: 0, labor_cost: 0,
        setting_cost: 0, packaging_cost: 0, shipping_cost: 0, other_cost: 0,
        total_cost: 0, sale_price: 0, expected_profit: 0, profit_margin: 0,
      })
      const updated = await upsertLead({ ...lead, lead_status: 'בטיפול' })
      setLead(updated)
      toast({
        type: 'success',
        title: `הצעת מחיר ${quote.quote_number} נפתחה`,
        description: 'נוסף לעמוד הצעות המחיר — השלם מחירים ושלח ללקוח',
      })
    } catch (err) {
      console.error(err)
      toast({ type: 'error', title: 'שגיאה ביצירת הצעת מחיר' })
    } finally {
      setCreatingQuote(false)
    }
  }, [lead, toast])

  if (loading) return (
    <Shell title="ליד">
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#e5ddd0] rounded-xl" />)}
      </div>
    </Shell>
  )

  if (!lead) return (
    <Shell title="ליד">
      <div className="max-w-3xl mx-auto text-center py-20 text-[#7a6a52]">ליד לא נמצא</div>
    </Shell>
  )

  const customer = lead.customers
  const actionColors = {
    reply: 'bg-red-50 border-red-200',
    fill_details: 'bg-amber-50 border-amber-200',
    create_quote: 'bg-emerald-50 border-emerald-200',
    follow_up: 'bg-blue-50 border-blue-200',
    done: 'bg-gray-50 border-gray-200',
  }
  const actionIcons = {
    reply: MessageSquare,
    fill_details: AlertTriangle,
    create_quote: FileText,
    follow_up: Clock,
    done: CheckCircle,
  }
  const ActionIcon = nextAction ? actionIcons[nextAction.action] : CheckCircle

  return (
    <Shell title="פרטי ליד">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Back + header */}
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="ghost" size="icon"><ArrowRight size={18} /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#2c1810]">{lead.full_name || '—'}</h1>
            <p className="text-sm text-[#7a6a52]">{formatDate(lead.created_at)} · {lead.source || ''}</p>
          </div>
          <div className="mr-auto flex gap-2">
            <Badge variant={getStatusBadgeVariant(lead.lead_status)}>{lead.lead_status}</Badge>
            <Badge variant={getStatusBadgeVariant(lead.priority)}>{lead.priority}</Badge>
          </div>
        </div>

        {/* Next action card */}
        {nextAction && nextAction.action !== 'done' && (
          <div className={`rounded-xl border p-4 ${actionColors[nextAction.action]}`}>
            <div className="flex items-start gap-3">
              <ActionIcon size={20} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-[#2c1810]">{nextAction.title}</p>
                <p className="text-sm text-[#4a3728] mt-0.5">{nextAction.description}</p>
              </div>
              <div className="flex gap-2">
                {nextAction.action === 'fill_details' && (
                  <Button size="sm" variant="outline" onClick={handleCopyMessage}>
                    <Copy size={14} />העתק הודעת השלמה
                  </Button>
                )}
                {nextAction.action === 'create_quote' && (
                  <Button size="sm" onClick={handleCreateQuote} disabled={creatingQuote}>
                    <FileText size={14} />{creatingQuote ? 'יוצר...' : 'צור הצעת מחיר'}
                  </Button>
                )}
                {nextAction.action === 'reply' && (
                  <Button size="sm" variant="outline" onClick={handleCopyMessage}>
                    <Copy size={14} />העתק הודעה
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer card */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">פרטי לקוח</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-[#7a6a52] mb-0.5">שם</p>
              <p className="font-medium">{customer?.full_name || lead.full_name || '—'}</p>
            </div>
            {(lead.phone || customer?.phone) && (
              <div>
                <p className="text-xs text-[#7a6a52] mb-0.5">טלפון</p>
                <a href={`tel:${lead.phone || customer?.phone}`} className="flex items-center gap-1 text-[#b8934a] hover:underline">
                  <Phone size={12} />{lead.phone || customer?.phone}
                </a>
              </div>
            )}
            {customer?.instagram && (
              <div>
                <p className="text-xs text-[#7a6a52] mb-0.5">אינסטגרם</p>
                <span className="flex items-center gap-1"><AtSign size={12} />{customer.instagram}</span>
              </div>
            )}
            {customer?.email && (
              <div>
                <p className="text-xs text-[#7a6a52] mb-0.5">דוא&quot;ל</p>
                <p>{customer.email}</p>
              </div>
            )}
            {customer?.customer_status && (
              <div>
                <p className="text-xs text-[#7a6a52] mb-0.5">סטטוס לקוח</p>
                <Badge variant={getStatusBadgeVariant(customer.customer_status)} className="text-xs">{customer.customer_status}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Original message */}
        {lead.original_message && (
          <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
            <h2 className="font-semibold text-[#2c1810] mb-2 text-sm">הודעת הפנייה המקורית</h2>
            <p className="text-sm text-[#4a3728] whitespace-pre-wrap leading-relaxed bg-[#faf8f5] rounded-lg p-3">{lead.original_message}</p>
          </div>
        )}

        {/* Jewelry details */}
        <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
          <h2 className="font-semibold text-[#2c1810] mb-3 text-sm">פרטי תכשיט</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'סוג תכשיט', value: lead.jewelry_type },
              { label: 'סוג יהלום', value: lead.diamond_type },
              { label: 'קראט', value: lead.carat },
              { label: 'סוג זהב', value: lead.gold_type },
              { label: 'צבע זהב', value: lead.gold_color },
              { label: 'סגנון רצוי', value: lead.desired_style },
              { label: 'מידה', value: lead.ring_size },
              { label: 'תקציב', value: lead.budget ? formatCurrency(lead.budget) : undefined },
            ].map(({ label, value }) => value ? (
              <div key={label}>
                <p className="text-xs text-[#7a6a52] mb-0.5">{label}</p>
                <p className="font-medium">{String(value)}</p>
              </div>
            ) : null)}
          </div>
          {!lead.jewelry_type && !lead.carat && !lead.budget && (
            <p className="text-sm text-[#7a6a52] text-center py-4">לא הוזנו פרטי תכשיט</p>
          )}
        </div>

        {/* Missing details */}
        {missingDetails.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-amber-800 mb-1 text-sm flex items-center gap-1.5">
                  <AlertTriangle size={15} />חסרים פרטים ({missingDetails.length})
                </h2>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {missingDetails.map(m => (
                    <span key={m.field} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs border border-amber-200">{m.label}</span>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleCopyMessage} className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100">
                <Copy size={13} />העתק הודעה
              </Button>
            </div>
          </div>
        )}

        {/* Notes */}
        {lead.notes && (
          <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
            <h2 className="font-semibold text-[#2c1810] mb-2 text-sm">הערות</h2>
            <p className="text-sm text-[#4a3728] whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex gap-2 justify-end pb-4">
          <Button variant="outline" onClick={handleCopyMessage}><Copy size={15} />העתק הודעת השלמה</Button>
          <Button onClick={handleCreateQuote} disabled={creatingQuote || missingDetails.length > 0}>
            <FileText size={15} />{creatingQuote ? 'יוצר...' : 'צור הצעת מחיר מהליד'}
          </Button>
        </div>
      </div>
    </Shell>
  )
}
