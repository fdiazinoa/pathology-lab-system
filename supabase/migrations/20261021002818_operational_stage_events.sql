-- Opt-in operational lifecycle. No historical entry/start times are fabricated.
create table public.workflow_stations (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check(code = upper(trim(code)) and code ~ '^[A-Z0-9][A-Z0-9_-]{0,39}$'),
 name text not null check(length(trim(name)) between 1 and 120),
 is_active boolean not null default true,
 created_by uuid not null default auth.uid(),
 created_at timestamptz not null default now()
);
alter table public.workflow_stations enable row level security;
revoke all on public.workflow_stations from public, anon, authenticated;
grant select, insert on public.workflow_stations to authenticated;
create policy workflow_stations_read on public.workflow_stations for select to authenticated
 using((select private.has_permission('cases','read')) and (select private.has_permission('processing','read')));
create policy workflow_stations_create on public.workflow_stations for insert to authenticated
 with check((select private.has_permission('system','edit')) and created_by=(select auth.uid()));

create table public.case_stage_events (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.cases(id),
 stage_id text not null check(stage_id in ('reception','macroscopy','processing','microtomy','staining','microscopy','diagnosis','validation')),
 event_type text not null check(event_type in ('enter','start','complete')),
 station_id uuid not null references public.workflow_stations(id),
 station_code text not null,
 station_name text not null,
 actor_id uuid not null,
 actor_name text not null,
 recorded_at timestamptz not null default clock_timestamp(),
 scanned_code text,
 block_id text,
 specimen_id text,
 unique(case_id,stage_id,event_type)
);
create index case_stage_events_station_idx on public.case_stage_events(station_id,recorded_at);
alter table public.case_stage_events enable row level security;
revoke all on public.case_stage_events from public,anon,authenticated;
grant select on public.case_stage_events to authenticated;
create policy case_stage_events_read on public.case_stage_events for select to authenticated
 using((select private.has_permission('cases','read')) and (select private.has_permission('processing','read')));

-- Prevent a generic draft update or board drag from bypassing operational transitions.
create function private.operational_workflow_enabled() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.lab_info where settings->'enableOperationalWorkflow'='true'::jsonb);
$$;
revoke all on function private.operational_workflow_enabled() from public,anon,authenticated;
grant execute on function private.operational_workflow_enabled() to authenticated;
create function private.protect_operational_workflow() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user='authenticated' and private.operational_workflow_enabled() then
  if tg_op='INSERT' then
   if coalesce(new.metadata#>'{report,tracking}','null'::jsonb) not in ('null'::jsonb,'{}'::jsonb) then raise exception 'El registro operativo no admite etapas históricas en casos nuevos.'; end if;
  elsif new.current_stage is distinct from old.current_stage or coalesce(new.metadata#>'{report,tracking}','null'::jsonb) is distinct from coalesce(old.metadata#>'{report,tracking}','null'::jsonb) then
   raise exception 'Registre el movimiento desde el registro operativo de etapas.';
  end if;
 end if;
 return new;
end;
$$;
revoke all on function private.protect_operational_workflow() from public,anon,authenticated;
create trigger protect_operational_workflow before insert or update on public.cases for each row execute function private.protect_operational_workflow();

-- A private definer is needed to append server-controlled events; clients have no DML grants.
-- Every call checks the live actor, permissions, feature flag, case, station and lifecycle.
create function private.record_operational_stage(p_case_id uuid,p_stage_id text,p_action text,p_station_id uuid,p_scanned_code text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid(); actor_name text; config jsonb; sample public.cases;
 station public.workflow_stations; entry public.case_stage_events;
 stage_ids text[] := array['reception','macroscopy','processing','microtomy','staining','microscopy','diagnosis','validation'];
 case_stages text[] := array['recepcion','macroscopia','procesamiento','microtomia','tincion','microscopia','por_firmar','por_firmar'];
 position integer; prior_stage text; expected_action text; scanned text := nullif(trim(p_scanned_code),'');
 verified_block text; verified_specimen text; result_events jsonb;
begin
 if actor is null or not private.has_permission('cases','read') or not private.has_permission('processing','edit') then
  raise exception 'No tiene permiso para registrar etapas.' using errcode='42501';
 end if;
 select settings into config from public.lab_info limit 1;
 if (config->'enableOperationalWorkflow') is distinct from 'true'::jsonb then raise exception 'El registro operativo está desactivado.'; end if;
 position=array_position(stage_ids,p_stage_id);
 if position is null or p_action is null or p_action not in ('enter','start','complete') then raise exception 'Etapa o acción inválida.'; end if;
 -- Serialize transitions across users/terminals and protect against duplicate/reordered actions.
 select * into sample from public.cases where id=p_case_id for update;
 if not found then raise exception 'Caso no encontrado.'; end if;
 if sample.status in ('Finalizado','Listo para despacho','En Transito','Entregado','Cancelado') then raise exception 'El caso está cerrado. Reábralo antes de registrar etapas.'; end if;
 select * into station from public.workflow_stations where id=p_station_id and is_active for share;
 if not found then raise exception 'Seleccione una estación activa.'; end if;
 foreach prior_stage in array stage_ids[1:position-1] loop
  if not exists(select 1 from public.case_stage_events where case_id=p_case_id and stage_id=prior_stage and event_type='complete')
   and not (not exists(select 1 from public.case_stage_events where case_id=p_case_id and stage_id=prior_stage)
    and coalesce(sample.metadata#>array['report','tracking',prior_stage,'completed'],'false'::jsonb)='true'::jsonb) then
   raise exception 'Complete las etapas anteriores primero.';
  end if;
 end loop;
 select * into entry from public.case_stage_events where case_id=p_case_id and stage_id=p_stage_id and event_type='enter';
 if exists(select 1 from public.case_stage_events where case_id=p_case_id and stage_id=p_stage_id and event_type='complete')
  or (entry.id is null and sample.metadata#>array['report','tracking',p_stage_id,'completed']='true'::jsonb) then
  raise exception 'La etapa ya está finalizada.';
 end if;
 expected_action=case when entry.id is null then 'enter'
  when not exists(select 1 from public.case_stage_events where case_id=p_case_id and stage_id=p_stage_id and event_type='start') then 'start' else 'complete' end;
 if p_action<>expected_action then raise exception 'La etapa cambió. Actualice el registro antes de continuar.'; end if;
 if entry.id is not null and entry.station_id<>p_station_id then raise exception 'Inicie y finalice en la estación donde registró la entrada.'; end if;
 if scanned is not null and scanned<>p_case_id::text then
  select block->>'id',specimen->>'id' into verified_block,verified_specimen
  from jsonb_array_elements(case when jsonb_typeof(sample.metadata#>'{report,specimens}')='array' then sample.metadata#>'{report,specimens}' else '[]'::jsonb end) specimen,
   jsonb_array_elements(case when jsonb_typeof(specimen->'blocks')='array' then specimen->'blocks' else '[]'::jsonb end) block where block->>'id'=scanned limit 1;
 end if;
 if coalesce(config->'requireInternalQRScan',config->'requireStepQR','false'::jsonb)='true'::jsonb
  and scanned is distinct from p_case_id::text and verified_block is null then raise exception 'El QR no pertenece al caso ni a sus bloques guardados.'; end if;
 if scanned is distinct from p_case_id::text and verified_block is null then scanned=null; end if;
 select full_name into actor_name from public.profiles where id=actor;
 insert into public.case_stage_events(case_id,stage_id,event_type,station_id,station_code,station_name,actor_id,actor_name,scanned_code,block_id,specimen_id)
 values(p_case_id,p_stage_id,p_action,station.id,station.code,station.name,actor,actor_name,scanned,verified_block,verified_specimen);
 -- Does not validate/sign a diagnostic report, including completion of the last lab stage.
 update public.cases set current_stage=case_stages[position] where id=p_case_id;
 select coalesce(jsonb_agg(to_jsonb(event) order by recorded_at,id),'[]') into result_events from public.case_stage_events event where case_id=p_case_id;
 return jsonb_build_object('events',result_events,'currentStage',case_stages[position]);
end;
$$;
revoke all on function private.record_operational_stage(uuid,text,text,uuid,text) from public,anon,authenticated;
grant execute on function private.record_operational_stage(uuid,text,text,uuid,text) to authenticated;
create function public.record_operational_stage(p_case_id uuid,p_stage_id text,p_action text,p_station_id uuid,p_scanned_code text default null)
returns jsonb language sql security invoker set search_path='' as $$
 select private.record_operational_stage(p_case_id,p_stage_id,p_action,p_station_id,p_scanned_code);
$$;
revoke all on function public.record_operational_stage(uuid,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.record_operational_stage(uuid,text,text,uuid,text) to authenticated;
