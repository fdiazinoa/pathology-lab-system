create table public.patients (
 id uuid primary key default gen_random_uuid(),
 full_name text not null check(length(trim(full_name)) between 1 and 200),
 birth_date date,
 age integer check(age between 0 and 130),
 identification_number text check(identification_number is null or length(trim(identification_number)) between 1 and 100),
 sex text not null check(sex in ('F','M','Otro')),
 city text,
 region text,
 medical_history text,
 contact_phone text,
 ars_name text,
 policy_number text,
 created_by uuid references auth.users(id) on delete set null default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint adult_patient_document_required check(age is null or age < 18 or identification_number is not null)
);
create unique index patients_identification_normalized_unique on public.patients (lower(regexp_replace(identification_number,'[[:space:]-]','','g'))) where identification_number is not null;
alter table public.patients enable row level security;
revoke all on public.patients from public, anon, authenticated;
grant select, insert, update on public.patients to authenticated;
create policy patients_read on public.patients for select to authenticated using(private.has_permission('patients','read'));
create policy patients_create on public.patients for insert to authenticated with check(private.has_permission('patients','create') and created_by=auth.uid());
create policy patients_edit on public.patients for update to authenticated using(private.has_permission('patients','edit')) with check(private.has_permission('patients','edit'));

create function private.protect_patient_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if new.id is distinct from old.id or new.created_at is distinct from old.created_at or new.created_by is distinct from old.created_by then raise exception 'El identificador y el registro original del paciente están protegidos.'; end if;
 new.updated_at=now(); return new;
end;
$$;
revoke all on function private.protect_patient_identity() from public, anon, authenticated;
create trigger protect_patient_identity before update on public.patients for each row execute function private.protect_patient_identity();

-- Keep a trace of corrections without duplicating personal or clinical values in audit logs.
create table public.patient_change_log (
 id bigint generated always as identity primary key,
 patient_id uuid not null,
 actor uuid,
 operation text not null,
 changed_fields text[] not null,
 created_at timestamptz not null default now()
);
alter table public.patient_change_log enable row level security;
revoke all on public.patient_change_log from public, anon, authenticated;
grant select on public.patient_change_log to authenticated;
create policy patient_changes_read on public.patient_change_log for select to authenticated using(private.has_permission('audit','read'));
create function private.audit_patient_changes() returns trigger language plpgsql security definer set search_path='' as $$
declare fields text[];
begin
 if tg_op='INSERT' then fields=array['registration'];
 else select array_agg(entry.key order by entry.key) into fields from jsonb_each(to_jsonb(new)-array['updated_at']) entry where entry.value is distinct from (to_jsonb(old)->entry.key);
 end if;
 if coalesce(array_length(fields,1),0)>0 then
  insert into public.patient_change_log(patient_id,actor,operation,changed_fields) values(new.id,auth.uid(),tg_op,fields);
 end if;
 return null;
end;
$$;
revoke all on function private.audit_patient_changes() from public, anon, authenticated;
create trigger audit_patient_changes after insert or update on public.patients for each row execute function private.audit_patient_changes();
