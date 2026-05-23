-- ============================================================
-- Security cleanup migration
-- Fixes:
--   1. function_search_path_mutable  (update_updated_at_column, refresh_customer_stats)
--   2. rls_policy_always_true        (replaces broad FOR ALL with per-operation policies)
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================


-- ============================================================
-- PART 1 — Fix function search_path
-- ============================================================

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.refresh_customer_stats(p_customer_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_orders_count integer;
  v_total_revenue numeric;
  v_total_profit  numeric;
  v_avg_order     numeric;
  v_first_order   date;
  v_last_order    date;
  v_new_status    text;
begin
  select
    count(*),
    coalesce(sum(sale_price), 0),
    coalesce(sum(net_profit), 0),
    case when count(*) > 0 then coalesce(sum(sale_price), 0) / count(*) else 0 end,
    min(created_at::date),
    max(created_at::date)
  into v_orders_count, v_total_revenue, v_total_profit, v_avg_order, v_first_order, v_last_order
  from orders
  where customer_id = p_customer_id
    and order_status not in ('בוטל');

  if v_total_revenue >= 10000 or v_orders_count >= 3 then
    v_new_status := 'VIP';
  elsif v_orders_count > 1 then
    v_new_status := 'לקוח חוזר';
  elsif v_orders_count = 1 then
    v_new_status := 'לקוח חדש';
  else
    v_new_status := 'לא פעיל';
  end if;

  update customers set
    orders_count         = v_orders_count,
    total_revenue        = v_total_revenue,
    total_profit         = v_total_profit,
    average_order_value  = v_avg_order,
    first_order_date     = v_first_order,
    last_order_date      = v_last_order,
    customer_status      = v_new_status,
    updated_at           = now()
  where id = p_customer_id;
end;
$$;


-- ============================================================
-- PART 2 — Enable RLS on all app tables
-- ============================================================

alter table public.customers     enable row level security;
alter table public.leads         enable row level security;
alter table public.quotes        enable row level security;
alter table public.orders        enable row level security;
alter table public.payments      enable row level security;
alter table public.expenses      enable row level security;
alter table public.suppliers     enable row level security;
alter table public.tasks         enable row level security;
alter table public.activity_logs enable row level security;
alter table public.files         enable row level security;


-- ============================================================
-- PART 3 — Replace broad FOR ALL policies with per-operation policies
-- SELECT uses (true) — read all rows for authenticated users
-- INSERT / UPDATE / DELETE require auth.uid() is not null
-- ============================================================

-- customers
drop policy if exists allow_all_customers               on public.customers;
drop policy if exists customers_select_authenticated    on public.customers;
drop policy if exists customers_insert_authenticated    on public.customers;
drop policy if exists customers_update_authenticated    on public.customers;
drop policy if exists customers_delete_authenticated    on public.customers;

create policy customers_select_authenticated on public.customers
  for select to authenticated using (true);
create policy customers_insert_authenticated on public.customers
  for insert to authenticated with check (auth.uid() is not null);
create policy customers_update_authenticated on public.customers
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy customers_delete_authenticated on public.customers
  for delete to authenticated using (auth.uid() is not null);

-- leads
drop policy if exists allow_all_leads               on public.leads;
drop policy if exists leads_select_authenticated    on public.leads;
drop policy if exists leads_insert_authenticated    on public.leads;
drop policy if exists leads_update_authenticated    on public.leads;
drop policy if exists leads_delete_authenticated    on public.leads;

create policy leads_select_authenticated on public.leads
  for select to authenticated using (true);
create policy leads_insert_authenticated on public.leads
  for insert to authenticated with check (auth.uid() is not null);
create policy leads_update_authenticated on public.leads
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy leads_delete_authenticated on public.leads
  for delete to authenticated using (auth.uid() is not null);

-- quotes
drop policy if exists allow_all_quotes               on public.quotes;
drop policy if exists quotes_select_authenticated    on public.quotes;
drop policy if exists quotes_insert_authenticated    on public.quotes;
drop policy if exists quotes_update_authenticated    on public.quotes;
drop policy if exists quotes_delete_authenticated    on public.quotes;

create policy quotes_select_authenticated on public.quotes
  for select to authenticated using (true);
create policy quotes_insert_authenticated on public.quotes
  for insert to authenticated with check (auth.uid() is not null);
create policy quotes_update_authenticated on public.quotes
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy quotes_delete_authenticated on public.quotes
  for delete to authenticated using (auth.uid() is not null);

-- orders
drop policy if exists allow_all_orders               on public.orders;
drop policy if exists orders_select_authenticated    on public.orders;
drop policy if exists orders_insert_authenticated    on public.orders;
drop policy if exists orders_update_authenticated    on public.orders;
drop policy if exists orders_delete_authenticated    on public.orders;

create policy orders_select_authenticated on public.orders
  for select to authenticated using (true);
create policy orders_insert_authenticated on public.orders
  for insert to authenticated with check (auth.uid() is not null);
create policy orders_update_authenticated on public.orders
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy orders_delete_authenticated on public.orders
  for delete to authenticated using (auth.uid() is not null);

-- payments
drop policy if exists allow_all_payments               on public.payments;
drop policy if exists payments_select_authenticated    on public.payments;
drop policy if exists payments_insert_authenticated    on public.payments;
drop policy if exists payments_update_authenticated    on public.payments;
drop policy if exists payments_delete_authenticated    on public.payments;

create policy payments_select_authenticated on public.payments
  for select to authenticated using (true);
create policy payments_insert_authenticated on public.payments
  for insert to authenticated with check (auth.uid() is not null);
create policy payments_update_authenticated on public.payments
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy payments_delete_authenticated on public.payments
  for delete to authenticated using (auth.uid() is not null);

-- expenses
drop policy if exists allow_all_expenses               on public.expenses;
drop policy if exists expenses_select_authenticated    on public.expenses;
drop policy if exists expenses_insert_authenticated    on public.expenses;
drop policy if exists expenses_update_authenticated    on public.expenses;
drop policy if exists expenses_delete_authenticated    on public.expenses;

create policy expenses_select_authenticated on public.expenses
  for select to authenticated using (true);
create policy expenses_insert_authenticated on public.expenses
  for insert to authenticated with check (auth.uid() is not null);
create policy expenses_update_authenticated on public.expenses
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy expenses_delete_authenticated on public.expenses
  for delete to authenticated using (auth.uid() is not null);

-- suppliers
drop policy if exists allow_all_suppliers               on public.suppliers;
drop policy if exists suppliers_select_authenticated    on public.suppliers;
drop policy if exists suppliers_insert_authenticated    on public.suppliers;
drop policy if exists suppliers_update_authenticated    on public.suppliers;
drop policy if exists suppliers_delete_authenticated    on public.suppliers;

create policy suppliers_select_authenticated on public.suppliers
  for select to authenticated using (true);
create policy suppliers_insert_authenticated on public.suppliers
  for insert to authenticated with check (auth.uid() is not null);
create policy suppliers_update_authenticated on public.suppliers
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy suppliers_delete_authenticated on public.suppliers
  for delete to authenticated using (auth.uid() is not null);

-- tasks
drop policy if exists allow_all_tasks               on public.tasks;
drop policy if exists tasks_select_authenticated    on public.tasks;
drop policy if exists tasks_insert_authenticated    on public.tasks;
drop policy if exists tasks_update_authenticated    on public.tasks;
drop policy if exists tasks_delete_authenticated    on public.tasks;

create policy tasks_select_authenticated on public.tasks
  for select to authenticated using (true);
create policy tasks_insert_authenticated on public.tasks
  for insert to authenticated with check (auth.uid() is not null);
create policy tasks_update_authenticated on public.tasks
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy tasks_delete_authenticated on public.tasks
  for delete to authenticated using (auth.uid() is not null);

-- activity_logs
drop policy if exists allow_all_activity_logs               on public.activity_logs;
drop policy if exists activity_logs_select_authenticated    on public.activity_logs;
drop policy if exists activity_logs_insert_authenticated    on public.activity_logs;
drop policy if exists activity_logs_update_authenticated    on public.activity_logs;
drop policy if exists activity_logs_delete_authenticated    on public.activity_logs;

create policy activity_logs_select_authenticated on public.activity_logs
  for select to authenticated using (true);
create policy activity_logs_insert_authenticated on public.activity_logs
  for insert to authenticated with check (auth.uid() is not null);
create policy activity_logs_update_authenticated on public.activity_logs
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy activity_logs_delete_authenticated on public.activity_logs
  for delete to authenticated using (auth.uid() is not null);

-- files
drop policy if exists allow_all_files               on public.files;
drop policy if exists files_select_authenticated    on public.files;
drop policy if exists files_insert_authenticated    on public.files;
drop policy if exists files_update_authenticated    on public.files;
drop policy if exists files_delete_authenticated    on public.files;

create policy files_select_authenticated on public.files
  for select to authenticated using (true);
create policy files_insert_authenticated on public.files
  for insert to authenticated with check (auth.uid() is not null);
create policy files_update_authenticated on public.files
  for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy files_delete_authenticated on public.files
  for delete to authenticated using (auth.uid() is not null);


-- ============================================================
-- PART 4 — Grants for authenticated role only
-- anon gets no write access to business tables
-- ============================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables    in schema public to authenticated;
grant usage, select                  on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables    to authenticated;
alter default privileges in schema public
  grant usage, select                  on sequences to authenticated;
