import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  calculateQuoteCosts,
  calculateOrderFinancials,
  generateQuoteNumber,
  generateOrderNumber,
  isOverdue,
  daysUntil,
  formatDate,
} from './utils'

afterEach(() => vi.useRealTimers())

describe('calculateQuoteCosts', () => {
  it('sums every cost component and derives profit and margin', () => {
    const result = calculateQuoteCosts({
      diamond_cost: 3000, gold_cost: 1000, labor_cost: 500, setting_cost: 300,
      packaging_cost: 100, shipping_cost: 50, other_cost: 50,
      sale_price: 10000,
    })
    expect(result.total_cost).toBe(5000)
    expect(result.expected_profit).toBe(5000)
    expect(result.profit_margin).toBe(50)
  })

  it('treats missing costs as 0 and avoids dividing by a zero sale price', () => {
    const result = calculateQuoteCosts({ diamond_cost: 1000 })
    expect(result.total_cost).toBe(1000)
    expect(result.expected_profit).toBe(-1000)
    expect(result.profit_margin).toBe(0)
  })
})

describe('calculateOrderFinancials', () => {
  it('derives balance due, net profit, and margin', () => {
    const result = calculateOrderFinancials({ sale_price: 8000, deposit_amount: 2000, total_cost: 5000 })
    expect(result.balance_due).toBe(6000)
    expect(result.net_profit).toBe(3000)
    expect(result.profit_margin).toBe(37.5)
  })

  it('handles an empty order without NaN', () => {
    const result = calculateOrderFinancials({})
    expect(result).toEqual({ balance_due: 0, net_profit: 0, profit_margin: 0 })
  })
})

describe('document numbers', () => {
  it('follows the Qyymm-XXXX / Oyymm-XXXX format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
    expect(generateQuoteNumber()).toMatch(/^Q2607-[0-9A-Z]{1,6}$/)
    expect(generateOrderNumber()).toMatch(/^O2607-[0-9A-Z]{1,6}$/)
  })

  it('produces different numbers at different times', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-10T12:00:00.000Z'))
    const first = generateOrderNumber()
    vi.setSystemTime(new Date('2026-07-10T12:00:00.001Z'))
    expect(generateOrderNumber()).not.toBe(first)
  })
})

describe('date helpers', () => {
  it('isOverdue is true only for past dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
    expect(isOverdue('2026-07-09')).toBe(true)
    expect(isOverdue('2026-07-11')).toBe(false)
    expect(isOverdue(null)).toBe(false)
    expect(isOverdue(undefined)).toBe(false)
  })

  it('daysUntil counts forward and returns null without a date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-10T00:00:00Z'))
    expect(daysUntil('2026-07-13')).toBe(3)
    expect(daysUntil(null)).toBeNull()
  })

  it('formatDate falls back to a dash for empty input', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })
})
