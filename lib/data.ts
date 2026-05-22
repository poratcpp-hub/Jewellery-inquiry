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

// ─── Customers ───────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  if (IS_DEMO) return demoCustomers.map(c => ({ ...c, created_at: '', updated_at: '' }))
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Customer[]
}

export async function upsertCustomer(customer: Partial<Customer>): Promise<Customer> {
  if (IS_DEMO) return { ...customer, id: customer.id || crypto.randomUUID(), created_at: '', updated_at: '' } as Customer
  const { data, error } = await supabase.from('customers').upsert(customer).select().single()
  if (error) throw error
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
  if (error) throw error
  return data as Lead[]
}

export async function upsertLead(lead: Partial<Lead>): Promise<Lead> {
  if (IS_DEMO) return { ...lead, id: lead.id || crypto.randomUUID(), lead_status: lead.lead_status || 'חדש', priority: lead.priority || 'בינוני', created_at: '', updated_at: '' } as Lead
  const { data, error } = await supabase.from('leads').upsert(lead).select().single()
  if (error) throw error
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
  if (error) throw error
  return data as Quote[]
}

export async function upsertQuote(quote: Partial<Quote>): Promise<Quote> {
  if (IS_DEMO) return { ...quote, id: quote.id || crypto.randomUUID(), quote_status: 'טיוטה', diamond_cost: 0, gold_cost: 0, labor_cost: 0, setting_cost: 0, packaging_cost: 0, shipping_cost: 0, other_cost: 0, total_cost: 0, sale_price: 0, expected_profit: 0, profit_margin: 0, created_at: '', updated_at: '' } as Quote
  const { data, error } = await supabase.from('quotes').upsert(quote).select().single()
  if (error) throw error
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
  if (error) throw error
  return data as Order[]
}

export async function upsertOrder(order: Partial<Order>): Promise<Order> {
  if (IS_DEMO) return { ...order, id: order.id || crypto.randomUUID(), order_status: order.order_status || 'מחכה למקדמה', payment_status: order.payment_status || 'לא שולם', sale_price: order.sale_price ?? 0, deposit_amount: order.deposit_amount ?? 0, balance_due: order.balance_due ?? 0, total_cost: order.total_cost ?? 0, net_profit: order.net_profit ?? 0, profit_margin: order.profit_margin ?? 0, created_at: '', updated_at: '' } as Order
  const { data, error } = await supabase.from('orders').upsert(order).select().single()
  if (error) throw error
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
  if (error) throw error
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
  if (error) throw error
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
  if (error) throw error
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
    // Only show leads that converted to orders
    const convertedLeads = demoLeads.filter(l => l.customer_id === c.id && l.order_id).map(l => ({ ...l, created_at: '', updated_at: '' }))
    const orders = demoOrders.filter(o => o.customer_id === c.id).map(o => ({ ...o, created_at: '', updated_at: '' }))
    return { ...c, created_at: '', updated_at: '', converted_leads: convertedLeads, orders }
  }
  const { data, error } = await supabase
    .from('customers')
    .select('*, orders(*), converted_leads:leads!inner(customer_id, order_id)')
    .eq('id', id)
    .single()
  if (error) {
    // fallback without inner join
    const { data: d2, error: e2 } = await supabase.from('customers').select('*, orders(*)').eq('id', id).single()
    if (e2) throw e2
    const { data: leads } = await supabase.from('leads').select('*').eq('customer_id', id).not('order_id', 'is', null)
    return { ...(d2 as Customer), converted_leads: (leads || []) as Lead[] }
  }
  return data as Customer
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  if (IS_DEMO) return []
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true })
  if (error) throw error
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
