import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return '—'
  }
}

export function calculateQuoteCosts(quote: {
  diamond_cost?: number
  gold_cost?: number
  labor_cost?: number
  setting_cost?: number
  packaging_cost?: number
  shipping_cost?: number
  other_cost?: number
  sale_price?: number
}) {
  const total_cost =
    (quote.diamond_cost || 0) +
    (quote.gold_cost || 0) +
    (quote.labor_cost || 0) +
    (quote.setting_cost || 0) +
    (quote.packaging_cost || 0) +
    (quote.shipping_cost || 0) +
    (quote.other_cost || 0)

  const sale_price = quote.sale_price || 0
  const expected_profit = sale_price - total_cost
  const profit_margin = sale_price > 0 ? (expected_profit / sale_price) * 100 : 0

  return { total_cost, expected_profit, profit_margin }
}

export function calculateOrderFinancials(order: {
  sale_price?: number
  deposit_amount?: number
  total_cost?: number
}) {
  const sale_price = order.sale_price || 0
  const deposit_amount = order.deposit_amount || 0
  const total_cost = order.total_cost || 0

  const balance_due = sale_price - deposit_amount
  const net_profit = sale_price - total_cost
  const profit_margin = sale_price > 0 ? (net_profit / sale_price) * 100 : 0

  return { balance_due, net_profit, profit_margin }
}

export function generateQuoteNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 900 + 100)
  return `Q${year}${month}-${random}`
}

export function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 900 + 100)
  return `O${year}${month}-${random}`
}

export function isOverdue(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export function daysUntil(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getProfitColor(margin: number): string {
  if (margin >= 40) return 'text-emerald-600'
  if (margin >= 25) return 'text-amber-600'
  return 'text-red-600'
}
