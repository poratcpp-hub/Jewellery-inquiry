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
  Customer, Lead, Quote, Order, Payment, Expense, Supplier, DashboardMetrics,
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
    const quotes = demoQuotes.filter(q => q.customer_id === lead.customer_id).map(q => ({ ...q, created_at: '', updated_at: '' }))
    return { ...lead, created_at: '', updated_at: '', customers: customer ? { ...customer, created_at: '', updated_at: '' } : undefined, quotes } as Lead
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
  if (IS_DEMO) return { ...order, id: order.id || crypto.randomUUID(), order_status: 'הזמנה חדשה', payment_status: 'לא שולם', sale_price: 0, deposit_amount: 0, balance_due: 0, total_cost: 0, net_profit: 0, profit_margin: 0, created_at: '', updated_at: '' } as Order
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
    if (!o.delivery_date || ['נמסר', 'בוטל'].includes(o.order_status)) return false
    const d = new Date(o.delivery_date)
    return d >= now && d <= twoWeeksAhead
  }).length

  return {
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit: monthlyRevenue - monthlyExpenses,
    openOrders: orders.filter(o => !['נמסר', 'בוטל'].includes(o.order_status)).length,
    openQuotes: quotes.filter(q => !['אושרה', 'נדחתה', 'פג תוקף'].includes(q.quote_status)).length,
    newLeads: leads.filter(l => !['הומר', 'נסגר'].includes(l.lead_status)).length,
    unpaidBalance,
    upcomingDeliveries,
  }
}
