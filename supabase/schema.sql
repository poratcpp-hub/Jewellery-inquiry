-- ============================================================
-- Hebrew Jewelry Business Management System - Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  instagram text,
  email text,
  city text,
  source text,
  customer_status text default 'חדש',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SUPPLIERS
-- ============================================================
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  category text,
  location text,
  delivery_time text,
  quality_rating integer check (quality_rating between 1 and 5),
  reliability_rating integer check (reliability_rating between 1 and 5),
  price_rating integer check (price_rating between 1 and 5),
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- LEADS
-- ============================================================
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  full_name text,
  phone text,
  source text,
  jewelry_type text,
  diamond_type text,
  gold_type text,
  budget numeric,
  lead_status text default 'חדש',
  priority text default 'בינוני',
  follow_up_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- QUOTES
-- ============================================================
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text unique,
  customer_id uuid references customers(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  jewelry_type text,
  description text,
  diamond_type text,
  gold_type text,
  gold_color text,
  carat numeric,
  diamond_color text,
  diamond_clarity text,
  diamond_cut text,
  has_certificate boolean default false,
  diamond_cost numeric default 0,
  gold_cost numeric default 0,
  labor_cost numeric default 0,
  setting_cost numeric default 0,
  packaging_cost numeric default 0,
  shipping_cost numeric default 0,
  other_cost numeric default 0,
  total_cost numeric default 0,
  sale_price numeric default 0,
  expected_profit numeric default 0,
  profit_margin numeric default 0,
  quote_status text default 'טיוטה',
  valid_until date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  customer_id uuid references customers(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  jewelry_type text,
  description text,
  diamond_type text,
  gold_type text,
  gold_color text,
  size text,
  engraving text,
  supplier_id uuid references suppliers(id) on delete set null,
  order_status text default 'הזמנה חדשה',
  production_status text,
  sale_price numeric default 0,
  deposit_amount numeric default 0,
  balance_due numeric default 0,
  total_cost numeric default 0,
  net_profit numeric default 0,
  profit_margin numeric default 0,
  payment_status text default 'לא שולם',
  delivery_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  payment_type text,
  payment_method text,
  amount numeric not null default 0,
  payment_date date default current_date,
  is_paid boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- EXPENSES
-- ============================================================
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  supplier_id uuid references suppliers(id) on delete set null,
  expense_type text,
  amount numeric not null default 0,
  expense_date date default current_date,
  is_paid boolean default true,
  receipt_url text,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- FILES
-- ============================================================
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  related_type text,
  related_id uuid,
  file_name text,
  file_url text,
  file_type text,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  related_type text,
  related_id uuid,
  title text not null,
  description text,
  due_date date,
  status text default 'פתוח',
  priority text default 'בינוני',
  created_at timestamptz default now()
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger customers_updated_at before update on customers
  for each row execute procedure update_updated_at_column();

create trigger leads_updated_at before update on leads
  for each row execute procedure update_updated_at_column();

create trigger quotes_updated_at before update on quotes
  for each row execute procedure update_updated_at_column();

create trigger orders_updated_at before update on orders
  for each row execute procedure update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (enable for production)
-- ============================================================
alter table customers enable row level security;
alter table leads enable row level security;
alter table quotes enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table suppliers enable row level security;
alter table files enable row level security;
alter table tasks enable row level security;

-- Allow all for now (replace with auth-scoped policies in production)
create policy "allow_all_customers" on customers for all using (true) with check (true);
create policy "allow_all_leads" on leads for all using (true) with check (true);
create policy "allow_all_quotes" on quotes for all using (true) with check (true);
create policy "allow_all_orders" on orders for all using (true) with check (true);
create policy "allow_all_payments" on payments for all using (true) with check (true);
create policy "allow_all_expenses" on expenses for all using (true) with check (true);
create policy "allow_all_suppliers" on suppliers for all using (true) with check (true);
create policy "allow_all_files" on files for all using (true) with check (true);
create policy "allow_all_tasks" on tasks for all using (true) with check (true);
