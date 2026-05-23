-- Enable RLS on all app tables
alter table if exists public.customers enable row level security;
alter table if exists public.leads enable row level security;
alter table if exists public.quotes enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.payments enable row level security;
alter table if exists public.expenses enable row level security;
alter table if exists public.suppliers enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.activity_logs enable row level security;
alter table if exists public.files enable row level security;

-- Grant schema/table permissions
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Optional: allow anon only if the app intentionally works without login.
-- For safer setup, do NOT grant anon write access.
grant usage on schema public to anon;
grant select on all tables in schema public to anon;

-- Customers policies
drop policy if exists allow_all_customers on public.customers;
create policy allow_all_customers
on public.customers
for all
to authenticated
using (true)
with check (true);

-- Leads policies
drop policy if exists allow_all_leads on public.leads;
create policy allow_all_leads
on public.leads
for all
to authenticated
using (true)
with check (true);

-- Quotes policies
drop policy if exists allow_all_quotes on public.quotes;
create policy allow_all_quotes
on public.quotes
for all
to authenticated
using (true)
with check (true);

-- Orders policies
drop policy if exists allow_all_orders on public.orders;
create policy allow_all_orders
on public.orders
for all
to authenticated
using (true)
with check (true);

-- Payments policies
drop policy if exists allow_all_payments on public.payments;
create policy allow_all_payments
on public.payments
for all
to authenticated
using (true)
with check (true);

-- Expenses policies
drop policy if exists allow_all_expenses on public.expenses;
create policy allow_all_expenses
on public.expenses
for all
to authenticated
using (true)
with check (true);

-- Suppliers policies
drop policy if exists allow_all_suppliers on public.suppliers;
create policy allow_all_suppliers
on public.suppliers
for all
to authenticated
using (true)
with check (true);

-- Tasks policies
drop policy if exists allow_all_tasks on public.tasks;
create policy allow_all_tasks
on public.tasks
for all
to authenticated
using (true)
with check (true);

-- Activity logs policies
drop policy if exists allow_all_activity_logs on public.activity_logs;
create policy allow_all_activity_logs
on public.activity_logs
for all
to authenticated
using (true)
with check (true);

-- Files policies
drop policy if exists allow_all_files on public.files;
create policy allow_all_files
on public.files
for all
to authenticated
using (true)
with check (true);

-- Apply default privileges for future tables
alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant usage, select on sequences to authenticated;
