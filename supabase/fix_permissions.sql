-- =============================================================
-- Fix Supabase permissions: "permission denied for schema public"
-- Error code: 42501
--
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to run multiple times.
-- =============================================================

-- 1. Grant schema usage so roles can see the public schema at all
grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant all   on schema public to service_role;

-- 2. Grant table-level access on all existing tables
grant select, insert, update, delete on all tables    in schema public to anon;
grant select, insert, update, delete on all tables    in schema public to authenticated;
grant usage, select                  on all sequences in schema public to anon;
grant usage, select                  on all sequences in schema public to authenticated;

-- 3. Set default privileges so future tables get the same grants automatically
alter default privileges in schema public
  grant select, insert, update, delete on tables    to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables    to authenticated;
alter default privileges in schema public
  grant usage, select                  on sequences to anon;
alter default privileges in schema public
  grant usage, select                  on sequences to authenticated;
