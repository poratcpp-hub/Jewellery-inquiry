// Centralised Hebrew labels used across all pages
export const CUSTOMER_STATUSES = ['חדש', 'פעיל', 'לא פעיל', 'VIP'] as const
export const LEAD_STATUSES = ['חדש', 'בטיפול', 'ממתין', 'הומר', 'נסגר'] as const
export const LEAD_PRIORITIES = ['גבוה', 'בינוני', 'נמוך'] as const
export const QUOTE_STATUSES = ['טיוטה', 'נשלחה', 'אושרה', 'נדחתה', 'פג תוקף'] as const
export const ORDER_STATUSES = ['הזמנה חדשה', 'בייצור', 'מוכן', 'נמסר', 'בוטל'] as const
export const PRODUCTION_STATUSES = ['הזמנת חומרים', 'הזמנת יהלום', 'בייצור', 'שיבוץ', 'ליטוש', 'הושלם'] as const
export const PAYMENT_STATUSES = ['לא שולם', 'שולם חלקית', 'שולם במלואו'] as const
export const TASK_STATUSES = ['פתוח', 'בביצוע', 'הושלם'] as const

export const JEWELRY_TYPES = ['טבעת אירוסין', 'טבעת נישואין', 'עגילים', 'שרשרת', 'צמיד', 'תליון', 'אחר'] as const
export const DIAMOND_TYPES = ['עגול', 'מרקיז', 'אובל', 'כרית', 'נסיכה', 'אמרלד', 'לב', 'ללא', 'אחר'] as const
export const GOLD_TYPES = ['14K', '18K', '9K'] as const
export const GOLD_COLORS = ['צהוב', 'לבן', 'ורוד'] as const
export const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'] as const
export const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'] as const
export const DIAMOND_CUTS = ['מצוין', 'טוב מאוד', 'טוב'] as const

export const SOURCES = ['אינסטגרם', 'פייסבוק', 'המלצה', 'אתר', 'גוגל', 'TikTok', 'אחר'] as const
export const PAYMENT_TYPES = ['מקדמה', 'יתרה', 'תשלום מלא', 'החזר'] as const
export const PAYMENT_METHODS = ['מזומן', 'כרטיס אשראי', 'העברה בנקאית', 'ביט', 'פייפאל'] as const
export const EXPENSE_TYPES = ['יהלום', 'זהב', 'עבודת ייצור', 'שיבוץ', 'אריזה', 'משלוח', 'שיווק', 'אחר'] as const
export const SUPPLIER_CATEGORIES = ['יהלומים', 'זהב', 'כסף', 'ייצור', 'אריזה', 'משלוח', 'אחר'] as const

export const CLOSED_LEAD_STATUSES = new Set(['הומר', 'נסגר'])
export const CLOSED_QUOTE_STATUSES = new Set(['אושרה', 'נדחתה', 'פג תוקף'])
export const CLOSED_ORDER_STATUSES = new Set(['נמסר', 'בוטל'])
