import { describe, it, expect } from 'vitest'
import {
  normalizeIsraeliPhone,
  isValidIsraeliMobilePhone,
  isValidEmail,
  toNumberOrZero,
  trimStringFields,
} from './validation'

describe('normalizeIsraeliPhone', () => {
  it('strips every non-digit character', () => {
    expect(normalizeIsraeliPhone('050-123 4567')).toBe('0501234567')
    expect(normalizeIsraeliPhone('(050) 123.4567')).toBe('0501234567')
    expect(normalizeIsraeliPhone('')).toBe('')
  })
})

describe('isValidIsraeliMobilePhone', () => {
  it('accepts a 10-digit mobile number starting with 05', () => {
    expect(isValidIsraeliMobilePhone('0501234567')).toBe(true)
    expect(isValidIsraeliMobilePhone('052-123-4567')).toBe(true)
  })

  it('rejects landlines, short numbers, and empty input', () => {
    expect(isValidIsraeliMobilePhone('031234567')).toBe(false)
    expect(isValidIsraeliMobilePhone('05012345')).toBe(false)
    expect(isValidIsraeliMobilePhone('05012345678')).toBe(false)
    expect(isValidIsraeliMobilePhone('')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('accepts standard addresses and treats empty as valid (optional field)', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('user.name@example.org')).toBe(true)
    expect(isValidEmail('')).toBe(true)
  })

  it('rejects malformed addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('a @b.co')).toBe(false)
  })
})

describe('toNumberOrZero', () => {
  it('converts numeric strings and passes numbers through', () => {
    expect(toNumberOrZero('42')).toBe(42)
    expect(toNumberOrZero(3.5)).toBe(3.5)
  })

  it('falls back to 0 for empty, null, undefined, and NaN', () => {
    expect(toNumberOrZero('')).toBe(0)
    expect(toNumberOrZero(null)).toBe(0)
    expect(toNumberOrZero(undefined)).toBe(0)
    expect(toNumberOrZero('abc')).toBe(0)
  })
})

describe('trimStringFields', () => {
  it('trims string values and leaves other types untouched', () => {
    expect(trimStringFields({ a: '  x ', b: 5, c: null })).toEqual({ a: 'x', b: 5, c: null })
  })
})
