begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('dddddddd-0000-4000-8000-000000000001','case-writer@example.invalid',now()),
 ('dddddddd-0000-4000-8000-000000000002','case-reader@example.invalid',now());
insert into public.app_roles(id,name,permissions) values
 ('rls-case-writer','Case writer','{"cases":{"read":true,"create":true,"edit":true},"reception":{"read":true,"create":true},"patients":{"read":true,"create":true}}'),
 ('rls-case-reader','Case reader','{"cases":{"read":true},"patients":{"read":true}}');
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='admin' and is_active limit 1),true);
set local role authenticated;
select public.admit_lab_user('dddddddd-0000-4000-8000-000000000001','rls-case-writer');
select public.admit_lab_user('dddddddd-0000-4000-8000-000000000002','rls-case-reader');
select set_config('request.jwt.claim.sub','dddddddd-0000-4000-8000-000000000001',true);
insert into public.patients(id,full_name,age,sex) values('dddddddd-0000-4000-8000-000000000003','Synthetic reception patient',10,'F');
insert into public.cases(id,patient_id,type,metadata) values('dddddddd-0000-4000-8000-000000000004','dddddddd-0000-4000-8000-000000000003','Biopsia','{"report":{"source":"reception","receptionStatus":"pending","doctorId":"doctor-test","originCenter":"Synthetic center","clinicalData":"Synthetic only"}}');
do $$ begin
 if not exists(select 1 from public.cases where id='dddddddd-0000-4000-8000-000000000004' and case_number like 'C-%' and metadata#>>'{report,doctorId}'='doctor-test') then raise exception 'FAIL persisted receipt'; end if;
 update public.cases set type='Biopsia de piel', organ='PIEL', metadata=jsonb_set(metadata,'{report,receptionStatus}','"in_progress"') where id='dddddddd-0000-4000-8000-000000000004';
 if not exists(select 1 from public.cases where id='dddddddd-0000-4000-8000-000000000004' and type='Biopsia de piel' and metadata#>>'{report,receptionStatus}'='in_progress' and metadata#>>'{report,originCenter}'='Synthetic center') then raise exception 'FAIL continuation persistence'; end if;
 begin update public.cases set metadata=jsonb_set(metadata,'{report,diagnosis}','"Unauthorized"') where id='dddddddd-0000-4000-8000-000000000004'; raise exception 'FAIL clinical privilege escalation'; exception when raise_exception then if sqlerrm='FAIL clinical privilege escalation' then raise; end if; end;
 begin update public.cases set status='Finalizado',diagnosis='Unauthorized' where id='dddddddd-0000-4000-8000-000000000004'; raise exception 'FAIL unauthorized validation'; exception when raise_exception then if sqlerrm='FAIL unauthorized validation' then raise; end if; end;
 begin update public.cases set patient_id=gen_random_uuid() where id='dddddddd-0000-4000-8000-000000000004'; raise exception 'FAIL mutable case patient'; exception when raise_exception then if sqlerrm='FAIL mutable case patient' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','dddddddd-0000-4000-8000-000000000002',true);
do $$ begin
 if not exists(select 1 from public.cases where id='dddddddd-0000-4000-8000-000000000004') then raise exception 'FAIL permitted read'; end if;
 begin update public.cases set organ='Unauthorized' where id='dddddddd-0000-4000-8000-000000000004'; raise exception 'FAIL reader write'; exception when raise_exception then if sqlerrm='FAIL reader write' then raise; end if; end;
 begin insert into public.cases(patient_id,type) values('dddddddd-0000-4000-8000-000000000003','Unauthorized'); raise exception 'FAIL reader insert'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from public.case_change_log where case_id='dddddddd-0000-4000-8000-000000000004' and operation='UPDATE') then raise exception 'FAIL immutable server audit'; end if;
end $$;
set local role anon;
do $$ begin
 begin perform 1 from public.cases; raise exception 'FAIL anonymous access'; exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: reception persistence, continuation, stable identity, reader and anonymous denial, clinical permissions, immutable audit' as result;
