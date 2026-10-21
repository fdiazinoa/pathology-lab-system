-- Run after the committed migrations, with an approved administrator in the test DB.
begin;
create function pg_temp.expect_failure(statement text, expected text) returns void language plpgsql as $$
declare failed boolean := false;
begin
 begin execute statement;
 exception when others then
  if position(expected in sqlerrm)=0 then raise exception 'Unexpected failure: % (expected %)',sqlerrm,expected; end if;
  failed=true;
 end;
 if not failed then raise exception 'FAIL: statement unexpectedly succeeded: %',statement; end if;
end;
$$;
select set_config('test.admin',(select id::text from public.profiles where role='admin' and is_active limit 1),true);
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('eeeeeeee-0000-4000-8000-000000000002','ops-writer@example.invalid',now(),'{"full_name":"Operador Uno"}'),
 ('eeeeeeee-0000-4000-8000-000000000003','ops-reader@example.invalid',now(),'{"full_name":"Lector"}'),
 ('eeeeeeee-0000-4000-8000-000000000004','ops-other@example.invalid',now(),'{"full_name":"Operador Dos"}'),
 ('eeeeeeee-0000-4000-8000-000000000005','ops-blind@example.invalid',now(),'{"full_name":"Sin permiso operativo"}');
set local role authenticated;
insert into public.app_roles(id,name,permissions) values
 ('ops-writer','Operational writer','{"cases":{"read":true},"processing":{"read":true,"edit":true}}'),
 ('ops-reader','Operational reader','{"cases":{"read":true},"processing":{"read":true}}'),
 ('ops-blind','No operational read','{"cases":{"read":true}}');
select public.admit_lab_user('eeeeeeee-0000-4000-8000-000000000002','ops-writer');
select public.admit_lab_user('eeeeeeee-0000-4000-8000-000000000003','ops-reader');
select public.admit_lab_user('eeeeeeee-0000-4000-8000-000000000004','ops-writer');
select public.admit_lab_user('eeeeeeee-0000-4000-8000-000000000005','ops-blind');
update public.lab_info set settings=settings || '{"enableOperationalWorkflow":false}';
insert into public.patients(id,full_name,age,sex) values('eeeeeeee-0000-4000-8000-000000000010','Synthetic workflow patient',10,'F');
insert into public.cases(id,patient_id,type,metadata) values
 ('eeeeeeee-0000-4000-8000-000000000011','eeeeeeee-0000-4000-8000-000000000010','Biopsia','{"report":{"specimens":[{"id":"specimen-ops","blocks":[{"id":"block-ops"}]}]}}'),
 ('eeeeeeee-0000-4000-8000-000000000012','eeeeeeee-0000-4000-8000-000000000010','Biopsia','{"report":{"tracking":{"reception":{"completed":true,"timestamp":"2026-10-01T12:00:00Z","user":"Registro anterior"}}}}');
insert into public.workflow_stations(id,code,name) values
 ('eeeeeeee-0000-4000-8000-000000000021','TEST-01','Estación de prueba 1'),
 ('eeeeeeee-0000-4000-8000-000000000022','TEST-02','Estación de prueba 2');
insert into public.workflow_stations(id,code,name,is_active) values('eeeeeeee-0000-4000-8000-000000000023','OFF-01','Estación inactiva',false);
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','enter','eeeeeeee-0000-4000-8000-000000000021')$q$,'desactivado');
update public.lab_info set settings=settings || '{"enableOperationalWorkflow":true,"requireInternalQRScan":true}';
update public.cases set metadata=jsonb_set(metadata,'{report,tracking}','null') where id='eeeeeeee-0000-4000-8000-000000000011';
select pg_temp.expect_failure($q$insert into public.cases(patient_id,type,metadata) values('eeeeeeee-0000-4000-8000-000000000010','Biopsia','{"report":{"tracking":{"reception":{"completed":true}}}}')$q$,'históricas');
select set_config('request.jwt.claim.sub','eeeeeeee-0000-4000-8000-000000000002',true);
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','unknown','enter','eeeeeeee-0000-4000-8000-000000000021')$q$,'inválida');
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','enter','eeeeeeee-0000-4000-8000-000000000023','block-ops')$q$,'estación activa');
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','macroscopy','enter','eeeeeeee-0000-4000-8000-000000000021','block-ops')$q$,'anteriores');
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','start','eeeeeeee-0000-4000-8000-000000000021','block-ops')$q$,'etapa cambió');
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','enter','eeeeeeee-0000-4000-8000-000000000021','block-other-case')$q$,'QR');
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','enter','eeeeeeee-0000-4000-8000-000000000099','block-ops')$q$,'estación activa');
select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','enter','eeeeeeee-0000-4000-8000-000000000021','block-ops');
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','enter','eeeeeeee-0000-4000-8000-000000000021','block-ops')$q$,'etapa cambió');
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','complete','eeeeeeee-0000-4000-8000-000000000021','block-ops')$q$,'etapa cambió');
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','start','eeeeeeee-0000-4000-8000-000000000022','block-ops')$q$,'donde registró');
select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','start','eeeeeeee-0000-4000-8000-000000000021','block-ops');
select set_config('request.jwt.claim.sub','eeeeeeee-0000-4000-8000-000000000004',true);
select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','complete','eeeeeeee-0000-4000-8000-000000000021','eeeeeeee-0000-4000-8000-000000000011');
do $$ begin
 if (select count(*) from public.case_stage_events where case_id='eeeeeeee-0000-4000-8000-000000000011')<>3 then raise exception 'FAIL event count'; end if;
 if not exists(select 1 from public.case_stage_events where event_type='start' and actor_id='eeeeeeee-0000-4000-8000-000000000002' and actor_name='Operador Uno' and station_code='TEST-01' and block_id='block-ops') then raise exception 'FAIL responsibility, station or QR'; end if;
 if not exists(select 1 from public.case_stage_events where event_type='complete' and actor_name='Operador Dos') then raise exception 'FAIL final actor'; end if;
 if exists(select 1 from public.case_stage_events where case_id='eeeeeeee-0000-4000-8000-000000000011' and (recorded_at>clock_timestamp() or recorded_at<transaction_timestamp())) then raise exception 'FAIL server timestamps'; end if;
 if not exists(select 1 from public.cases where id='eeeeeeee-0000-4000-8000-000000000011' and status='Borrador') then raise exception 'FAIL report must remain a draft'; end if;
end $$;
select pg_temp.expect_failure($q$update public.case_stage_events set actor_name='Spoof'$q$,'permission denied');
select pg_temp.expect_failure($q$delete from public.case_stage_events$q$,'permission denied');
select pg_temp.expect_failure($q$insert into public.case_stage_events select * from public.case_stage_events limit 1$q$,'permission denied');
select pg_temp.expect_failure($q$update public.cases set current_stage='microscopia' where id='eeeeeeee-0000-4000-8000-000000000011'$q$,'registro operativo');
select pg_temp.expect_failure($q$update public.cases set metadata=jsonb_set(metadata,'{report,tracking}','{"macroscopy":{"completed":true}}') where id='eeeeeeee-0000-4000-8000-000000000011'$q$,'registro operativo');
select pg_temp.expect_failure($q$insert into public.workflow_stations(code,name) values('FAKE','Sin permiso')$q$,'row-level security');
do $$ declare stage text; begin
 foreach stage in array array['macroscopy','processing','microtomy','staining','microscopy','diagnosis','validation'] loop
  perform public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011',stage,'enter','eeeeeeee-0000-4000-8000-000000000021','block-ops');
  perform public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011',stage,'start','eeeeeeee-0000-4000-8000-000000000021','block-ops');
  perform public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011',stage,'complete','eeeeeeee-0000-4000-8000-000000000021','block-ops');
 end loop;
 if (select count(*) from public.case_stage_events where case_id='eeeeeeee-0000-4000-8000-000000000011')<>24 then raise exception 'FAIL all stages'; end if;
 if not exists(select 1 from public.cases where id='eeeeeeee-0000-4000-8000-000000000011' and status='Borrador' and current_stage='por_firmar') then raise exception 'FAIL operational completion must not validate report'; end if;
end $$;

-- Historic completion is accepted as historic; no entry/start events are manufactured.
select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000012','macroscopy','enter','eeeeeeee-0000-4000-8000-000000000021','eeeeeeee-0000-4000-8000-000000000012');
do $$ begin
 if (select count(*) from public.case_stage_events where case_id='eeeeeeee-0000-4000-8000-000000000012')<>1 then raise exception 'FAIL fabricated legacy events'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
update public.cases set status='Cancelado' where id='eeeeeeee-0000-4000-8000-000000000012';
select set_config('request.jwt.claim.sub','eeeeeeee-0000-4000-8000-000000000002',true);
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000012','macroscopy','start','eeeeeeee-0000-4000-8000-000000000021','eeeeeeee-0000-4000-8000-000000000012')$q$,'cerrado');
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
update public.cases set status='Borrador' where id='eeeeeeee-0000-4000-8000-000000000012';
update public.app_roles set permissions='{"cases":{"read":true},"processing":{"read":true}}' where id='ops-writer';
select set_config('request.jwt.claim.sub','eeeeeeee-0000-4000-8000-000000000002',true);
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000012','macroscopy','start','eeeeeeee-0000-4000-8000-000000000021','eeeeeeee-0000-4000-8000-000000000012')$q$,'No tiene permiso');
select set_config('request.jwt.claim.sub','eeeeeeee-0000-4000-8000-000000000003',true);
do $$ begin if (select count(*) from public.case_stage_events where case_id in ('eeeeeeee-0000-4000-8000-000000000011','eeeeeeee-0000-4000-8000-000000000012'))<>25 then raise exception 'FAIL authorized reader'; end if; end $$;
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000012','macroscopy','start','eeeeeeee-0000-4000-8000-000000000021')$q$,'No tiene permiso');
select set_config('request.jwt.claim.sub','eeeeeeee-0000-4000-8000-000000000005',true);
do $$ begin if exists(select 1 from public.case_stage_events) or exists(select 1 from public.workflow_stations) then raise exception 'FAIL unauthorized read'; end if; end $$;
set local role anon;
select pg_temp.expect_failure($q$select * from public.case_stage_events$q$,'permission denied');
select pg_temp.expect_failure($q$select public.record_operational_stage('eeeeeeee-0000-4000-8000-000000000011','reception','enter','eeeeeeee-0000-4000-8000-000000000021')$q$,'permission denied');
rollback;
select 'PASS: operational lifecycle, real actors/stations/server times, QR, sequence, immutable events, live permissions and legacy compatibility' as result;
