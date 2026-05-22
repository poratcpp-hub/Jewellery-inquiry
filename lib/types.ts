export interface Customer {
  id: string
  full_name: string
  phone?: string
  instagram?: string
  email?: string
  city?: string
  source?: string
  customer_status: string
  notes?: string
  // Calculated from orders
  orders_count?: number
  total_revenue?: number
  total_profit?: number
  average_order_value?: number
  first_order_date?: string
  last_order_date?: string
  created_at: string
  updated_at: string
  // Relations
  orders?: Order[]
  converted_leads?: Lead[]
}

export interface Supplier {
  id: string
  name: string
  contact_name?: string
  phone?: string
  category?: string
  location?: string
  delivery_time?: string
  quality_rating?: number
  reliability_rating?: number
  price_rating?: number
  notes?: string
  created_at: string
}

export interface Lead {
  id: string
  customer_id?: string   // nullable — set only after order is created
  quote_id?: string      // nullable — set when quote is created from lead
  order_id?: string      // nullable — set when quote converts to order
  full_name?: string
  phone?: string
  instagram?: string
  email?: string
  source?: string
  jewelry_type?: string
  diamond_type?: string
  gold_type?: string
  gold_color?: string
  carat?: number
  ring_size?: string
  desired_style?: string
  original_message?: string
  budget?: number
  lead_status: string
  priority: string
  follow_up_date?: string
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  customers?: Customer
  quotes?: Quote
  orders?: Order
}

export interface Quote {
  id: string
  quote_number: string
  customer_id?: string   // nullable until order is created
  lead_id?: string
  order_id?: string      // nullable until converted to order
  jewelry_type?: string
  description?: string
  diamond_type?: string
  diamond_origin?: string
  diamond_certificate?: string
  gold_type?: string
  gold_color?: string
  carat?: number
  diamond_color?: string
  diamond_clarity?: string
  diamond_cut?: string
  diamond_cost: number
  gold_cost: number
  labor_cost: number
  setting_cost: number
  packaging_cost: number
  shipping_cost: number
  other_cost: number
  total_cost: number
  sale_price: number
  expected_profit: number
  profit_margin: number
  quote_status: string
  valid_until?: string
  estimated_delivery_time?: string
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  customers?: Customer
  leads?: Lead
}

export interface Order {
  id: string
  order_number: string
  customer_id: string    // NOT nullable — every order must have a customer
  quote_id?: string
  lead_id?: string
  jewelry_type?: string
  description?: string
  diamond_type?: string
  diamond_origin?: string
  diamond_certificate?: string
  gold_type?: string
  gold_color?: string
  carat?: number
  size?: string
  engraving?: string
  supplier_id?: string
  order_status: string
  production_status?: string
  production_notes?: string
  sale_price: number
  deposit_amount: number
  balance_due: number
  total_cost: number
  net_profit: number
  profit_margin: number
  payment_status: string
  delivery_date?: string
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  customers?: Customer
  quotes?: Quote
  suppliers?: Supplier
  payments?: Payment[]
  expenses?: Expense[]
}

export interface Payment {
  id: string
  order_id?: string
  customer_id?: string
  payment_type?: string
  payment_method?: string
  amount: number
  payment_date: string
  is_paid: boolean
  notes?: string
  created_at: string
  orders?: Order
  customers?: Customer
}

export interface Expense {
  id: string
  order_id?: string
  supplier_id?: string
  expense_type?: string
  amount: number
  expense_date: string
  is_paid: boolean
  receipt_url?: string
  notes?: string
  created_at: string
  orders?: Order
  suppliers?: Supplier
}

export interface Task {
  id: string
  related_type?: string
  related_id?: string
  customer_id?: string
  title: string
  description?: string
  task_type?: string
  due_date?: string
  status: string
  priority: string
  completed_at?: string
  created_at: string
}

export interface FileRecord {
  id: string
  related_type?: string
  related_id?: string
  file_name?: string
  file_url?: string
  file_type?: string
  notes?: string
  created_at: string
}

export interface DashboardMetrics {
  monthlyRevenue: number
  monthlyExpenses: number
  monthlyProfit: number
  openOrders: number
  openQuotes: number
  activeLeads: number
  waitingForDetails: number
  unpaidBalance: number
  upcomingDeliveries: number
  realCustomers: number
  repeatCustomers: number
  waitingForDeposit: number
  inProduction: number
}
