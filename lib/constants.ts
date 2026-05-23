// Centralised Hebrew labels used across all pages
export const CUSTOMER_STATUSES = ['לקוח חדש', 'לקוח חוזר', 'VIP', 'לא פעיל'] as const
export const LEAD_STATUSES = [
  'חדש', 'צריך מענה ראשוני', 'מחכה לפרטים', 'מוכן להצעת מחיר',
  'נשלחה הצעת מחיר', 'פולואפ ראשון', 'פולואפ שני',
  'לקוח לא מגיב', 'נסגר להזמנה', 'לא רלוונטי',
] as const
export const LEAD_PRIORITIES = ['גבוה', 'בינוני', 'נמוך'] as const
export const QUOTE_STATUSES = ['טיוטה', 'נשלחה ללקוח', 'אושרה', 'נדחתה', 'פג תוקף'] as const
export const ORDER_STATUSES = [
  'מחכה למקדמה', 'מקדמה התקבלה', 'הועבר לייצור',
  'בייצור', 'מוכן למסירה', 'מחכה לתשלום יתרה', 'הושלם', 'בוטל',
] as const
export const PRODUCTION_STATUSES = ['הזמנת חומרים', 'הזמנת יהלום', 'בייצור', 'שיבוץ', 'ליטוש', 'הושלם'] as const
export const PAYMENT_STATUSES = ['לא שולם', 'שולמה מקדמה', 'שולם חלקית', 'שולם במלואו'] as const
export const TASK_STATUSES = ['פתוח', 'בביצוע', 'הושלם'] as const
export const TASK_PRIORITIES = ['גבוה', 'בינוני', 'נמוך'] as const

export const JEWELRY_TYPES = ['טבעת אירוסין', 'טבעת נישואין', 'עגילים', 'שרשרת', 'צמיד', 'צמיד טניס', 'צמיד חוט', 'תליון', 'אחר'] as const
export const DIAMOND_TYPES = ['Round', 'Princess', 'Oval', 'Cushion', 'Marquise', 'Emerald', 'Pear', 'Radiant', 'Asscher', 'Heart', 'ללא', 'אחר'] as const
export const DIAMOND_ORIGINS = ['טבעי', 'מעבדה'] as const
export const DIAMOND_CERTIFICATES = ['GIA', 'IGI', 'SGL', 'GGL', 'ללא תעודה'] as const
export const GOLD_TYPES = ['14K', '18K', '9K'] as const
export const GOLD_COLORS = ['צהוב', 'לבן', 'ורוד'] as const
export const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'] as const
export const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'] as const
export const DIAMOND_CUTS = ['Excellent', 'Very Good', 'Good', 'Fair'] as const

export const SOURCES = ['אינסטגרם', 'פייסבוק', 'המלצה', 'אתר', 'גוגל', 'TikTok', 'אחר'] as const
export const PAYMENT_TYPES = ['מקדמה', 'יתרה', 'תשלום מלא', 'החזר'] as const
export const PAYMENT_METHODS = ['מזומן', 'כרטיס אשראי', 'העברה בנקאית', 'ביט', 'פייפאל'] as const
export const EXPENSE_TYPES = ['יהלום', 'זהב', 'עבודת ייצור', 'שיבוץ', 'אריזה', 'משלוח', 'שיווק', 'אחר'] as const
export const SUPPLIER_CATEGORIES = ['יהלומים', 'זהב', 'כסף', 'ייצור', 'אריזה', 'משלוח', 'אחר'] as const

export const CLOSED_LEAD_STATUSES = new Set(['נסגר להזמנה', 'לא רלוונטי'])
export const CLOSED_QUOTE_STATUSES = new Set(['אושרה', 'נדחתה', 'פג תוקף'])
export const CLOSED_ORDER_STATUSES = new Set(['הושלם', 'בוטל'])
