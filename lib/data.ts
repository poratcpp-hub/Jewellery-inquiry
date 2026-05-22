/**
 * Data access layer.
 * When NEXT_PUBLIC_DEMO_MODE=true (or Supabase env vars are absent), all reads
 * return in-memory demo data so the app works without a database.
 * Replace the demo branches with real supabase calls once connected.
 */
import { supabase } from './supabase'
import {
  demoCustomers, demoLeads, demoQuotes, demoOrders,
  demoPayments, demoExpenses, demoSuppliers,
} from './demo-data'
import type {
  Customer, Lead, Quote, Order, Payment, Expense, Supplier, DashboardMetrics, Task,
} from './types'

const IS_DEMO =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

function hydrateTimestamps<T extends object>(item: T): T & { created_at: string; updated_at?: string } {
  return {
    ...item,
    created_at: new Date().toISOString(),
    ...('updated_at' in item ? {} : { updated_at: new Date().toISOString() }),
  }
}

function logQueryError(table: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  const isHostError = error.message?.includes('Host not in allowlist')
  if (isHostError) {
    console.error(
      `[Supabase] ❌ "${table}" → Host not in allowlist\n` +
      `  Your key (sb_publishable_...) requires a host allowlist in Supabase.\n` +
      `  Fix: Supabase Dashboard → Project Settings → API → API Keys\n` +
      `  1. Add your domain/localhost to the publishable key allowlist, OR\n` +
      `  2. Replace the key with the "anon public" JWT key (starts with eyJ...)`
    )
  } else {
    console.error(`[Supabase] ❌ query on "${table}" failed:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
  }
}

// ─── Database health check ────────────────────────────────────────────────────

export async function checkDatabaseConnection(): Promise<{ ok: boolean; error?: string; isHostError?: boolean }> {
  if (IS_DEMO) return { ok: true }
  const { data, error } = await supabase.from('customers').select('id').limit(1)
  if (error) {
    logQueryError('customers', error)
    return {
      ok: false,
      error: error.message,
      isHostError: error.message?.includes('Host not in allowlist'),
    }
  }
  console.log('[Supabase] ✅ DB connection OK, customers table accessible')
  return { ok: true }
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  if (IS_DEMO) return demoCustomers.map(c => ({ ...c, created_at: '', updated_at: '' }))
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (error) { logQueryError('customers', error); throw error }
  return data as Customer[]
}

export async function upsertCustomer(customer: Partial<Customer>): Promise<Customer> {
  if (IS_DEMO) return { ...customer, id: customer.id || crypto.randomUUID(), created_at: '', updated_at: '' } as Customer
  const { orders: _orders, converted_leads: _leads, ...rest } = customer as Customer & { orders?: unknown; converted_leads?: unknown }
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
  if (error) { console.error('[upsertCustomer] Supabase error:', error); throw error }
  return data as Customer
}

export async function deleteCustomer(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function getLeads(): Promise<Lead[]> {
  if (IS_DEMO) return demoLeads.map(l => ({ ...l, created_at: '', updated_at: '' }))
  const { data, error } = await supabase
    .from('leads')
    .select('*, customers(*)')
    .order('created_at', { ascending: false })
  if (error) { logQueryError('leads', error); throw error }
  return data as Lead[]
}

export async function upsertLead(lead: Partial<Lead>): Promise<Lead> {
  if (IS_DEMO) return { ...lead, id: lead.id || crypto.randomUUID(), lead_status: lead.lead_status || 'חדש', priority: lead.priority || 'בינוני', created_at: '', updated_at: '' } as Lead
  // Strip relation/joined fields that are not DB columns
  const { customers: _c, quotes: _q, orders: _o, ...rest } = lead as Lead & { customers?: unknown; quotes?: unknown; orders?: unknown }
  // Explicit whitelist — only base schema columns
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
  // Remove undefined values so existing DB rows are not overwritten with null
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
  // Include id only for updates
  if (rest.id) payload.id = rest.id
  // Phase 3 columns — skip entirely if undefined so missing-column errors don't occur
  if (rest.quote_id !== undefined) payload.quote_id = rest.quote_id || null
  if (rest.order_id !== undefined) payload.order_id = rest.order_id || null

  const { data, error } = await supabase.from('leads').upsert(payload).select().single()
  if (error) { console.error('[upsertLead] Supabase error:', error); throw error }
  return data as Lead
}

export async function deleteLead(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}

export async function getLead(id: string): Promise<Lead> {
  if (IS_DEMO) {
    const lead = demoLeads.find(l => l.id === id)
    if (!lead) throw new Error('Not found')
    const customer = demoCustomers.find(c => c.id === lead.customer_id)
    const linkedQuote = lead.quote_id ? demoQuotes.find(q => q.id === lead.quote_id) : undefined
    return { ...lead, created_at: '', updated_at: '', customers: customer ? { ...customer, created_at: '', updated_at: '' } : undefined, quotes: linkedQuote ? { ...linkedQuote, created_at: '', updated_at: '' } : undefined } as Lead
  }
  const { data, error } = await supabase
    .from('leads')
    .select('*, customers(*), quotes(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Lead
}

export async function findCustomerByContact(
  phone?: string,
  instagram?: string,
  email?: string,
): Promise<Customer | null> {
  if (IS_DEMO) {
    const c = demoCustomers.find(c =>
      (phone && c.phone === phone) ||
      (instagram && c.instagram === instagram) ||
      (email && c.email === email)
    )
    return c ? { ...c, created_at: '', updated_at: '' } : null
  }
  if (phone) {
    const { data } = await supabase.from('customers').select('*').eq('phone', phone).maybeSingle()
    if (data) return data as Customer
  }
  if (instagram) {
    const { data } = await supabase.from('customers').select('*').eq('instagram', instagram).maybeSingle()
    if (data) return data as Customer
  }
  if (email) {
    const { data } = await supabase.from('customers').select('*').eq('email', email).maybeSingle()
    if (data) return data as Customer
  }
  return null
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

export async function getQuotes(): Promise<Quote[]> {
  if (IS_DEMO) return demoQuotes.map(q => ({ ...q, created_at: '', updated_at: '' }))
  const { data, error } = await supabase
    .from('quotes')
    .select('*, customers(*), leads(*)')
    .order('created_at', { ascending: false })
  if (error) { logQueryError('quotes', error); throw error }
  return data as Quote[]
}

export async function upsertQuote(quote: Partial<Quote>): Promise<Quote> {
  if (IS_DEMO) return { ...quote, id: quote.id || crypto.randomUUID(), quote_status: quote.quote_status || 'טיוטה', diamond_cost: quote.diamond_cost ?? 0, gold_cost: quote.gold_cost ?? 0, labor_cost: quote.labor_cost ?? 0, setting_cost: quote.setting_cost ?? 0, packaging_cost: quote.packaging_cost ?? 0, shipping_cost: quote.shipping_cost ?? 0, other_cost: quote.other_cost ?? 0, total_cost: quote.total_cost ?? 0, sale_price: quote.sale_price ?? 0, expected_profit: quote.expected_profit ?? 0, profit_margin: quote.profit_margin ?? 0, created_at: '', updated_at: '' } as Quote
  // Strip relation/joined fields that are not DB columns
  const { customers: _c, leads: _l, ...rest } = quote as Quote & { customers?: unknown; leads?: unknown }
  // Explicit whitelist — only base schema columns
  const payload: Record<string, unknown> = {
    quote_number: rest.quote_number,
    customer_id: rest.customer_id || null,
    lead_id: rest.lead_id || null,
    jewelry_type: rest.jewelry_type || null,
    description: rest.description || null,
    diamond_type: rest.diamond_type || null,
    diamond_origin: rest.diamond_origin || null,
    diamond_certificate: rest.diamond_certificate || null,
    gold_type: rest.gold_type || null,
    gold_color: rest.gold_color || null,
    carat: rest.carat !== undefined ? rest.carat : undefined,
    diamond_color: rest.diamond_color || null,
    diamond_clarity: rest.diamond_clarity || null,
    diamond_cut: rest.diamond_cut || null,
    // Ensure numeric fields are numbers
    diamond_cost: Number(rest.diamond_cost ?? 0),
    gold_cost: Number(rest.gold_cost ?? 0),
    labor_cost: Number(rest.labor_cost ?? 0),
    setting_cost: Number(rest.setting_cost ?? 0),
    packaging_cost: Number(rest.packaging_cost ?? 0),
    shipping_cost: Number(rest.shipping_cost ?? 0),
    other_cost: Number(rest.other_cost ?? 0),
    total_cost: Number(rest.total_cost ?? 0),
    sale_price: Number(rest.sale_price ?? 0),
    expected_profit: Number(rest.expected_profit ?? 0),
    profit_margin: Number(rest.profit_margin ?? 0),
    quote_status: rest.quote_status || 'טיוטה',
    valid_until: rest.valid_until || null,
    estimated_delivery_time: rest.estimated_delivery_time || null,
    notes: rest.notes || null,
  }
  // Remove undefined values so existing DB rows are not overwritten with null
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
  // Include id only for updates
  if (rest.id) payload.id = rest.id
  // Phase 3 column — skip entirely if undefined so missing-column errors don't occur
  if (rest.order_id !== undefined) payload.order_id = rest.order_id || null

  const { data, error } = await supabase.from('quotes').upsert(payload).select().single()
  if (error) { console.error('[upsertQuote] Supabase error:', error); throw error }
  return data as Quote
}

export async function deleteQuote(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) throw error
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  if (IS_DEMO) return demoOrders.map(o => ({ ...o, created_at: '', updated_at: '' }))
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(*), quotes(*), suppliers(*)')
    .order('created_at', { ascending: false })
  if (error) { logQueryError('orders', error); throw error }
  return data as Order[]
}

export async function upsertOrder(order: Partial<Order>): Promise<Order> {
  if (IS_DEMO) return { ...order, id: order.id || crypto.randomUUID(), order_status: order.order_status || 'מחכה למקדמה', payment_status: order.payment_status || 'לא שולם', sale_price: order.sale_price ?? 0, deposit_amount: order.deposit_amount ?? 0, balance_due: order.balance_due ?? 0, total_cost: order.total_cost ?? 0, net_profit: order.net_profit ?? 0, profit_margin: order.profit_margin ?? 0, created_at: '', updated_at: '' } as Order
  // Explicit whitelist — only base schema columns. Never spread unknown fields.
  const payload: Record<string, unknown> = {
    order_number: order.order_number,
    customer_id: order.customer_id || null,
    supplier_id: order.supplier_id || null,
    quote_id: order.quote_id || null,
    jewelry_type: order.jewelry_type || null,
    description: order.description || null,
    diamond_type: order.diamond_type || null,
    diamond_origin: order.diamond_origin || null,
    diamond_certificate: order.diamond_certificate || null,
    gold_type: order.gold_type || null,
    gold_color: order.gold_color || null,
    size: order.size || null,
    engraving: order.engraving || null,
    order_status: order.order_status || 'מחכה למקדמה',
    production_status: order.production_status || null,
    sale_price: Number(order.sale_price ?? 0),
    deposit_amount: Number(order.deposit_amount ?? 0),
    balance_due: Number(order.balance_due ?? 0),
    total_cost: Number(order.total_cost ?? 0),
    net_profit: Number(order.net_profit ?? 0),
    profit_margin: Number(order.profit_margin ?? 0),
    payment_status: order.payment_status || 'לא שולם',
    delivery_date: order.delivery_date || null,
    notes: order.notes || null,
  }
  // Include id only for updates (new rows get a DB-generated uuid)
  if (order.id) payload.id = order.id
  // Phase 3 columns — skip entirely if undefined so missing-column errors don't occur
  if (order.lead_id !== undefined) payload.lead_id = order.lead_id || null
  if (order.carat !== undefined) payload.carat = Number(order.carat)
  if (order.production_notes !== undefined) payload.production_notes = order.production_notes || null

  const { data, error } = await supabase.from('orders').upsert(payload).select().single()
  if (error) { console.error('[upsertOrder] Supabase error:', error); throw error }
  return data as Order
}

export async function deleteOrder(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function getPayments(): Promise<Payment[]> {
  if (IS_DEMO) return demoPayments.map(p => ({ ...p, created_at: '' }))
  const { data, error } = await supabase
    .from('payments')
    .select('*, customers(*), orders(*)')
    .order('payment_date', { ascending: false })
  if (error) { logQueryError('payments', error); throw error }
  return data as Payment[]
}

export async function insertPayment(payment: Partial<Payment>): Promise<Payment> {
  if (IS_DEMO) return { ...payment, id: crypto.randomUUID(), amount: 0, payment_date: new Date().toISOString().split('T')[0], is_paid: true, created_at: '' } as Payment
  const { data, error } = await supabase.from('payments').insert(payment).select().single()
  if (error) throw error
  return data as Payment
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function getExpenses(): Promise<Expense[]> {
  if (IS_DEMO) return demoExpenses.map(e => ({ ...e, created_at: '' }))
  const { data, error } = await supabase
    .from('expenses')
    .select('*, suppliers(*), orders(*)')
    .order('expense_date', { ascending: false })
  if (error) { logQueryError('expenses', error); throw error }
  return data as Expense[]
}

export async function insertExpense(expense: Partial<Expense>): Promise<Expense> {
  if (IS_DEMO) return { ...expense, id: crypto.randomUUID(), amount: 0, expense_date: new Date().toISOString().split('T')[0], is_paid: true, created_at: '' } as Expense
  const { data, error } = await supabase.from('expenses').insert(expense).select().single()
  if (error) throw error
  return data as Expense
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  if (IS_DEMO) return demoSuppliers.map(s => ({ ...s, created_at: '' }))
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) { logQueryError('suppliers', error); throw error }
  return data as Supplier[]
}

export async function upsertSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  if (IS_DEMO) return { ...supplier, id: supplier.id || crypto.randomUUID(), name: supplier.name || '', created_at: '' } as Supplier
  const { data, error } = await supabase.from('suppliers').upsert(supplier).select().single()
  if (error) throw error
  return data as Supplier
}

export async function deleteSupplier(id: string): Promise<void> {
  if (IS_DEMO) return
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw error
}

// ─── Single-entity lookups ───────────────────────────────────────────────────

export async function getQuote(id: string): Promise<Quote> {
  if (IS_DEMO) {
    const q = demoQuotes.find(q => q.id === id)
    if (!q) throw new Error('Quote not found')
    const customer = demoCustomers.find(c => c.id === q.customer_id)
    return { ...q, created_at: '', updated_at: '', customers: customer ? { ...customer, created_at: '', updated_at: '' } : undefined }
  }
  const { data, error } = await supabase.from('quotes').select('*, customers(*), leads(*)').eq('id', id).single()
  if (error) throw error
  return data as Quote
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
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(*), suppliers(*), payments(*), expenses(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Order
}

export async function getCustomerFull(id: string): Promise<Customer> {
  if (IS_DEMO) {
    const c = demoCustomers.find(c => c.id === id)
    if (!c) throw new Error('Customer not found')
    const convertedLeads = demoLeads.filter(l => l.customer_id === c.id && l.order_id).map(l => ({ ...l, created_at: '', updated_at: '' }))
    const orders = demoOrders.filter(o => o.customer_id === c.id).map(o => ({ ...o, created_at: '', updated_at: '' }))
    return { ...c, created_at: '', updated_at: '', converted_leads: convertedLeads, orders }
  }
  const { data, error } = await supabase.from('customers').select('*, orders(*)').eq('id', id).single()
  if (error) throw error
  const { data: leads } = await supabase.from('leads').select('*').eq('customer_id', id).not('order_id', 'is', null)
  return { ...(data as Customer), converted_leads: (leads || []) as Lead[] }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  if (IS_DEMO) return []
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true })
  if (error) { logQueryError('tasks', error); throw error }
  return data as Task[]
}

export async function upsertTask(task: Partial<Task>): Promise<Task> {
  if (IS_DEMO) return { ...task, id: task.id || crypto.randomUUID(), status: task.status || 'פתוח', priority: task.priority || 'בינוני', title: task.title || '', created_at: '' } as Task
  const { data, error } = await supabase.from('tasks').upsert(task).select().single()
  if (error) throw error
  return data as Task
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
    let status = 'לקוח חדש'
    if (totalRevenue >= 10000 || ordersCount >= 3) status = 'VIP'
    else if (ordersCount > 1) status = 'לקוח חוזר'
    return { ...c, created_at: '', updated_at: '', orders_count: ordersCount, total_revenue: totalRevenue, total_profit: totalProfit, average_order_value: avgOrderValue, customer_status: status }
  }
  const { data: orders, error: oErr } = await supabase
    .from('orders')
    .select('sale_price, net_profit, created_at, order_status')
    .eq('customer_id', customerId)
    .neq('order_status', 'בוטל')
  if (oErr) throw oErr

  const validOrders = orders || []
  const ordersCount = validOrders.length
  const totalRevenue = validOrders.reduce((s, o) => s + o.sale_price, 0)
  const totalProfit = validOrders.reduce((s, o) => s + o.net_profit, 0)
  const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0
  const dates = validOrders.map(o => o.created_at).sort()
  let status = 'לקוח חדש'
  if (totalRevenue >= 10000 || ordersCount >= 3) status = 'VIP'
  else if (ordersCount > 1) status = 'לקוח חוזר'

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
  if (error) throw error
  return data as Customer
}

// ─── Dashboard metrics ───────────────────────────────────────────────────────

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [payments, expenses, leads, quotes, orders] = await Promise.all([
    getPayments(),
    getExpenses(),
    getLeads(),
    getQuotes(),
    getOrders(),
  ])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const twoWeeksAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const monthlyRevenue = payments
    .filter(p => p.is_paid && new Date(p.payment_date) >= monthStart)
    .reduce((s, p) => s + p.amount, 0)

  const monthlyExpenses = expenses
    .filter(e => e.is_paid && new Date(e.expense_date) >= monthStart)
    .reduce((s, e) => s + e.amount, 0)

  const unpaidBalance = orders
    .filter(o => o.payment_status !== 'שולם במלואו')
    .reduce((s, o) => s + o.balance_due, 0)

  const upcomingDeliveries = orders.filter(o => {
    if (!o.delivery_date || ['הושלם', 'בוטל'].includes(o.order_status)) return false
    const d = new Date(o.delivery_date)
    return d >= now && d <= twoWeeksAhead
  }).length

  return {
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit: monthlyRevenue - monthlyExpenses,
    openOrders: orders.filter(o => !['הושלם', 'בוטל'].includes(o.order_status)).length,
    openQuotes: quotes.filter(q => !['אושרה', 'נדחתה', 'פג תוקף'].includes(q.quote_status)).length,
    activeLeads: leads.filter(l => !['נסגר להזמנה', 'לא רלוונטי'].includes(l.lead_status)).length,
    waitingForDetails: leads.filter(l => l.lead_status === 'מחכה לפרטים').length,
    unpaidBalance,
    upcomingDeliveries,
    realCustomers: 0,
    repeatCustomers: 0,
    waitingForDeposit: orders.filter(o => o.order_status === 'מחכה למקדמה').length,
    inProduction: orders.filter(o => o.order_status === 'בייצור' || o.order_status === 'הועבר לייצור').length,
  }
}
