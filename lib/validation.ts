// Shared validation and sanitization helpers

export function normalizeIsraeliPhone(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidIsraeliMobilePhone(value: string): boolean {
  if (!value) return false
  const normalized = normalizeIsraeliPhone(value)
  return /^05\d{8}$/.test(normalized)
}

export function isValidEmail(value: string): boolean {
  if (!value) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function toNumberOrZero(v: unknown): number {
  if (v === '' || v === null || v === undefined) return 0
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

export function toNullableUuid(v: unknown): string | null {
  if (!v || v === '') return null
  return v as string
}

export function trimStringFields<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj }
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = (result[key] as string).trim() as T[typeof key]
    }
  }
  return result
}

export const PHONE_ERROR = 'מספר טלפון חייב להיות מספר נייד ישראלי תקין בן 10 ספרות שמתחיל ב־05'
export const EMAIL_ERROR = 'כתובת האימייל אינה תקינה'
