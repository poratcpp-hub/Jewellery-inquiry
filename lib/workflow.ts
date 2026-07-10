import { formatCurrency, formatDate } from './utils'
import type { Lead, Quote, Payment, Expense } from './types'

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
  if (lead.order_id) return 'נסגר להזמנה'
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

/**
 * Pure decision engine for an order's payment state. Given the sale price,
 * the current order status, and the payments actually recorded, returns the
 * derived balance, payment status, and — when a milestone is reached — the
 * next order status:
 *   - first money in while waiting for a deposit  → «מקדמה התקבלה»
 *   - fully paid while waiting for the balance    → «הושלם»
 */
export function deriveOrderPaymentState(
  salePrice: number,
  orderStatus: string,
  payments: Pick<Payment, 'amount' | 'is_paid' | 'payment_type'>[],
): { balance_due: number; payment_status: string; next_order_status?: string } {
  const paid = payments.filter(p => p.is_paid)
  const totalPaid = paid.reduce((s, p) => s + p.amount, 0)
  const balance_due = Math.max(0, salePrice - totalPaid)

  let payment_status: string
  if (totalPaid <= 0) payment_status = 'לא שולם'
  else if (balance_due === 0) payment_status = 'שולם במלואו'
  else if (paid.every(p => p.payment_type === 'מקדמה')) payment_status = 'שולמה מקדמה'
  else payment_status = 'שולם חלקית'

  let next_order_status: string | undefined
  if (orderStatus === 'מחכה למקדמה' && totalPaid > 0) {
    next_order_status = 'מקדמה התקבלה'
  } else if (orderStatus === 'מחכה לתשלום יתרה' && totalPaid > 0 && balance_due === 0) {
    next_order_status = 'הושלם'
  }

  return { balance_due, payment_status, next_order_status }
}

const QUOTE_COST_TO_EXPENSE_TYPE = [
  ['diamond_cost', 'יהלום'],
  ['gold_cost', 'זהב'],
  ['labor_cost', 'עבודת ייצור'],
  ['setting_cost', 'שיבוץ'],
  ['packaging_cost', 'אריזה'],
  ['shipping_cost', 'משלוח'],
  ['other_cost', 'אחר'],
] as const

/**
 * Translates a quote's cost breakdown into planned (unpaid) expense line
 * items, so converting a quote to an order books the expected supplier
 * costs automatically.
 */
export function expenseItemsFromQuote(quote: Partial<Quote>): Pick<Expense, 'expense_type' | 'amount'>[] {
  return QUOTE_COST_TO_EXPENSE_TYPE
    .filter(([key]) => Number(quote[key] ?? 0) > 0)
    .map(([key, expense_type]) => ({ expense_type, amount: Number(quote[key]) }))
}

/**
 * Production milestones drive the order status: once production is done the
 * order is ready for delivery (unless it already moved further along).
 */
export function deriveOrderStatusFromProduction(
  orderStatus: string,
  productionStatus: string,
): string | undefined {
  const preDelivery = ['מחכה למקדמה', 'מקדמה התקבלה', 'הועבר לייצור', 'בייצור']
  if (productionStatus === 'הושלם' && preDelivery.includes(orderStatus)) return 'מוכן למסירה'
  if (productionStatus !== 'הושלם' && ['מחכה למקדמה', 'מקדמה התקבלה'].includes(orderStatus)) return 'בייצור'
  return undefined
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
  action: 'link_customer' | 'reply' | 'fill_details' | 'create_quote' | 'follow_up' | 'create_order' | 'view_order' | 'done'
} {
  const status = lead.lead_status ?? ''

  if (status === 'לא רלוונטי')
    return { title: 'ליד לא רלוונטי', description: '', action: 'done' }

  // Has order already
  if (lead.order_id)
    return { title: 'הזמנה קיימת', description: 'לחץ לפתיחת ההזמנה המקושרת', action: 'view_order' }

  // Closed but no order yet — needs to create one
  if (status === 'נסגר להזמנה')
    return { title: 'פתח הזמנה', description: 'הליד נסגר להזמנה — יש לפתוח הזמנה', action: 'create_order' }

  // No customer linked
  if (!lead.customer_id)
    return { title: 'קשר לקוח', description: 'לא קושר לקוח לליד הזה', action: 'link_customer' }

  if (!lead.jewelry_type && !lead.original_message)
    return { title: 'צריך מענה ראשוני', description: 'שלח הודעה ראשונית ללקוח', action: 'reply' }

  const missing = getMissingDetails(lead)
  if (missing.length > 0)
    return { title: 'חסרים פרטים', description: `${missing.length} פרטים חסרים להצעת מחיר`, action: 'fill_details' }

  if (lead.quote_id && (status === 'נשלחה הצעת מחיר' || status === 'פולואפ ראשון' || status === 'פולואפ שני'))
    return { title: 'מחכה לאישור הצעה', description: 'ההצעה נשלחה — בצע פולואפ', action: 'follow_up' }

  if (lead.quote_id)
    return { title: 'הצעת מחיר בטיוטה', description: 'השלם מחיר ושלח ללקוח', action: 'follow_up' }

  return { title: 'מוכן להצעת מחיר', description: 'כל הפרטים קיימים — צור הצעת מחיר', action: 'create_quote' }
}

export function generateQuoteMessage(quote: Partial<Quote>, customerName?: string): string {
  const name = (customerName || '').split(' ')[0] || 'לקוח יקר'
  let msg = `שלום ${name} 😊\n\nרצינו לשלוח לך את הצעת המחיר עבור ה${quote.jewelry_type || 'תכשיט'} שדיברנו עליה:\n\n`
  msg += `📋 *הצעת מחיר מספר ${quote.quote_number || ''}*\n`
  if (quote.jewelry_type) msg += `💍 סוג: ${quote.jewelry_type}\n`
  if (quote.diamond_type && quote.diamond_type !== 'ללא') {
    let line = `💎 יהלום: ${quote.diamond_type}`
    if (quote.carat) line += ` ${quote.carat} קראט`
    if (quote.diamond_color) line += ` צבע ${quote.diamond_color}`
    if (quote.diamond_clarity) line += ` ניקיון ${quote.diamond_clarity}`
    if (quote.diamond_certificate && quote.diamond_certificate !== 'ללא תעודה') line += ` (${quote.diamond_certificate})`
    if (quote.diamond_origin) line += ` · ${quote.diamond_origin}`
    msg += line + '\n'
  }
  if (quote.gold_type) msg += `🏅 זהב: ${quote.gold_type}${quote.gold_color ? ` ${quote.gold_color}` : ''}\n`
  if (quote.sale_price) msg += `\n💰 *מחיר: ${formatCurrency(quote.sale_price)}*\n`
  if (quote.valid_until) msg += `⏰ ההצעה בתוקף עד: ${formatDate(quote.valid_until)}\n`
  msg += `\nלשאלות נוספות אנחנו כאן! 🙏\nPORAT Private Jeweler`
  return msg
}
