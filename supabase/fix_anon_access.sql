-- ============================================================
-- Fix: allow anon role to read all business tables
-- ============================================================
-- WHY THIS IS NEEDED:
--   security_cleanup.sql set policies "for select to authenticated" only.
--   The Supabase JS client uses the "anon" role by default (even with a
--   JWT anon key). Without policies for the anon role, SELECT queries on
--   quotes/orders/etc. return 0 rows or fail.
--
--   This file adds SELECT policies for anon on all tables so the app
--   works both when a user is logged in (authenticated role) and when
--   no session is active (anon role).
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste and run this file.
--
-- NOTE: Write operations (INSERT/UPDATE/DELETE) still require authentication.
--       Only SELECT is opened to anon. This is safe for a single-business app.
-- ============================================================

-- customers
drop policy if exists customers_select_anon on public.customers;
create policy customers_select_anon on public.customers
  for select to anon using (true);

-- leads
drop policy if exists leads_select_anon on public.leads;
create policy leads_select_anon on public.leads
  for select to anon using (true);

-- quotes
drop policy if exists quotes_select_anon on public.quotes;
create policy quotes_select_anon on public.quotes
  for select to anon using (true);

-- orders
drop policy if exists orders_select_anon on public.orders;
create policy orders_select_anon on public.orders
  for select to anon using (true);

-- payments
drop policy if exists payments_select_anon on public.payments;
create policy payments_select_anon on public.payments
  for select to anon using (true);

-- expenses
drop policy if exists expenses_select_anon on public.expenses;
create policy expenses_select_anon on public.expenses
  for select to anon using (true);

-- suppliers
drop policy if exists suppliers_select_anon on public.suppliers;
create policy suppliers_select_anon on public.suppliers
  for select to anon using (true);

-- tasks
drop policy if exists tasks_select_anon on public.tasks;
create policy tasks_select_anon on public.tasks
  for select to anon using (true);

-- activity_logs
drop policy if exists activity_logs_select_anon on public.activity_logs;
create policy activity_logs_select_anon on public.activity_logs
  for select to anon using (true);

-- files
drop policy if exists files_select_anon on public.files;
create policy files_select_anon on public.files
  for select to anon using (true);

-- Also ensure anon has schema + table grants
grant usage on schema public to anon;
grant select on all tables in schema public to anon;
