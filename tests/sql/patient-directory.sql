begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('cccccccc-0000-4000-8000-000000000001','patient-writer@example.invalid',now()),
 ('cccccccc-0000-4000-8000-000000000002','patient-reader@example.invalid',now());
insert into public.app_roles(id,name,permissions) values
 ('rls-patient-writer','Patient test writer','{"patients":{"read":true,"create":true,"edit":true}}'),
 ('rls-patient-reader','Patient test reader','{"patients":{"read":true}}');
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='admin' and is_active limit 1),true);
set local role authenticated;
select public.admit_lab_user('cccccccc-0000-4000-8000-000000000001','rls-patient-writer');
select public.admit_lab_user('cccccccc-0000-4000-8000-000000000002','rls-patient-reader');
select set_config('request.jwt.claim.sub','cccccccc-0000-4000-8000-000000000001',true);
do $$ declare patient uuid; begin
 insert into public.patients(full_name,age,identification_number,sex,medical_history) values('Synthetic patient test',20,'TEST-RLS-123','F','Synthetic only') returning id into patient;
 if patient is null then raise exception 'FAIL persisted identity'; end if;
 update public.patients set full_name='Synthetic corrected',age=21,identification_number='TEST-RLS-456',sex='M',city='Test city',region='Test province',contact_phone='000',medical_history='Updated synthetic only' where id=patient;
 if not exists(select 1 from public.patients where id=patient and full_name='Synthetic corrected' and age=21 and identification_number='TEST-RLS-456' and sex='M' and city='Test city' and region='Test province' and medical_history='Updated synthetic only') then raise exception 'FAIL correction persistence'; end if;
 begin
  insert into public.patients(full_name,age,identification_number,sex) values('Duplicate synthetic',12,'test rls 456','F');
  raise exception 'FAIL duplicate document';
 exception when unique_violation then null; end;
 begin
  update public.patients set birth_date=current_date+1 where id=patient;
  raise exception 'FAIL future birth date accepted';
 exception when check_violation then null; end;
 begin
  update public.patients set id=gen_random_uuid() where id=patient;
  raise exception 'FAIL mutable patient identity';
 exception when raise_exception then if sqlerrm='FAIL mutable patient identity' then raise; end if; end;
 begin
  delete from public.patients where id=patient;
  raise exception 'FAIL unauthorized deletion';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','cccccccc-0000-4000-8000-000000000002',true);
do $$ declare affected integer; begin
 if not exists(select 1 from public.patients where identification_number='TEST-RLS-456') then raise exception 'FAIL permitted read'; end if;
 update public.patients set full_name='Unauthorized' where identification_number='TEST-RLS-456';
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'FAIL readonly update'; end if;
 begin
  insert into public.patients(full_name,age,sex) values('Unauthorized',12,'F');
  raise exception 'FAIL readonly creation';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from public.patient_change_log where actor='cccccccc-0000-4000-8000-000000000001' and operation='UPDATE' and changed_fields @> array['full_name','identification_number','age','sex']) then raise exception 'FAIL correction audit'; end if;
end $$;
set local role anon;
do $$ begin
 begin perform 1 from public.patients; raise exception 'FAIL anonymous patient access'; exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: patient creation, identity, correction persistence, normalized uniqueness, immutable ID, read-only and anonymous denial, audit' as result;
