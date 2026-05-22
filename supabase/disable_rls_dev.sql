-- =============================================================
-- Disable RLS for local/dev — USE ONLY IN DEVELOPMENT
-- Do NOT run this in production.
--
-- Run this in Supabase Dashboard → SQL Editor if you want
-- zero-friction dev access without needing auth policies.
-- =============================================================

alter table if exists customers    disable row level security;
alter table if exists leads        disable row level security;
alter table if exists quotes       disable row level security;
alter table if exists orders       disable row level security;
alter table if exists payments     disable row level security;
alter table if exists expenses     disable row level security;
alter table if exists suppliers    disable row level security;
alter table if exists tasks        disable row level security;
alter table if exists activity_logs disable row level security;
alter table if exists files        disable row level security;
