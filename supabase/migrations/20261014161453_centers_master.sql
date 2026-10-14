create table if not exists public.centers (
    id text primary key default gen_random_uuid()::text,
    name text not null check (length(trim(name)) > 0),
    address text,
    main_route text,
    gps_location text,
    location text,
    phone text,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);
alter table public.centers enable row level security;
revoke all on table public.centers from public, anon, authenticated;
grant select, insert, update, delete on table public.centers to authenticated;
grant all on table public.centers to service_role;
create policy "Approved staff read centers" on public.centers for select to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role in ('admin','pathologist','technician','courier')));
create policy "Administrators manage centers" on public.centers for all to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'));
