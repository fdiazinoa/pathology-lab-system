create table public.doctors (
    id text primary key default gen_random_uuid()::text,
    lis_id text,
    name text not null check (length(trim(name)) > 0),
    specialty text,
    source_center_id text,
    center_id text references public.centers(id) on delete set null,
    assigned_route text,
    source_status text,
    is_active boolean not null default true,
    mobile text,
    phone text,
    email text,
    secretary text,
    license text,
    signature_url text,
    created_at timestamptz not null default now()
);
create table public.doctor_master_details (
    doctor_id text primary key references public.doctors(id) on delete cascade,
    source_record jsonb not null
);
alter table public.doctors enable row level security;
alter table public.doctor_master_details enable row level security;
revoke all on public.doctors, public.doctor_master_details from public, anon, authenticated;
grant select, insert, update, delete on public.doctors to authenticated;
grant select on public.doctor_master_details to authenticated;
grant all on public.doctors, public.doctor_master_details to service_role;
create policy "Approved staff read doctors" on public.doctors for select to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active and p.role in ('admin','pathologist','technician','courier')));
create policy "Administrators manage doctors" on public.doctors for all to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active and p.role='admin'));
create policy "Administrators read original doctor master" on public.doctor_master_details for select to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active and p.role='admin'));
create index doctors_center_id_idx on public.doctors(center_id);
