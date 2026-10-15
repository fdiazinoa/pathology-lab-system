begin;
-- Test-only principals: the final rollback removes every fixture and audit entry.
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('bbbbbbbb-0000-4000-8000-000000000001','pending-confirmed@example.invalid',now(),'{"full_name":"Pending test","role":"admin","is_active":true,"permission_role_id":"1"}'),
 ('bbbbbbbb-0000-4000-8000-000000000002','pending-unconfirmed@example.invalid',null,'{}');
do $$ begin
 if (select count(*) from public.profiles where id in ('bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002') and role='viewer' and not is_active and permission_role_id is null) <> 2 then raise exception 'FAIL automatic pending provisioning'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000001',true);
do $$ begin
 if public.has_app_permission('cases','read') or public.has_app_permission('users','assignRole') then raise exception 'FAIL pending account access'; end if;
 if (select count(*) from public.list_lab_users()) <> 1 then raise exception 'FAIL directory isolation'; end if;
 begin
  perform public.admit_lab_user('bbbbbbbb-0000-4000-8000-000000000001','1');
  raise exception 'FAIL self admission allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='admin' and is_active limit 1),true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.list_lab_users() item where item->>'email'='pending-confirmed@example.invalid' and item->>'email_confirmed'='true') then raise exception 'FAIL admin directory'; end if;
 begin
  perform public.admit_lab_user('bbbbbbbb-0000-4000-8000-000000000001','nonexistent-role');
  raise exception 'FAIL invalid role accepted';
 exception when raise_exception then if sqlerrm='FAIL invalid role accepted' then raise; end if; end;
 begin
  perform public.admit_lab_user('bbbbbbbb-0000-4000-8000-000000000002','3');
  raise exception 'FAIL unconfirmed account admitted';
 exception when raise_exception then if sqlerrm='FAIL unconfirmed account admitted' then raise; end if; end;
 begin
  update public.profiles set is_active=true where id='bbbbbbbb-0000-4000-8000-000000000001';
  raise exception 'FAIL activation without admission';
 exception when raise_exception then if sqlerrm='FAIL activation without admission' then raise; end if; end;
 perform public.admit_lab_user('bbbbbbbb-0000-4000-8000-000000000001','3');
 if not exists(select 1 from public.profiles where id='bbbbbbbb-0000-4000-8000-000000000001' and is_active and role='technician' and permission_role_id='3') then raise exception 'FAIL admission'; end if;
 if not exists(select 1 from public.permission_audit_log where target='bbbbbbbb-0000-4000-8000-000000000001' and actor=auth.uid() and changes->'after'->>'permission_role_id'='3') then raise exception 'FAIL admission audit'; end if;
 begin
  perform public.admit_lab_user('bbbbbbbb-0000-4000-8000-000000000001','2');
  raise exception 'FAIL duplicate admission';
 exception when raise_exception then if sqlerrm='FAIL duplicate admission' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-4000-8000-000000000001',true);
do $$ begin
 if not public.has_app_permission('cases','create') or public.has_app_permission('reports','sign') then raise exception 'FAIL chosen role permissions'; end if;
 if (select count(*) from public.list_lab_users()) <> 1 then raise exception 'FAIL admitted directory isolation'; end if;
end $$;
rollback;
select 'PASS: pending provisioning, metadata ignored, directory isolation, admission allow/deny, confirmed email, explicit role, audit and chosen permissions' as result;
