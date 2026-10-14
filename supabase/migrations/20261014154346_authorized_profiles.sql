create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    role text check (role in ('admin', 'pathologist', 'technician', 'courier', 'viewer')),
    is_active boolean not null default false,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant all on table public.profiles to service_role;
drop policy if exists "Authorized users read own profile" on public.profiles;
create policy "Authorized users read own profile" on public.profiles
    for select to authenticated using ((select auth.uid()) = id);
comment on table public.profiles is 'Laboratory access approved by an administrator. Roles cannot be self-assigned.';
