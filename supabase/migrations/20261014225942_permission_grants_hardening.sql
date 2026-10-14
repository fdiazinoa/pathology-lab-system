-- Supabase default privileges can include TRUNCATE/TRIGGER. RLS does not guard TRUNCATE.
revoke all on public.app_roles from authenticated;
grant select, insert, update, delete on public.app_roles to authenticated;
