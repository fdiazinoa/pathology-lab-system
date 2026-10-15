begin;
-- Synthetic principals and roles are removed by the final ROLLBACK.
insert into auth.users(id,email,email_confirmed_at) values ('aaaaaaaa-0000-4000-8000-000000000001','rls-readonly@example.invalid',now()),('aaaaaaaa-0000-4000-8000-000000000002','rls-importer@example.invalid',now());
insert into public.app_roles(id,name,permissions) values
 ('rls-test-reader','RLS test reader','{"doctors":{"read":true},"roles":{"read":true}}'),
 ('rls-test-importer','RLS test importer','{"templates":{"read":true,"import":true}}');
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='admin' and is_active limit 1),true);
set local role authenticated;
select public.admit_lab_user('aaaaaaaa-0000-4000-8000-000000000001','rls-test-reader');
select public.admit_lab_user('aaaaaaaa-0000-4000-8000-000000000002','rls-test-importer');
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-4000-8000-000000000001',true);
do $$
declare affected integer;
begin
 if not public.has_app_permission('doctors','read') then raise exception 'FAIL read'; end if;
 if public.has_app_permission('doctors','edit') or public.has_app_permission('reports','validate') or public.has_app_permission('roles','edit') then raise exception 'FAIL implicit grant'; end if;
 perform 1 from public.doctors limit 1;
 update public.doctors set name=name;
 get diagnostics affected=row_count;
 if affected <> 0 then raise exception 'FAIL readonly update'; end if;
 delete from public.doctors;
 get diagnostics affected=row_count;
 if affected <> 0 then raise exception 'FAIL readonly delete'; end if;
 begin
  insert into public.app_roles(id,name,permissions) values ('rls-escalate','Escalate','{}');
  raise exception 'FAIL role create allowed';
 exception when insufficient_privilege then null; end;
 begin
  truncate public.app_roles;
  raise exception 'FAIL truncate allowed';
 exception when insufficient_privilege then null; end;
 update public.profiles set permission_role_id='1' where id=auth.uid();
 get diagnostics affected=row_count;
 if affected <> 0 then raise exception 'FAIL self escalation'; end if;
 if (select count(*) from public.profiles) <> 1 then raise exception 'FAIL profiles isolation'; end if;
end $$;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-4000-8000-000000000002',true);
do $$
begin
 if not public.has_app_permission('templates','import') or public.has_app_permission('templates','assign') then raise exception 'FAIL template rights'; end if;
 -- Same value is safe; changing unrelated identity or groups must fail in the trigger.
 update public.lab_info set settings=jsonb_set(settings,'{resultTemplates}',coalesce(settings->'resultTemplates','[]'));
 begin
  update public.lab_info set name=name || ' forbidden';
  raise exception 'FAIL settings editing allowed';
 exception when raise_exception then if sqlerrm='FAIL settings editing allowed' then raise; end if; end;
 begin
  update public.lab_info set settings=jsonb_set(settings,'{resultTemplateExamGroups}','{}');
  raise exception 'FAIL group assignment allowed';
 exception when raise_exception then if sqlerrm='FAIL group assignment allowed' then raise; end if; end;
end $$;
reset role;
-- Revocation is effective on the next database check, without refreshing a session.
update public.app_roles set permissions='{}' where id='rls-test-reader';
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-4000-8000-000000000001',true);
do $$ begin if public.has_app_permission('doctors','read') then raise exception 'FAIL stale permissions'; end if; end $$;
reset role;
-- Explicitly granted catalogue actions work, and changes remain rolled back.
update public.app_roles set permissions='{"doctors":{"read":true,"create":true,"edit":true,"delete":true}}' where id='rls-test-reader';
set local role authenticated;
do $$
declare inserted_id text; affected integer;
begin
 insert into public.doctors(name) values ('Synthetic authorization test') returning id into inserted_id;
 update public.doctors set name='Synthetic updated' where id=inserted_id;
 get diagnostics affected=row_count;
 if affected <> 1 then raise exception 'FAIL allowed update'; end if;
 delete from public.doctors where id=inserted_id;
 get diagnostics affected=row_count;
 if affected <> 1 then raise exception 'FAIL allowed delete'; end if;
end $$;
reset role;
-- Use the existing administrator only for rolled-back denial checks.
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='admin' and is_active limit 1),true);
set local role authenticated;
do $$
begin
 if not public.has_app_permission('roles','edit') then raise exception 'FAIL admin compatibility'; end if;
 begin
  update public.app_roles set permissions='{}' where id='1';
  raise exception 'FAIL protected admin role';
 exception when raise_exception then if sqlerrm='FAIL protected admin role' then raise; end if; end;
 begin
  update public.profiles set is_active=false where id=auth.uid();
  raise exception 'FAIL last administrator';
 exception when raise_exception then if sqlerrm='FAIL last administrator' then raise; end if; end;
 begin
  insert into public.app_roles(id,name,permissions) values ('rls-invalid','Invalid','{"reports":{"read":true,"sign":"true"}}');
  raise exception 'FAIL malformed permissions';
 exception when raise_exception then if sqlerrm='FAIL malformed permissions' then raise; end if; end;
end $$;
rollback;
select 'PASS: read/write isolation, self escalation, truncate denial, template actions, revocation, protected administrator and payload validation' as result;
