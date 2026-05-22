-- =============================================================
-- Supabase dev fix: grants + disable RLS
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to run multiple times.
-- =============================================================

-- STEP 1: Grant schema access
-- Without this, all queries return 42501 "permission denied for schema public"
grant usage on schema public to anon, authenticated;
grant all   on schema public to service_role;

-- STEP 2: Grant table and sequence access on all existing tables
grant select, insert, update, delete on all tables    in schema public to authenticated;
grant select, insert, update, delete on all tables    in schema public to anon;
grant usage, select                  on all sequences in schema public to authenticated;
grant usage, select                  on all sequences in schema public to anon;

-- STEP 3: Default privileges for tables created in the future
alter default privileges in schema public
  grant select, insert, update, delete on tables    to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables    to anon;
alter default privileges in schema public
  grant usage, select                  on sequences to authenticated;
alter default privileges in schema public
  grant usage, select                  on sequences to anon;

-- STEP 4: Disable RLS on all tables for development
-- Replace with proper auth-scoped policies before going to production
alter table if exists customers     disable row level security;
alter table if exists leads         disable row level security;
alter table if exists quotes        disable row level security;
alter table if exists orders        disable row level security;
alter table if exists payments      disable row level security;
alter table if exists expenses      disable row level security;
alter table if exists suppliers     disable row level security;
alter table if exists tasks         disable row level security;
alter table if exists activity_logs disable row level security;
alter table if exists files         disable row level security;
