import type { Lead } from './types'

export function detectJewelryType(message: string): string | null {
  const m = message.toLowerCase()
  if (/עגיל|עגילים|צמוד|סטאד|stud/.test(m)) return 'עגילים'
  if (/אירוסין|אירוס|סוליטר|הצעה|הילה|פאווה|halo|pave|solitaire/.test(m)) return 'טבעת אירוסין'
  if (/טבעת|טבעות/.test(m)) return 'טבעת אירוסין'
  if (/צמיד טניס|טניס/.test(m)) return 'צמיד טניס'
  if (/צמיד חוט|חוט/.test(m)) return 'צמיד חוט'
  if (/צמיד|באנגל/.test(m)) return 'צמיד'
  if (/שרשרת|תליון|מגן דוד|שרשראות/.test(m)) return 'שרשרת'
  return null
}

interface MissingField { field: string; label: string }

const REQUIRED_BY_TYPE: Record<string, MissingField[]> = {
  'עגילים': [
    { field: 'diamond_type', label: 'סוג יהלום' },
    { field: 'carat', label: 'קראט' },
    { field: 'gold_type', label: 'סוג זהב' },
    { field: 'gold_color', label: 'צבע זהב' },
    { field: 'budget', label: 'תקציב' },
  ],
  'טבעת אירוסין': [
    { field: 'budget', label: 'תקציב' },
    { field: 'diamond_type', label: 'סוג יהלום' },
    { field: 'carat', label: 'קראט' },
    { field: 'desired_style', label: 'סגנון רצוי' },
    { field: 'gold_color', label: 'צבע זהב' },
  ],
  'צמיד טניס': [
    { field: 'carat', label: 'קראט כולל' },
    { field: 'diamond_type', label: 'סוג יהלום' },
    { field: 'gold_type', label: 'סוג זהב' },
    { field: 'gold_color', label: 'צבע זהב' },
    { field: 'budget', label: 'תקציב' },
  ],
  'צמיד חוט': [
    { field: 'diamond_type', label: 'סוג יהלום' },
    { field: 'carat', label: 'קראט' },
    { field: 'gold_color', label: 'צבע זהב' },
    { field: 'budget', label: 'תקציב' },
  ],
  'שרשרת': [
    { field: 'desired_style', label: 'סגנון רצוי' },
    { field: 'gold_type', label: 'סוג זהב' },
    { field: 'gold_color', label: 'צבע זהב' },
    { field: 'diamond_type', label: 'סוג יהלום' },
    { field: 'budget', label: 'תקציב' },
  ],
}

export function getMissingDetails(lead: Partial<Lead>): MissingField[] {
  if (!lead.jewelry_type) {
    return [
      { field: 'jewelry_type', label: 'סוג תכשיט' },
      { field: 'budget', label: 'תקציב' },
    ].filter(f => !(lead as Record<string, unknown>)[f.field])
  }
  const required = REQUIRED_BY_TYPE[lead.jewelry_type] ?? [
    { field: 'budget', label: 'תקציב' },
    { field: 'diamond_type', label: 'סוג יהלום' },
    { field: 'gold_type', label: 'סוג זהב' },
  ]
  return required.filter(({ field }) => !(lead as Record<string, unknown>)[field])
}

export function getAutoLeadStatus(lead: Partial<Lead>): string {
  if (!lead.jewelry_type && !lead.original_message) return 'צריך מענה ראשוני'
  const missing = getMissingDetails(lead)
  if (missing.length === 0) return 'מוכן להצעת מחיר'
  if (lead.jewelry_type) return 'מחכה לפרטים'
  return 'צריך מענה ראשוני'
}

export function generateMissingDetailsMessage(lead: Partial<Lead>): string {
  const firstName = (lead.full_name || '').split(' ')[0] || 'שלום'
  const missing = getMissingDetails(lead)
  if (missing.length === 0) return ''
  const bullets = missing.map(m => `• ${m.label}`).join('\n')

  const templates: Record<string, string> = {
    'עגילים': `היי ${firstName} 😊\nתודה שפנית!\nכדי שאוכל להכין לך הצעת מחיר מדויקת לעגילים, אשמח לדעת:\n\n${bullets}\n\nאם יש לך תמונה לדוגמא — שלחי אלי! 💎`,
    'טבעת אירוסין': `היי ${firstName} 😊\nכמה מרגש!\nכדי שאוכל להכין לך הצעה לטבעת האירוסין, אשמח לדעת:\n\n${bullets}\n\nאם יש תמונה שמצאת ברשת שמדברת אליך — שלח/י אלי 💍`,
    'צמיד טניס': `היי ${firstName} 😊\nצמיד טניס זה תמיד אלגנטי!\nכדי שאוכל להכין הצעה, אשמח לדעת:\n\n${bullets}\n\nתודה ✨`,
    'צמיד חוט': `היי ${firstName} 😊\nכדי שאוכל להכין הצעה לצמיד, אשמח לדעת:\n\n${bullets}\n\nתודה! 💛`,
    'שרשרת': `היי ${firstName} 😊\nכדי שאוכל להכין הצעה לשרשרת, אשמח לדעת:\n\n${bullets}\n\nאם יש תמונה שמדברת אליך — שלח/י 🌟`,
  }

  return templates[lead.jewelry_type ?? ''] ?? `היי ${firstName} 😊\nתודה שפנית!\nכדי שאוכל להכין הצעת מחיר, אשמח לדעת:\n\n${bullets}\n\nתודה! 💎`
}

export function getDealQuality(profitMargin: number): { label: string; color: string } {
  if (profitMargin >= 35) return { label: 'עסקה טובה', color: 'text-emerald-600' }
  if (profitMargin >= 25) return { label: 'עסקה סבירה', color: 'text-blue-600' }
  if (profitMargin >= 15) return { label: 'רווח נמוך', color: 'text-amber-600' }
  return { label: 'לא מומלץ', color: 'text-red-600' }
}

export function getNextAction(lead: Partial<Lead>): {
  title: string
  description: string
  action: 'reply' | 'fill_details' | 'create_quote' | 'follow_up' | 'done'
} {
  const status = lead.lead_status ?? ''
  if (!lead.jewelry_type && !lead.original_message)
    return { title: 'צריך מענה ראשוני', description: 'שלח הודעה ראשונית ללקוח', action: 'reply' }

  const missing = getMissingDetails(lead)
  if (missing.length > 0)
    return { title: 'חסרים פרטים', description: `${missing.length} פרטים חסרים להצעת מחיר`, action: 'fill_details' }

  if (status === 'מוכן להצעת מחיר' || status === 'בטיפול' || status === 'חדש' || status === 'ממתין')
    return { title: 'מוכן להצעת מחיר', description: 'כל הפרטים קיימים — הכן הצעת מחיר', action: 'create_quote' }

  if (status === 'נשלחה הצעת מחיר')
    return { title: 'מחכה לתגובה', description: 'ההצעה נשלחה — בצע פולואפ', action: 'follow_up' }

  return { title: 'הליד סגור', description: '', action: 'done' }
}
