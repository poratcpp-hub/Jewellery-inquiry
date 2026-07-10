/**
 * Data access layer — all reads/writes go through here.
 * NEXT_PUBLIC_DEMO_MODE=true → all reads return in-memory demo data.
 */
import { supabase } from './supabase'
import {
  demoCustomers, demoLeads, demoQuotes, demoOrders,
  demoPayments, demoExpenses, demoSuppliers,
} from './demo-data'
import type {
  Customer, Lead, Quote, Order, Payment, Expense, Supplier,
} from './types'
import { normalizeIsraeliPhone } from './validation'
import { calculateOrderFinancials, generateOrderNumber } from './utils'

const IS_DEMO =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

// ─── Error logging ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logSupabaseError(context: string, error: any) {
  console.error(`[Supabase] ❌ ${context}`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
    name: error?.name,
    raw: error,
  })
}

// ─── Database health check ────────────────────────────────────────────────────

export async function checkDatabaseConnection(): Promise<{
  ok: boolean
  error?: string
  isHostError?: boolean
}> {
  if (IS_DEMO) return { ok: true }

  // Gate: customers must work first
  const { error: custErr } = await supabase.from('customers').select('id').limit(1)
  if (custErr) {
    logSupabaseError('customers health check', custErr)
    return {
      ok: false,
      error: custErr.message,
      isHostError: custErr.message?.includes('Host not in allowlist'),
    }
  }
  // Probe all other tables in parallel — failures are logged but non-fatal
  const probeTargets = ['leads', 'quotes', 'orders', 'payments', 'expenses', 'suppliers'] as const
  await Promise.allSettled(
    probeTargets.map(async t => {
      const { error } = await supabase.from(t).select('id').limit(1)
      if (error) logSupabaseError(`${t} health check`, error)
    })
  )

  return { ok: true }
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  if (IS_DEMO) return demoCustomers.map(c => ({ ...c, created_at: '', updated_at: '' }))
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { logSupabaseError('getCustomers', error); throw error }
  return data as Customer[]
}

export async function upsertCustomer(customer: Partial<Customer>): Promise<Customer> {
  if (IS_DEMO) return { ...customer, id: customer.id || crypto.randomUUID(), created_at: '', updated_at: '' } as Customer
  const { orders: _o, converted_leads: _l, ...rest } = customer as Customer & { orders?: unknown; converted_leads?: unknown }
  const payload: Record<string, unknown> = {
    full_name: rest.full_name,
    phone: rest.phone || null,
    instagram: rest.instagram || null,
    email: rest.email || null,
    city: rest.city || null,
    source: rest.source || null,
    customer_status: rest.customer_status || 'לקוח חדש',
    notes: rest.notes || null,
  }
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
  if (rest.id) payload.id = rest.id
  if (rest.orders_count !== undefined) payload.orders_count = rest.orders_count
  if (rest.total_revenue !== undefined) payload.total_revenue = rest.total_revenue
  if (rest.total_profit !== undefined) payload.total_profit = rest.total_profit
  if (rest.average_order_value !== undefined) payload.average_order_value = rest.average_order_value
  if (rest.first_order_date !== undefined) payload.first_order_date = rest.first_order_date || null
  if (rest.last_order_date !== undefined) payload.last_order_date = rest.last_order_date || null
  const { data, error } = await supabase.from('customers').upsert(payload).select().single()
  if (error) { logSupabaseError('upsertCustomer', error); throw error }
  return data as Customer
}

export async function deleteCustomer(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) { logSupabaseError('deleteCustomer', error); throw error }
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function getLeads(): Promise<Lead[]> {
  if (IS_DEMO) return demoLeads.map(l => ({ ...l, created_at: '', updated_at: '' }))
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { logSupabaseError('getLeads', error); throw error }
  return data as Lead[]
}

export async function upsertLead(lead: Partial<Lead>): Promise<Lead> {
  if (IS_DEMO) return { ...lead, id: lead.id || crypto.randomUUID(), lead_status: lead.lead_status || 'חדש', priority: lead.priority || 'בינוני', created_at: '', updated_at: '' } as Lead
  const { customers: _c, quotes: _q, orders: _o, ...rest } = lead as Lead & { customers?: unknown; quotes?: unknown; orders?: unknown }
  const payload: Record<string, unknown> = {
    customer_id: rest.customer_id || null,
    full_name: rest.full_name,
    phone: rest.phone,
    instagram: rest.instagram,
    email: rest.email,
    source: rest.source,
    jewelry_type: rest.jewelry_type,
    diamond_type: rest.diamond_type,
    gold_type: rest.gold_type,
    gold_color: rest.gold_color,
    carat: rest.carat !== undefined ? rest.carat : undefined,
    ring_size: rest.ring_size,
    desired_style: rest.desired_style,
    original_message: rest.original_message,
    budget: rest.budget !== undefined ? rest.budget : undefined,
    lead_status: rest.lead_status,
    priority: rest.priority,
    follow_up_date: rest.follow_up_date,
    notes: rest.notes,
  }
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
  if (rest.id) payload.id = rest.id
  if (rest.quote_id !== undefined) payload.quote_id = rest.quote_id || null
  if (rest.order_id !== undefined) payload.order_id = rest.order_id || null
  const { data, error } = await supabase.from('leads').upsert(payload).select().single()
  if (error) { logSupabaseError('upsertLead', error); throw error }
  return data as Lead
}

export async function deleteLead(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) { logSupabaseError('deleteLead', error); throw error }
}

export async function getLead(id: string): Promise<Lead> {
  if (IS_DEMO) {
    const lead = demoLeads.find(l => l.id === id)
    if (!lead) throw new Error('Not found')
    const customer = demoCustomers.find(c => c.id === lead.customer_id)
    const linkedQuote = lead.quote_id ? demoQuotes.find(q => q.id === lead.quote_id) : undefined
    return {
      ...lead, created_at: '', updated_at: '',
      customers: customer ? { ...customer, created_at: '', updated_at: '' } : undefined,
      quotes: linkedQuote ? { ...linkedQuote, created_at: '', updated_at: '' } : undefined,
    } as Lead
  }
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
  if (error) { logSupabaseError('getLead', error); throw error }
  const lead = data as Lead
  const [customerResult, quoteResult] = await Promise.all([
    lead.customer_id
      ? supabase.from('customers').select('*').eq('id', lead.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    lead.quote_id
      ? supabase.from('quotes').select('*').eq('id', lead.quote_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  return {
    ...lead,
    customers: customerResult.data as Customer ?? undefined,
    quotes: quoteResult.data as Quote ?? undefined,
  }
}

// ─── Lead → Customer automation ──────────────────────────────────────────────

export async function findOrCreateCustomerFromLead(
  lead: Partial<Lead>,
): Promise<{ customer: Customer; created: boolean }> {
  const rawPhone = lead.phone || ''
  const normalizedPhone = rawPhone ? normalizeIsraeliPhone(rawPhone) : ''
  const email = lead.email?.trim() || ''

  if (IS_DEMO) {
    const found = demoCustomers.find(c =>
      (normalizedPhone && c.phone && normalizeIsraeliPhone(c.phone) === normalizedPhone) ||
      (email && c.email === email),
    )
    if (found) return { customer: { ...found, created_at: '', updated_at: '' }, created: false }
    const newC: Customer = {
      id: crypto.randomUUID(),
      full_name: lead.full_name || 'לקוח חדש',
      phone: normalizedPhone || undefined,
      instagram: lead.instagram,
      email: lead.email,
      source: lead.source,
      notes: lead.notes,
      customer_status: 'לקוח פוטנציאלי',
      created_at: '',
      updated_at: '',
    }
    return { customer: newC, created: true }
  }

  // Search by normalized phone first
  if (normalizedPhone) {
    const { data } = await supabase.from('customers').select('*').eq('phone', normalizedPhone).maybeSingle()
    if (data) return { customer: data as Customer, created: false }
  }

  // Fallback search by email
  if (email) {
    const { data } = await supabase.from('customers').select('*').eq('email', email).maybeSingle()
    if (data) return { customer: data as Customer, created: false }
  }

  // Create new customer
  const customer = await upsertCustomer({
    full_name: lead.full_name || 'לקוח חדש',
    phone: normalizedPhone || undefined,
    instagram: lead.instagram,
    email: lead.email || undefined,
    source: lead.source,
    notes: lead.notes,
    customer_status: 'לקוח פוטנציאלי',
  })

  return { customer, created: true }
}

// ─── Order creation from lead/quote ──────────────────────────────────────────

export async function createOrderFromLeadOrQuote({
  leadId,
  quoteId,
}: {
  leadId?: string
  quoteId?: string
}): Promise<{ order: Order; alreadyExisted: boolean }> {
  let lead: Lead | null = null
  let quote: Quote | null = null

  if (leadId) {
    lead = await getLead(leadId)

    // Check if order already linked on the lead
    if (lead.order_id) {
      try {
        const existingOrder = await getOrder(lead.order_id)
        return { order: existingOrder, alreadyExisted: true }
      } catch { /* order may have been deleted */ }
    }

    // Check orders table directly for this lead_id
    if (!IS_DEMO) {
      const { data: existOrders } = await supabase
        .from('orders').select('*').eq('lead_id', leadId).limit(1)
      if (existOrders?.length) {
        const existingOrder = existOrders[0] as Order
        await upsertLead({ id: leadId, order_id: existingOrder.id })
        return { order: existingOrder, alreadyExisted: true }
      }
    }
  }

  // Resolve quote (prefer explicit quoteId, fallback to lead.quote_id)
  const resolvedQuoteId = quoteId || lead?.quote_id || undefined
  if (resolvedQuoteId) {
    try { quote = await getQuote(resolvedQuoteId) } catch { /* no quote */ }
  }

  // Idempotency on the quote side: an order may already exist for this quote
  if (quote?.order_id) {
    try {
      const existingOrder = await getOrder(quote.order_id)
      return { order: existingOrder, alreadyExisted: true }
    } catch { /* order may have been deleted */ }
  }

  // Pull in the quote's lead so contact details and back-links work when
  // converting straight from a quote
  if (!lead && quote?.lead_id) {
    try { lead = await getLead(quote.lead_id) } catch { /* no lead */ }
  }

  // Determine customer
  let customerId = lead?.customer_id || quote?.customer_id || undefined
  if (!customerId && lead) {
    const { customer } = await findOrCreateCustomerFromLead(lead)
    customerId = customer.id
  }
  if (!customerId) throw new Error('Cannot create order without customer')

  // Build financials from quote if available
  const salePrice = quote?.sale_price || 0
  const totalCost = quote?.total_cost || 0
  const calcs = calculateOrderFinancials({ sale_price: salePrice, deposit_amount: 0, total_cost: totalCost })

  const order = await upsertOrder({
    order_number: generateOrderNumber(),
    customer_id: customerId,
    lead_id: lead?.id || undefined,
    quote_id: quote?.id || undefined,
    jewelry_type: quote?.jewelry_type || lead?.jewelry_type || undefined,
    description: quote?.description || lead?.original_message || undefined,
    diamond_type: quote?.diamond_type || lead?.diamond_type || undefined,
    gold_type: quote?.gold_type || lead?.gold_type || undefined,
    gold_color: quote?.gold_color || lead?.gold_color || undefined,
    carat: quote?.carat || lead?.carat || undefined,
    size: lead?.ring_size || undefined,
    notes: lead?.notes || undefined,
    order_status: 'מחכה למקדמה',
    payment_status: 'לא שולם',
    sale_price: salePrice,
    deposit_amount: 0,
    total_cost: totalCost,
    ...calcs,
  })

  // Link order back to lead
  if (lead) {
    await upsertLead({
      id: lead.id,
      order_id: order.id,
      customer_id: customerId,
      lead_status: 'נסגר להזמנה',
    })
  }

  // Update quote: link order, mark approved
  if (quote && !IS_DEMO) {
    await upsertQuote({
      id: quote.id,
      order_id: order.id,
      customer_id: customerId,
      quote_status: 'אושרה',
    })
  }

  // Refresh customer stats (fire-and-forget)
  refreshCustomerStats(customerId).catch(() => {})

  return { order, alreadyExisted: false }
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

export async function getQuotes(): Promise<Quote[]> {
  if (IS_DEMO) return demoQuotes.map(q => ({ ...q, created_at: '', updated_at: '' }))
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { logSupabaseError('getQuotes', error); throw error }
  return data as Quote[]
}

export async function upsertQuote(quote: Partial<Quote>): Promise<Quote> {
  if (IS_DEMO) return {
    ...quote,
    id: quote.id || crypto.randomUUID(),
    quote_status: quote.quote_status || 'טיוטה',
    diamond_cost: quote.diamond_cost ?? 0, gold_cost: quote.gold_cost ?? 0,
    labor_cost: quote.labor_cost ?? 0, setting_cost: quote.setting_cost ?? 0,
    packaging_cost: quote.packaging_cost ?? 0, shipping_cost: quote.shipping_cost ?? 0,
    other_cost: quote.other_cost ?? 0, total_cost: quote.total_cost ?? 0,
    sale_price: quote.sale_price ?? 0, expected_profit: quote.expected_profit ?? 0,
    profit_margin: quote.profit_margin ?? 0, created_at: '', updated_at: '',
  } as Quote
  const { customers: _c, leads: _l, ...rest } = quote as Quote & { customers?: unknown; leads?: unknown }
  const isUpdate = !!rest.id
  const num = (v: number | undefined) => v === undefined ? undefined : Number(v)
  // Fields that are undefined are omitted from the payload, so a partial
  // update (e.g. status only) never overwrites values it didn't touch.
  // On insert the DB defaults cover the omitted numeric columns.
  const payload: Record<string, unknown> = {
    quote_number: rest.quote_number,
    customer_id: rest.customer_id !== undefined ? rest.customer_id || null : undefined,
    lead_id: rest.lead_id !== undefined ? rest.lead_id || null : undefined,
    jewelry_type: rest.jewelry_type !== undefined ? rest.jewelry_type || null : undefined,
    description: rest.description !== undefined ? rest.description || null : undefined,
    diamond_type: rest.diamond_type !== undefined ? rest.diamond_type || null : undefined,
    diamond_origin: rest.diamond_origin !== undefined ? rest.diamond_origin || null : undefined,
    diamond_certificate: rest.diamond_certificate !== undefined ? rest.diamond_certificate || null : undefined,
    gold_type: rest.gold_type !== undefined ? rest.gold_type || null : undefined,
    gold_color: rest.gold_color !== undefined ? rest.gold_color || null : undefined,
    carat: rest.carat,
    diamond_color: rest.diamond_color !== undefined ? rest.diamond_color || null : undefined,
    diamond_clarity: rest.diamond_clarity !== undefined ? rest.diamond_clarity || null : undefined,
    diamond_cut: rest.diamond_cut !== undefined ? rest.diamond_cut || null : undefined,
    diamond_cost: num(rest.diamond_cost),
    gold_cost: num(rest.gold_cost),
    labor_cost: num(rest.labor_cost),
    setting_cost: num(rest.setting_cost),
    packaging_cost: num(rest.packaging_cost),
    shipping_cost: num(rest.shipping_cost),
    other_cost: num(rest.other_cost),
    total_cost: num(rest.total_cost),
    sale_price: num(rest.sale_price),
    expected_profit: num(rest.expected_profit),
    profit_margin: num(rest.profit_margin),
    quote_status: rest.quote_status || (isUpdate ? undefined : 'טיוטה'),
    valid_until: rest.valid_until !== undefined ? rest.valid_until || null : undefined,
    estimated_delivery_time: rest.estimated_delivery_time !== undefined ? rest.estimated_delivery_time || null : undefined,
    notes: rest.notes !== undefined ? rest.notes || null : undefined,
  }
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
  if (rest.id) payload.id = rest.id
  if (rest.order_id !== undefined) payload.order_id = rest.order_id || null
  const { data, error } = await supabase.from('quotes').upsert(payload).select().single()
  if (error) { logSupabaseError('upsertQuote', error); throw error }
  return data as Quote
}

export async function deleteQuote(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) { logSupabaseError('deleteQuote', error); throw error }
}

// ─── Quote workflow automation ───────────────────────────────────────────────

/**
 * Marks sent quotes whose validity date has passed as expired ("פג תוקף"),
 * both in the DB and in the returned list. Run on quotes-page load so the
 * pipeline stays truthful without manual bookkeeping.
 */
export async function autoExpireQuotes(quotes: Quote[]): Promise<Quote[]> {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const expired = quotes.filter(q =>
    q.quote_status === 'נשלחה ללקוח' &&
    q.valid_until && new Date(q.valid_until) < today,
  )
  if (!expired.length) return quotes

  await Promise.allSettled(
    expired.map(q => upsertQuote({ id: q.id, quote_status: 'פג תוקף' })),
  )
  const expiredIds = new Set(expired.map(q => q.id))
  return quotes.map(q => expiredIds.has(q.id) ? { ...q, quote_status: 'פג תוקף' } : q)
}

/**
 * Changes a quote's status and runs the follow-up automation: when a quote is
 * sent to the customer, the linked lead (if still active) moves to
 * "נשלחה הצעת מחיר" with a follow-up reminder three days out.
 */
export async function changeQuoteStatus(quote: Quote, newStatus: string): Promise<Quote> {
  const updated = await upsertQuote({ id: quote.id, quote_number: quote.quote_number, quote_status: newStatus })

  if (newStatus === 'נשלחה ללקוח' && quote.lead_id) {
    try {
      const lead = await getLead(quote.lead_id)
      if (!['נסגר להזמנה', 'לא רלוונטי'].includes(lead.lead_status)) {
        const followUp = new Date()
        followUp.setDate(followUp.getDate() + 3)
        await upsertLead({
          id: lead.id,
          lead_status: 'נשלחה הצעת מחיר',
          follow_up_date: followUp.toISOString().split('T')[0],
        })
      }
    } catch { /* lead follow-up is best-effort */ }
  }

  return { ...quote, quote_status: updated.quote_status }
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  if (IS_DEMO) return demoOrders.map(o => ({ ...o, created_at: '', updated_at: '' }))
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { logSupabaseError('getOrders', error); throw error }
  return data as Order[]
}

export async function upsertOrder(order: Partial<Order>): Promise<Order> {
  if (IS_DEMO) return {
    ...order,
    id: order.id || crypto.randomUUID(),
    order_status: order.order_status || 'מחכה למקדמה',
    payment_status: order.payment_status || 'לא שולם',
    sale_price: order.sale_price ?? 0, deposit_amount: order.deposit_amount ?? 0,
    balance_due: order.balance_due ?? 0, total_cost: order.total_cost ?? 0,
    net_profit: order.net_profit ?? 0, profit_margin: order.profit_margin ?? 0,
    created_at: '', updated_at: '',
  } as Order
  const { customers: _c, suppliers: _s, quotes: _q, payments: _p, expenses: _e, ...rest } =
    order as Order & { customers?: unknown; suppliers?: unknown; quotes?: unknown; payments?: unknown; expenses?: unknown }
  const isUpdate = !!rest.id
  const num = (v: number | undefined) => v === undefined ? undefined : Number(v)
  // Undefined fields are omitted, so partial updates never overwrite
  // untouched columns; DB defaults cover omitted columns on insert.
  const payload: Record<string, unknown> = {
    order_number: rest.order_number,
    customer_id: rest.customer_id !== undefined ? rest.customer_id || null : undefined,
    supplier_id: rest.supplier_id !== undefined ? rest.supplier_id || null : undefined,
    quote_id: rest.quote_id !== undefined ? rest.quote_id || null : undefined,
    jewelry_type: rest.jewelry_type !== undefined ? rest.jewelry_type || null : undefined,
    description: rest.description !== undefined ? rest.description || null : undefined,
    diamond_type: rest.diamond_type !== undefined ? rest.diamond_type || null : undefined,
    diamond_origin: rest.diamond_origin !== undefined ? rest.diamond_origin || null : undefined,
    diamond_certificate: rest.diamond_certificate !== undefined ? rest.diamond_certificate || null : undefined,
    gold_type: rest.gold_type !== undefined ? rest.gold_type || null : undefined,
    gold_color: rest.gold_color !== undefined ? rest.gold_color || null : undefined,
    size: rest.size !== undefined ? rest.size || null : undefined,
    engraving: rest.engraving !== undefined ? rest.engraving || null : undefined,
    order_status: rest.order_status || (isUpdate ? undefined : 'מחכה למקדמה'),
    production_status: rest.production_status !== undefined ? rest.production_status || null : undefined,
    sale_price: num(rest.sale_price),
    deposit_amount: num(rest.deposit_amount),
    balance_due: num(rest.balance_due),
    total_cost: num(rest.total_cost),
    net_profit: num(rest.net_profit),
    profit_margin: num(rest.profit_margin),
    payment_status: rest.payment_status || (isUpdate ? undefined : 'לא שולם'),
    delivery_date: rest.delivery_date !== undefined ? rest.delivery_date || null : undefined,
    notes: rest.notes !== undefined ? rest.notes || null : undefined,
  }
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
  if (rest.id) payload.id = rest.id
  if (rest.lead_id !== undefined) payload.lead_id = rest.lead_id || null
  if (rest.carat !== undefined) payload.carat = Number(rest.carat)
  if (rest.production_notes !== undefined) payload.production_notes = rest.production_notes || null
  const { data, error } = await supabase.from('orders').upsert(payload).select().single()
  if (error) { logSupabaseError('upsertOrder', error); throw error }
  return data as Order
}

export async function deleteOrder(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) { logSupabaseError('deleteOrder', error); throw error }
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function getPayments(): Promise<Payment[]> {
  if (IS_DEMO) return demoPayments.map(p => ({ ...p, created_at: '' }))
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false })
  if (error) { logSupabaseError('getPayments', error); throw error }
  return data as Payment[]
}

// Strips relation objects and coerces empty-string ids to null so payloads
// are always valid for PostgREST, no matter which form produced them.
function paymentPayload(payment: Partial<Payment>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    order_id: payment.order_id || null,
    customer_id: payment.customer_id || null,
    payment_type: payment.payment_type || null,
    payment_method: payment.payment_method || null,
    amount: Number(payment.amount ?? 0),
    payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
    is_paid: payment.is_paid ?? true,
    notes: payment.notes || null,
  }
  if (payment.id) payload.id = payment.id
  return payload
}

export async function insertPayment(payment: Partial<Payment>): Promise<Payment> {
  if (IS_DEMO) return { amount: 0, payment_date: new Date().toISOString().split('T')[0], is_paid: true, ...payment, id: crypto.randomUUID(), created_at: '' } as Payment
  const { data, error } = await supabase.from('payments').insert(paymentPayload(payment)).select().single()
  if (error) { logSupabaseError('insertPayment', error); throw error }
  return data as Payment
}

export async function upsertPayment(payment: Partial<Payment>): Promise<Payment> {
  if (IS_DEMO) return { ...payment, id: payment.id || crypto.randomUUID(), amount: payment.amount ?? 0, payment_date: payment.payment_date || new Date().toISOString().split('T')[0], is_paid: payment.is_paid ?? true, created_at: '' } as Payment
  const { data, error } = await supabase.from('payments').upsert(paymentPayload(payment)).select().single()
  if (error) { logSupabaseError('upsertPayment', error); throw error }
  return data as Payment
}

export async function deletePayment(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) { logSupabaseError('deletePayment', error); throw error }
}

// ─── Payment → order state automation ────────────────────────────────────────

/**
 * Single source of truth for an order's payment state. Derives balance_due
 * and payment_status from the actual payments, auto-advances the order from
 * "מחכה למקדמה" to "מקדמה התקבלה" once money arrives, persists the result,
 * and refreshes the customer's aggregate stats in the background.
 */
export async function syncOrderPaymentState(order: Order, payments: Payment[]): Promise<Order> {
  const paid = payments.filter(p => p.is_paid)
  const totalPaid = paid.reduce((s, p) => s + p.amount, 0)
  const balance_due = Math.max(0, order.sale_price - totalPaid)

  let payment_status: string
  if (totalPaid <= 0) payment_status = 'לא שולם'
  else if (balance_due === 0) payment_status = 'שולם במלואו'
  else if (paid.every(p => p.payment_type === 'מקדמה')) payment_status = 'שולמה מקדמה'
  else payment_status = 'שולם חלקית'

  const updates: Partial<Order> = { id: order.id, balance_due, payment_status }
  if (order.order_status === 'מחכה למקדמה' && totalPaid > 0) {
    updates.order_status = 'מקדמה התקבלה'
  }

  const updated = await upsertOrder(updates)
  if (order.customer_id) refreshCustomerStats(order.customer_id).catch(() => {})
  return { ...order, ...updated, payments }
}

/** Records a customer payment against an order and syncs the order's state. */
export async function recordOrderPayment(
  order: Order,
  payment: Partial<Payment>,
): Promise<{ payment: Payment; order: Order }> {
  const saved = await insertPayment({
    order_id: order.id,
    customer_id: order.customer_id,
    is_paid: true,
    payment_date: new Date().toISOString().split('T')[0],
    ...payment,
  })
  const nextPayments = [...(order.payments ?? []), saved]
  const synced = await syncOrderPaymentState(order, nextPayments)
  return { payment: saved, order: synced }
}

/** Re-syncs an order's payment state from the database (e.g. after edits made outside the order page). */
export async function syncOrderPaymentStateById(orderId: string): Promise<Order | null> {
  try {
    const order = await getOrder(orderId)
    return await syncOrderPaymentState(order, order.payments ?? [])
  } catch {
    return null
  }
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function getExpenses(): Promise<Expense[]> {
  if (IS_DEMO) return demoExpenses.map(e => ({ ...e, created_at: '' }))
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
  if (error) { logSupabaseError('getExpenses', error); throw error }
  return data as Expense[]
}

function expensePayload(expense: Partial<Expense>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    order_id: expense.order_id || null,
    supplier_id: expense.supplier_id || null,
    expense_type: expense.expense_type || null,
    amount: Number(expense.amount ?? 0),
    expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
    is_paid: expense.is_paid ?? false,
    notes: expense.notes || null,
  }
  if (expense.id) payload.id = expense.id
  return payload
}

export async function insertExpense(expense: Partial<Expense>): Promise<Expense> {
  if (IS_DEMO) return { amount: 0, expense_date: new Date().toISOString().split('T')[0], is_paid: true, ...expense, id: crypto.randomUUID(), created_at: '' } as Expense
  const { data, error } = await supabase.from('expenses').insert(expensePayload(expense)).select().single()
  if (error) { logSupabaseError('insertExpense', error); throw error }
  return data as Expense
}

export async function upsertExpense(expense: Partial<Expense>): Promise<Expense> {
  if (IS_DEMO) return { ...expense, id: expense.id || crypto.randomUUID(), amount: expense.amount ?? 0, expense_date: expense.expense_date || new Date().toISOString().split('T')[0], is_paid: expense.is_paid ?? false, created_at: '' } as Expense
  const { data, error } = await supabase.from('expenses').upsert(expensePayload(expense)).select().single()
  if (error) { logSupabaseError('upsertExpense', error); throw error }
  return data as Expense
}

export async function deleteExpense(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) { logSupabaseError('deleteExpense', error); throw error }
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  if (IS_DEMO) return demoSuppliers.map(s => ({ ...s, created_at: '' }))
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) { logSupabaseError('getSuppliers', error); throw error }
  return data as Supplier[]
}

export async function upsertSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  if (IS_DEMO) return { ...supplier, id: supplier.id || crypto.randomUUID(), name: supplier.name || '', created_at: '' } as Supplier
  const { data, error } = await supabase.from('suppliers').upsert(supplier).select().single()
  if (error) { logSupabaseError('upsertSupplier', error); throw error }
  return data as Supplier
}

export async function deleteSupplier(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) { logSupabaseError('deleteSupplier', error); throw error }
}

// ─── Single-entity lookups ───────────────────────────────────────────────────

export async function getQuote(id: string): Promise<Quote> {
  if (IS_DEMO) {
    const q = demoQuotes.find(q => q.id === id)
    if (!q) throw new Error('Quote not found')
    const customer = demoCustomers.find(c => c.id === q.customer_id)
    return { ...q, created_at: '', updated_at: '', customers: customer ? { ...customer, created_at: '', updated_at: '' } : undefined }
  }
  const { data, error } = await supabase.from('quotes').select('*').eq('id', id).single()
  if (error) { logSupabaseError('getQuote', error); throw error }
  const quote = data as Quote
  const [customerResult, leadResult] = await Promise.all([
    quote.customer_id
      ? supabase.from('customers').select('*').eq('id', quote.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    quote.lead_id
      ? supabase.from('leads').select('*').eq('id', quote.lead_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  return {
    ...quote,
    customers: customerResult.data as Customer ?? undefined,
    leads: leadResult.data as Lead ?? undefined,
  }
}

export async function getOrder(id: string): Promise<Order> {
  if (IS_DEMO) {
    const o = demoOrders.find(o => o.id === id)
    if (!o) throw new Error('Order not found')
    const customer = demoCustomers.find(c => c.id === o.customer_id)
    const supplier = demoSuppliers.find(s => s.id === o.supplier_id)
    const payments = demoPayments.filter(p => p.order_id === o.id).map(p => ({ ...p, created_at: '' }))
    const expenses = demoExpenses.filter(e => e.order_id === o.id).map(e => ({ ...e, created_at: '' }))
    return {
      ...o, created_at: '', updated_at: '',
      customers: customer ? { ...customer, created_at: '', updated_at: '' } : undefined,
      suppliers: supplier ? { ...supplier, created_at: '' } : undefined,
      payments, expenses,
    }
  }
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
  if (error) { logSupabaseError('getOrder', error); throw error }
  const order = data as Order
  const [customerResult, supplierResult, paymentsResult, expensesResult] = await Promise.all([
    order.customer_id
      ? supabase.from('customers').select('*').eq('id', order.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    order.supplier_id
      ? supabase.from('suppliers').select('*').eq('id', order.supplier_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('payments').select('*').eq('order_id', order.id),
    supabase.from('expenses').select('*').eq('order_id', order.id),
  ])
  return {
    ...order,
    customers: customerResult.data as Customer ?? undefined,
    suppliers: supplierResult.data as Supplier ?? undefined,
    payments: (paymentsResult.data ?? []) as Payment[],
    expenses: (expensesResult.data ?? []) as Expense[],
  }
}

export async function getCustomerFull(id: string): Promise<Customer> {
  if (IS_DEMO) {
    const c = demoCustomers.find(c => c.id === id)
    if (!c) throw new Error('Customer not found')
    const convertedLeads = demoLeads.filter(l => l.customer_id === c.id && l.order_id).map(l => ({ ...l, created_at: '', updated_at: '' }))
    const orders = demoOrders.filter(o => o.customer_id === c.id).map(o => ({ ...o, created_at: '', updated_at: '' }))
    return { ...c, created_at: '', updated_at: '', converted_leads: convertedLeads, orders }
  }
  const [customerResult, ordersResult, leadsResult] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase.from('orders').select('*').eq('customer_id', id),
    supabase.from('leads').select('*').eq('customer_id', id).not('order_id', 'is', null),
  ])
  if (customerResult.error) { logSupabaseError('getCustomerFull', customerResult.error); throw customerResult.error }
  return {
    ...(customerResult.data as Customer),
    orders: (ordersResult.data ?? []) as Order[],
    converted_leads: (leadsResult.data ?? []) as Lead[],
  }
}

// ─── Customer stats refresh ───────────────────────────────────────────────────

export async function refreshCustomerStats(customerId: string): Promise<Customer> {
  if (IS_DEMO) {
    const c = demoCustomers.find(c => c.id === customerId)
    if (!c) throw new Error('Customer not found')
    const orders = demoOrders.filter(o => o.customer_id === customerId && o.order_status !== 'בוטל')
    const ordersCount = orders.length
    const totalRevenue = orders.reduce((s, o) => s + o.sale_price, 0)
    const totalProfit = orders.reduce((s, o) => s + o.net_profit, 0)
    const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0
    let status: string
    if (ordersCount === 0) status = 'לקוח פוטנציאלי'
    else if (totalRevenue >= 10000 || ordersCount >= 3) status = 'VIP'
    else if (ordersCount > 1) status = 'לקוח חוזר'
    else status = 'לקוח חדש'
    return { ...c, created_at: '', updated_at: '', orders_count: ordersCount, total_revenue: totalRevenue, total_profit: totalProfit, average_order_value: avgOrderValue, customer_status: status }
  }
  const { data: orders, error: oErr } = await supabase
    .from('orders')
    .select('sale_price, net_profit, created_at, order_status')
    .eq('customer_id', customerId)
    .neq('order_status', 'בוטל')
  if (oErr) { logSupabaseError('refreshCustomerStats', oErr); throw oErr }

  const validOrders: { sale_price: number; net_profit: number | null; created_at?: string }[] = orders || []
  const ordersCount = validOrders.length
  const totalRevenue = validOrders.reduce((s, o) => s + o.sale_price, 0)
  const totalProfit = validOrders.reduce((s, o) => s + (o.net_profit ?? 0), 0)
  const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0
  const dates = validOrders.map(o => o.created_at).sort()
  let status: string
  if (ordersCount === 0) status = 'לקוח פוטנציאלי'
  else if (totalRevenue >= 10000 || ordersCount >= 3) status = 'VIP'
  else if (ordersCount > 1) status = 'לקוח חוזר'
  else status = 'לקוח חדש'

  const updates: Partial<Customer> = {
    id: customerId,
    orders_count: ordersCount,
    total_revenue: totalRevenue,
    total_profit: totalProfit,
    average_order_value: avgOrderValue,
    first_order_date: dates[0] || undefined,
    last_order_date: dates[dates.length - 1] || undefined,
    customer_status: status,
  }
  const { data, error } = await supabase.from('customers').upsert(updates).select().single()
  if (error) { logSupabaseError('refreshCustomerStats/upsert', error); throw error }
  return data as Customer
}

