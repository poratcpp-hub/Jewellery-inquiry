import { describe, it, expect } from 'vitest'
import {
  detectJewelryType,
  getMissingDetails,
  getAutoLeadStatus,
  generateMissingDetailsMessage,
  getDealQuality,
  getNextAction,
  generateQuoteMessage,
} from './workflow'
import type { Lead } from './types'

describe('detectJewelryType', () => {
  it('detects each jewelry type from Hebrew inquiry text', () => {
    expect(detectJewelryType('מחפשת עגילים צמודים')).toBe('עגילים')
    expect(detectJewelryType('רוצה טבעת אירוסין סוליטר')).toBe('טבעת אירוסין')
    expect(detectJewelryType('כמה עולה צמיד טניס?')).toBe('צמיד טניס')
    expect(detectJewelryType('מעוניין בשרשרת עם תליון')).toBe('שרשרת')
    expect(detectJewelryType('צמיד זהב פשוט')).toBe('צמיד')
  })

  it('engagement-ring keywords win over generic ring keywords', () => {
    expect(detectJewelryType('טבעת עם הילה')).toBe('טבעת אירוסין')
  })

  it('returns null when nothing matches', () => {
    expect(detectJewelryType('שלום, מה שלומך?')).toBeNull()
  })
})

describe('getMissingDetails', () => {
  it('asks for jewelry type and budget when the type is unknown', () => {
    const missing = getMissingDetails({})
    expect(missing.map(m => m.field)).toEqual(['jewelry_type', 'budget'])
  })

  it('asks only for fields that are still empty', () => {
    const lead: Partial<Lead> = {
      jewelry_type: 'טבעת אירוסין',
      budget: 20000,
      diamond_type: 'Round',
      carat: 1,
    }
    const fields = getMissingDetails(lead).map(m => m.field)
    expect(fields).toEqual(['desired_style', 'gold_color'])
  })

  it('returns an empty list when everything is filled', () => {
    const lead: Partial<Lead> = {
      jewelry_type: 'טבעת אירוסין', budget: 20000, diamond_type: 'Round',
      carat: 1, desired_style: 'סוליטר', gold_color: 'צהוב',
    }
    expect(getMissingDetails(lead)).toEqual([])
  })
})

describe('getAutoLeadStatus', () => {
  it('closed once an order exists', () => {
    expect(getAutoLeadStatus({ order_id: 'o1' })).toBe('נסגר להזמנה')
  })

  it('needs first reply when there is no message and no type', () => {
    expect(getAutoLeadStatus({})).toBe('צריך מענה ראשוני')
  })

  it('waits for details while required fields are missing', () => {
    expect(getAutoLeadStatus({ jewelry_type: 'שרשרת' })).toBe('מחכה לפרטים')
  })

  it('ready for a quote once all details are in', () => {
    expect(getAutoLeadStatus({
      jewelry_type: 'טבעת אירוסין', budget: 20000, diamond_type: 'Round',
      carat: 1, desired_style: 'סוליטר', gold_color: 'צהוב',
    })).toBe('מוכן להצעת מחיר')
  })
})

describe('generateMissingDetailsMessage', () => {
  it('addresses the customer by first name and lists the missing fields', () => {
    const msg = generateMissingDetailsMessage({ full_name: 'דנה כהן', jewelry_type: 'עגילים' })
    expect(msg).toContain('דנה')
    expect(msg).toContain('• תקציב')
  })

  it('returns an empty string when nothing is missing', () => {
    expect(generateMissingDetailsMessage({
      jewelry_type: 'טבעת אירוסין', budget: 20000, diamond_type: 'Round',
      carat: 1, desired_style: 'סוליטר', gold_color: 'צהוב',
    })).toBe('')
  })
})

describe('getDealQuality', () => {
  it('grades margins into the four tiers', () => {
    expect(getDealQuality(40).label).toBe('עסקה טובה')
    expect(getDealQuality(30).label).toBe('עסקה סבירה')
    expect(getDealQuality(20).label).toBe('רווח נמוך')
    expect(getDealQuality(10).label).toBe('לא מומלץ')
  })
})

describe('getNextAction', () => {
  it('walks the pipeline in priority order', () => {
    expect(getNextAction({ lead_status: 'לא רלוונטי' }).action).toBe('done')
    expect(getNextAction({ order_id: 'o1' }).action).toBe('view_order')
    expect(getNextAction({ lead_status: 'נסגר להזמנה' }).action).toBe('create_order')
    expect(getNextAction({ lead_status: 'חדש' }).action).toBe('link_customer')
    expect(getNextAction({ lead_status: 'חדש', customer_id: 'c1' }).action).toBe('reply')
    expect(getNextAction({ lead_status: 'חדש', customer_id: 'c1', jewelry_type: 'שרשרת' }).action).toBe('fill_details')
    expect(getNextAction({
      lead_status: 'נשלחה הצעת מחיר', customer_id: 'c1', quote_id: 'q1',
      jewelry_type: 'טבעת אירוסין', budget: 20000, diamond_type: 'Round',
      carat: 1, desired_style: 'סוליטר', gold_color: 'צהוב',
    }).action).toBe('follow_up')
    expect(getNextAction({
      lead_status: 'מוכן להצעת מחיר', customer_id: 'c1',
      jewelry_type: 'טבעת אירוסין', budget: 20000, diamond_type: 'Round',
      carat: 1, desired_style: 'סוליטר', gold_color: 'צהוב',
    }).action).toBe('create_quote')
  })
})

describe('generateQuoteMessage', () => {
  it('includes the quote number, specs, and formatted price', () => {
    const msg = generateQuoteMessage({
      quote_number: 'Q2607-ABC123',
      jewelry_type: 'טבעת אירוסין',
      diamond_type: 'Round',
      carat: 1.2,
      gold_type: '18K',
      gold_color: 'לבן',
      sale_price: 25000,
    }, 'דנה כהן')
    expect(msg).toContain('דנה')
    expect(msg).toContain('Q2607-ABC123')
    expect(msg).toContain('Round 1.2 קראט')
    expect(msg).toContain('18K לבן')
    expect(msg).toContain('25,000')
  })

  it('omits the diamond line when there is no diamond', () => {
    const msg = generateQuoteMessage({ quote_number: 'Q1', diamond_type: 'ללא' })
    expect(msg).not.toContain('יהלום')
  })
})
