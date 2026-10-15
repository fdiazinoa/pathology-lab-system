-- Persist the same case from reception through report preparation.
create sequence public.case_number_seq;
grant usage on sequence public.case_number_seq to authenticated;
create table public.cases (
 id uuid primary key default gen_random_uuid(),
 case_number text not null unique default ('C-' || extract(year from now())::text || '-' || lpad(nextval('public.case_number_seq')::text,6,'0')),
 patient_id uuid not null references public.patients(id),
 type text not null,
 organ text not null default '',
 status text not null default 'Borrador' check(status in ('Borrador','En Proceso','Pendiente de Revisión','Finalizado','Listo para despacho','En Transito','Entregado','Cancelado')),
 current_stage text not null default 'recepcion',
 diagnosis text,
 payment_method text not null default 'Privado' check(payment_method in ('Privado','Asegurado','Institucional')),
 total_cost numeric(12,2) not null default 0 check(total_cost >= 0),
 metadata jsonb not null default '{}' check(jsonb_typeof(metadata)='object' and (not metadata ? 'report' or jsonb_typeof(metadata->'report')='object')),
 created_by uuid default auth.uid() references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index cases_patient_received_idx on public.cases(patient_id,created_at desc);
create index cases_status_created_idx on public.cases(status,created_at desc);
create index cases_created_by_idx on public.cases(created_by);
alter table public.cases enable row level security;
revoke all on public.cases from public, anon, authenticated;
grant select,insert,update,delete on public.cases to authenticated;
create policy cases_read on public.cases for select to authenticated using((select private.has_permission('cases','read')));
create policy cases_create on public.cases for insert to authenticated with check((select private.has_permission('cases','create')) and created_by=(select auth.uid()));
create policy cases_update on public.cases for update to authenticated
 using((select private.has_permission('cases','read')))
 with check((select private.has_permission('cases','read')));
create policy cases_delete on public.cases for delete to authenticated using((select private.has_permission('cases','delete')));

create function private.protect_case_changes() returns trigger language plpgsql set search_path='' as $$
declare
 before_report jsonb := '{}';
 after_report jsonb := coalesce(new.metadata->'report','{}');
 field text; section_name text; action_name text;
 protected_sections jsonb := '{"macroscopy":"macroscopy","microscopy":"microscopy","microscopyStructured":"microscopy","ihc":"ihc","diagnosis":"reports","resultDetails":"reports","validatedAt":"reports","validatedBy":"reports","releasedAt":"reports","releasedBy":"reports","digitalSignature":"reports","images":"images","tracking":"processing","interconsultation":"collaboration"}';
 locked boolean := false;
begin
 if tg_op='INSERT' then
  if new.status <> 'Borrador' then raise exception 'Los casos nuevos deben ser borradores.'; end if;
  if after_report->>'source'='reception' and not private.has_permission('reception','create') then raise exception 'Sin permiso para registrar recepciones.'; end if;
 else
  before_report=coalesce(old.metadata->'report','{}');
  if new.id is distinct from old.id or new.case_number is distinct from old.case_number or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at or new.patient_id is distinct from old.patient_id then
   raise exception 'La identidad del caso y su paciente están protegidos.';
  end if;
  if after_report->'source' is distinct from before_report->'source' or after_report->'sampleId' is distinct from before_report->'sampleId' then raise exception 'La recepción y la muestra originales están protegidas.'; end if;
  locked=old.status in ('Finalizado','Listo para despacho','En Transito','Entregado');
  if (new.type,new.organ,new.payment_method,new.total_cost) is distinct from (old.type,old.organ,old.payment_method,old.total_cost) then
   if locked or not private.has_permission('cases','edit') then raise exception 'Sin permiso para editar el caso.'; end if;
  end if;
  if new.current_stage is distinct from old.current_stage and not private.has_permission('processing','edit') then raise exception 'Sin permiso de procesamiento.'; end if;
  if (new.metadata-'report') is distinct from (old.metadata-'report') and not private.has_permission('cases','edit') then raise exception 'Sin permiso para editar metadatos.'; end if;
  if new.status is distinct from old.status then
   section_name=case new.status when 'Finalizado' then 'reports' when 'Listo para despacho' then 'reports' when 'Borrador' then 'reports' when 'En Transito' then 'dispatch' when 'Entregado' then 'logistics' else 'processing' end;
   action_name=case new.status when 'Finalizado' then 'validate' when 'Listo para despacho' then 'sign' when 'Borrador' then 'reopen' when 'En Transito' then 'dispatch' when 'Entregado' then 'deliver' else 'edit' end;
   if not private.has_permission(section_name,action_name) then raise exception 'Sin permiso para cambiar el estado.'; end if;
   if new.status='Listo para despacho' and old.status<>'Finalizado' then raise exception 'Valide el informe antes de firmarlo.'; end if;
   if new.status in ('Finalizado','Listo para despacho') and coalesce(trim(new.diagnosis),'')='' then raise exception 'Diagnóstico obligatorio.'; end if;
  end if;
 end if;
 for field in select jsonb_object_keys(before_report || after_report) loop
  if (before_report->field) is not distinct from (after_report->field) then continue; end if;
  if (before_report->field is null or before_report->field='null'::jsonb) and (after_report->field) in ('null'::jsonb,'""'::jsonb,'[]'::jsonb,'{}'::jsonb) then continue; end if;
  section_name=coalesce(protected_sections->>field,'cases');
  -- A case creator can set reception/general fields, but clinical actions remain independent.
  if tg_op='INSERT' and section_name='cases' then continue; end if;
  if field='auditLogs' then continue; end if; -- Informational only; immutable server audit below is authoritative.
  if locked and field not in ('validatedAt','validatedBy','releasedAt','releasedBy','digitalSignature') then raise exception 'Reabra el informe antes de modificarlo.'; end if;
  action_name=case when field in ('validatedAt','validatedBy') then 'validate' when field in ('releasedAt','releasedBy','digitalSignature') then 'sign' else 'edit' end;
  if field='images' then action_name=case when jsonb_array_length(coalesce(after_report->field,'[]'))>jsonb_array_length(coalesce(before_report->field,'[]')) then 'upload' when jsonb_array_length(coalesce(after_report->field,'[]'))<jsonb_array_length(coalesce(before_report->field,'[]')) then 'delete' else 'edit' end; end if;
  if not private.has_permission(section_name,action_name) then raise exception 'Sin permiso para modificar % (%).',field,section_name; end if;
 end loop;
 if new.diagnosis is distinct from (case when tg_op='UPDATE' then old.diagnosis else null end) and coalesce(new.diagnosis,'')<>'' then
  if locked or not private.has_permission('reports','edit') then raise exception 'Sin permiso para editar diagnóstico.'; end if;
 end if;
 if after_report#>>'{resultDetails,_template,id}' is distinct from before_report#>>'{resultDetails,_template,id}' and after_report#>>'{resultDetails,_template,id}' is not null and not private.has_permission('templates','use') then raise exception 'Sin permiso para usar plantillas.'; end if;
 new.updated_at=now(); return new;
end;
$$;
revoke all on function private.protect_case_changes() from public,anon,authenticated;
create trigger protect_case_changes before insert or update on public.cases for each row execute function private.protect_case_changes();

create table public.case_change_log (
 id bigint generated always as identity primary key,
 case_id uuid not null,
 actor uuid,
 operation text not null,
 changed_fields text[] not null,
 created_at timestamptz not null default now()
);
create index case_change_log_case_idx on public.case_change_log(case_id);
alter table public.case_change_log enable row level security;
revoke all on public.case_change_log from public,anon,authenticated;
grant select on public.case_change_log to authenticated;
create policy case_changes_read on public.case_change_log for select to authenticated using((select private.has_permission('audit','read')));
create function private.audit_case_changes() returns trigger language plpgsql security definer set search_path='' as $$
declare fields text[];
begin
 if auth.uid() is null then raise exception 'Sesión requerida para modificar casos.'; end if;
 if tg_op='INSERT' then fields=array['registration'];
 elsif tg_op='DELETE' then fields=array['deletion'];
 else select array_agg(entry.key order by entry.key) into fields from jsonb_each(to_jsonb(new)-array['updated_at']) entry where entry.value is distinct from (to_jsonb(old)->entry.key); end if;
 if coalesce(array_length(fields,1),0)>0 then insert into public.case_change_log(case_id,actor,operation,changed_fields) values(coalesce(new.id,old.id),auth.uid(),tg_op,fields); end if;
 return null;
end;
$$;
revoke all on function private.audit_case_changes() from public,anon,authenticated;
create trigger audit_case_changes after insert or update or delete on public.cases for each row execute function private.audit_case_changes();
