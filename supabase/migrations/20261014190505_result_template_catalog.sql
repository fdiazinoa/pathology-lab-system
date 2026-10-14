create table public.exams (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    description text,
    price_private numeric(12,2) check (price_private >= 0),
    price_insurance numeric(12,2) check (price_insurance >= 0),
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);
create table public.lab_info (
    id uuid primary key default gen_random_uuid(),
    singleton boolean not null default true unique check (singleton),
    name text,
    address text,
    phone text,
    email text,
    logo_url text,
    settings jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);
alter table public.exams enable row level security;
alter table public.lab_info enable row level security;
revoke all on public.exams, public.lab_info from public, anon, authenticated;
grant select, insert, update, delete on public.exams, public.lab_info to authenticated;
grant all on public.exams, public.lab_info to service_role;
create policy "Approved staff read exams" on public.exams for select to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active and p.role in ('admin','pathologist','technician','courier')));
create policy "Administrators manage exams" on public.exams for all to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active and p.role='admin'));
create policy "Approved staff read lab configuration" on public.lab_info for select to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active and p.role in ('admin','pathologist','technician','courier')));
create policy "Administrators manage lab configuration" on public.lab_info for all to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active and p.role='admin'));

-- These sections come from the result master, not billing tariffs. Leave prices unconfigured.
insert into public.exams(code,name,description) values
('B','Biopsia','Plantillas de resultados de la sección B'),
('C','Citología (sección C)','Modalidad conservada según el código del archivo original'),
('L','Citología (sección L)','Modalidad conservada según el código del archivo original'),
('CT','Citología no ginecológica (CT)','Plantillas de resultados de la sección CT'),
('HPV','Prueba de HPV','Plantillas de resultados de la sección HPV');
insert into public.lab_info(name,settings)
select 'Laboratorio de Patología',jsonb_build_object('aiEnabled',false,'resultTemplateExamGroups',jsonb_object_agg(id::text,code))
from public.exams where code in ('B','C','L','CT','HPV');
