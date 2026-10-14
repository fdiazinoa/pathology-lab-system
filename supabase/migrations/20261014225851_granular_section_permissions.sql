-- Granular authorization: trusted profile -> assigned role -> explicit section/action.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create table public.permission_catalog (section text not null, action text not null, primary key (section, action));
alter table public.permission_catalog enable row level security;
revoke all on public.permission_catalog from public, anon, authenticated;
create table public.app_roles (
 id text primary key default gen_random_uuid()::text,
 name text not null check(length(trim(name)) between 1 and 100),
 description text not null default '',
 permissions jsonb not null default '{}'::jsonb,
 is_system boolean not null default false,
 is_active boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.app_roles enable row level security;
revoke all on public.app_roles from public, anon;
grant select, insert, update, delete on public.app_roles to authenticated;
insert into public.permission_catalog(section,action) values
('dashboard','read'),
('patients','read'),
('patients','create'),
('patients','edit'),
('cases','read'),
('cases','create'),
('cases','edit'),
('cases','delete'),
('reception','read'),
('reception','create'),
('reception','edit'),
('processing','read'),
('processing','edit'),
('macroscopy','read'),
('macroscopy','edit'),
('microscopy','read'),
('microscopy','edit'),
('ihc','read'),
('ihc','edit'),
('images','read'),
('images','upload'),
('images','edit'),
('images','delete'),
('images','analyze'),
('templates','read'),
('templates','use'),
('templates','import'),
('templates','assign'),
('reports','read'),
('reports','edit'),
('reports','validate'),
('reports','sign'),
('reports','reopen'),
('reports','print'),
('dispatch','read'),
('dispatch','dispatch'),
('logistics','read'),
('logistics','create'),
('logistics','edit'),
('logistics','deliver'),
('collaboration','read'),
('collaboration','edit'),
('centers','read'),
('centers','create'),
('centers','edit'),
('centers','delete'),
('doctors','read'),
('doctors','create'),
('doctors','edit'),
('doctors','delete'),
('organs','read'),
('organs','create'),
('organs','edit'),
('organs','delete'),
('exams','read'),
('exams','create'),
('exams','edit'),
('exams','delete'),
('insurers','read'),
('insurers','create'),
('insurers','edit'),
('insurers','delete'),
('equipment','read'),
('equipment','create'),
('equipment','edit'),
('equipment','delete'),
('financials','read'),
('settings','read'),
('settings','edit'),
('users','read'),
('users','create'),
('users','edit'),
('users','assignRole'),
('users','deactivate'),
('roles','read'),
('roles','create'),
('roles','edit'),
('roles','delete'),
('audit','read'),
('system','read'),
('system','edit'),
('help','read');
insert into public.app_roles(id,name,description,permissions,is_system) values
('1','Administrador','Administrador','{"dashboard": {"read": true}, "patients": {"read": true, "create": true, "edit": true}, "cases": {"read": true, "create": true, "edit": true, "delete": true}, "reception": {"read": true, "create": true, "edit": true}, "processing": {"read": true, "edit": true}, "macroscopy": {"read": true, "edit": true}, "microscopy": {"read": true, "edit": true}, "ihc": {"read": true, "edit": true}, "images": {"read": true, "upload": true, "edit": true, "delete": true, "analyze": true}, "templates": {"read": true, "use": true, "import": true, "assign": true}, "reports": {"read": true, "edit": true, "validate": true, "sign": true, "reopen": true, "print": true}, "dispatch": {"read": true, "dispatch": true}, "logistics": {"read": true, "create": true, "edit": true, "deliver": true}, "collaboration": {"read": true, "edit": true}, "centers": {"read": true, "create": true, "edit": true, "delete": true}, "doctors": {"read": true, "create": true, "edit": true, "delete": true}, "organs": {"read": true, "create": true, "edit": true, "delete": true}, "exams": {"read": true, "create": true, "edit": true, "delete": true}, "insurers": {"read": true, "create": true, "edit": true, "delete": true}, "equipment": {"read": true, "create": true, "edit": true, "delete": true}, "financials": {"read": true}, "settings": {"read": true, "edit": true}, "users": {"read": true, "create": true, "edit": true, "assignRole": true, "deactivate": true}, "roles": {"read": true, "create": true, "edit": true, "delete": true}, "audit": {"read": true}, "system": {"read": true, "edit": true}, "help": {"read": true}}'::jsonb,true),
('2','Patólogo','Patólogo','{"dashboard": {"read": true}, "patients": {"read": true, "create": false, "edit": false}, "cases": {"read": true, "create": true, "edit": true, "delete": false}, "reception": {"read": false, "create": false, "edit": false}, "processing": {"read": true, "edit": false}, "macroscopy": {"read": true, "edit": true}, "microscopy": {"read": true, "edit": true}, "ihc": {"read": true, "edit": true}, "images": {"read": true, "upload": true, "edit": true, "delete": true, "analyze": true}, "templates": {"read": true, "use": true, "import": false, "assign": false}, "reports": {"read": true, "edit": true, "validate": true, "sign": true, "reopen": true, "print": true}, "dispatch": {"read": false, "dispatch": false}, "logistics": {"read": false, "create": false, "edit": false, "deliver": false}, "collaboration": {"read": true, "edit": true}, "centers": {"read": true, "create": false, "edit": false, "delete": false}, "doctors": {"read": true, "create": false, "edit": false, "delete": false}, "organs": {"read": true, "create": false, "edit": false, "delete": false}, "exams": {"read": true, "create": false, "edit": false, "delete": false}, "insurers": {"read": true, "create": false, "edit": false, "delete": false}, "equipment": {"read": false, "create": false, "edit": false, "delete": false}, "financials": {"read": false}, "settings": {"read": false, "edit": false}, "users": {"read": false, "create": false, "edit": false, "assignRole": false, "deactivate": false}, "roles": {"read": false, "create": false, "edit": false, "delete": false}, "audit": {"read": false}, "system": {"read": false, "edit": false}, "help": {"read": true}}'::jsonb,true),
('3','Técnico','Técnico','{"dashboard": {"read": true}, "patients": {"read": true, "create": true, "edit": true}, "cases": {"read": true, "create": true, "edit": true, "delete": false}, "reception": {"read": true, "create": true, "edit": true}, "processing": {"read": true, "edit": true}, "macroscopy": {"read": true, "edit": true}, "microscopy": {"read": false, "edit": false}, "ihc": {"read": false, "edit": false}, "images": {"read": true, "upload": true, "edit": false, "delete": false, "analyze": false}, "templates": {"read": true, "use": false, "import": false, "assign": false}, "reports": {"read": false, "edit": false, "validate": false, "sign": false, "reopen": false, "print": false}, "dispatch": {"read": false, "dispatch": false}, "logistics": {"read": false, "create": false, "edit": false, "deliver": false}, "collaboration": {"read": false, "edit": false}, "centers": {"read": true, "create": false, "edit": false, "delete": false}, "doctors": {"read": true, "create": false, "edit": false, "delete": false}, "organs": {"read": true, "create": false, "edit": false, "delete": false}, "exams": {"read": true, "create": false, "edit": false, "delete": false}, "insurers": {"read": true, "create": false, "edit": false, "delete": false}, "equipment": {"read": false, "create": false, "edit": false, "delete": false}, "financials": {"read": false}, "settings": {"read": false, "edit": false}, "users": {"read": false, "create": false, "edit": false, "assignRole": false, "deactivate": false}, "roles": {"read": false, "create": false, "edit": false, "delete": false}, "audit": {"read": false}, "system": {"read": false, "edit": false}, "help": {"read": true}}'::jsonb,true),
('4','Repartidor','Repartidor','{"dashboard": {"read": true}, "patients": {"read": false, "create": false, "edit": false}, "cases": {"read": false, "create": false, "edit": false, "delete": false}, "reception": {"read": false, "create": false, "edit": false}, "processing": {"read": false, "edit": false}, "macroscopy": {"read": false, "edit": false}, "microscopy": {"read": false, "edit": false}, "ihc": {"read": false, "edit": false}, "images": {"read": false, "upload": false, "edit": false, "delete": false, "analyze": false}, "templates": {"read": false, "use": false, "import": false, "assign": false}, "reports": {"read": true, "edit": false, "validate": false, "sign": false, "reopen": false, "print": true}, "dispatch": {"read": true, "dispatch": true}, "logistics": {"read": true, "create": true, "edit": true, "deliver": true}, "collaboration": {"read": false, "edit": false}, "centers": {"read": false, "create": false, "edit": false, "delete": false}, "doctors": {"read": false, "create": false, "edit": false, "delete": false}, "organs": {"read": false, "create": false, "edit": false, "delete": false}, "exams": {"read": false, "create": false, "edit": false, "delete": false}, "insurers": {"read": false, "create": false, "edit": false, "delete": false}, "equipment": {"read": false, "create": false, "edit": false, "delete": false}, "financials": {"read": false}, "settings": {"read": false, "edit": false}, "users": {"read": false, "create": false, "edit": false, "assignRole": false, "deactivate": false}, "roles": {"read": false, "create": false, "edit": false, "delete": false}, "audit": {"read": false}, "system": {"read": false, "edit": false}, "help": {"read": true}}'::jsonb,true);
alter table public.profiles add column permission_role_id text references public.app_roles(id);
create index profiles_permission_role_idx on public.profiles(permission_role_id);
create or replace function private.has_permission(section_name text, action_name text)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (
  select 1 from public.profiles p
  join public.app_roles r on r.id = coalesce(p.permission_role_id, case p.role when 'admin' then '1' when 'pathologist' then '2' when 'technician' then '3' when 'courier' then '4' end)
  join public.permission_catalog c on c.section = section_name and c.action = action_name
  where p.id = auth.uid() and p.is_active is true and p.role in ('admin','pathologist','technician','courier') and r.is_active
  and (p.role = 'admin' or (r.permissions -> section_name -> 'read' = 'true'::jsonb and r.permissions -> section_name -> action_name = 'true'::jsonb))
 );
$$;
revoke all on function private.has_permission(text,text) from public, anon;
grant execute on function private.has_permission(text,text) to authenticated;
create or replace function public.has_app_permission(section_name text, action_name text)
returns boolean language sql stable security invoker set search_path = '' as $$ select private.has_permission(section_name, action_name); $$;
revoke all on function public.has_app_permission(text,text) from public, anon;
grant execute on function public.has_app_permission(text,text) to authenticated;

create policy roles_read on public.app_roles for select to authenticated using (
 private.has_permission('roles','read') or private.has_permission('users','read') or id = (
 select coalesce(p.permission_role_id, case p.role when 'admin' then '1' when 'pathologist' then '2' when 'technician' then '3' when 'courier' then '4' end) from public.profiles p where p.id = (select auth.uid()) and p.is_active
 ));
create policy roles_create on public.app_roles for insert to authenticated with check(private.has_permission('roles','create'));
create policy roles_edit on public.app_roles for update to authenticated using(private.has_permission('roles','edit')) with check(private.has_permission('roles','edit'));
create policy roles_delete on public.app_roles for delete to authenticated using(private.has_permission('roles','delete'));

create function private.protect_role() returns trigger language plpgsql set search_path = '' as $$
declare s record; a record;
begin
 if tg_op = 'DELETE' then
  if old.is_system then raise exception 'No puede eliminar un rol del sistema.'; end if;
  return old;
 end if;
 if (tg_op = 'INSERT' and (new.id in ('1','2','3','4') or new.is_system)) or
    (tg_op = 'UPDATE' and (old.id = '1' or new.id <> old.id or new.is_system <> old.is_system)) then
  raise exception 'El rol del sistema está protegido.';
 end if;
 if jsonb_typeof(new.permissions) <> 'object' then raise exception 'Permisos inválidos.'; end if;
 for s in select * from jsonb_each(new.permissions) loop
  if jsonb_typeof(s.value) <> 'object' or not exists(select 1 from public.permission_catalog c where c.section=s.key) then raise exception 'Sección inválida: %',s.key; end if;
  for a in select * from jsonb_each(s.value) loop
   if jsonb_typeof(a.value) <> 'boolean' or not exists(select 1 from public.permission_catalog c where c.section=s.key and c.action=a.key) then raise exception 'Acción inválida: %.%',s.key,a.key; end if;
   if a.key <> 'read' and a.value = 'true'::jsonb and (s.value -> 'read') is distinct from 'true'::jsonb then raise exception 'Active Ver antes de conceder acciones.'; end if;
  end loop;
 end loop;
 new.updated_at=now(); return new;
end;
$$;
-- Validation needs the private catalogue, which is intentionally inaccessible to browser roles.
alter function private.protect_role() security definer;
revoke all on function private.protect_role() from public, anon, authenticated;
create trigger protect_role before insert or update or delete on public.app_roles for each row execute function private.protect_role();

-- Exact-column checks prevent an editor from changing a role or status incidentally.
create function private.protect_profile() returns trigger language plpgsql security definer set search_path = '' as $$
declare admin_actor boolean;
begin
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_active) into admin_actor;
 if new.id <> old.id or new.created_at is distinct from old.created_at then raise exception 'Identidad protegida.'; end if;
 if new.permission_role_id is distinct from old.permission_role_id and not private.has_permission('users','assignRole') then raise exception 'No puede asignar roles.'; end if;
 if new.is_active is distinct from old.is_active and not private.has_permission('users','deactivate') then raise exception 'No puede cambiar el estado del usuario.'; end if;
 if (new.full_name is distinct from old.full_name or new.avatar_url is distinct from old.avatar_url) and not private.has_permission('users','edit') then raise exception 'No puede editar usuarios.'; end if;
 if new.role is distinct from old.role and not admin_actor then raise exception 'Solo un administrador puede autorizar el acceso inicial.'; end if;
 if new.permission_role_id = '1' and new.role <> 'admin' then raise exception 'El rol administrador requiere autorización administrativa.'; end if;
 if old.role='admin' and old.is_active and (new.role <> 'admin' or not new.is_active) then
  perform pg_advisory_xact_lock(7312048);
  if not exists(select 1 from public.profiles where role='admin' and is_active and id<>old.id) then raise exception 'Debe conservar al menos un administrador activo.'; end if;
 end if;
 return new;
end;
$$;
revoke all on function private.protect_profile() from public, anon, authenticated;
create trigger protect_profile before update on public.profiles for each row execute function private.protect_profile();
grant update(full_name, avatar_url, permission_role_id, is_active, role) on public.profiles to authenticated;
create policy users_read on public.profiles for select to authenticated using(private.has_permission('users','read'));
create policy users_edit on public.profiles for update to authenticated using(private.has_permission('users','edit') or private.has_permission('users','assignRole') or private.has_permission('users','deactivate')) with check(private.has_permission('users','edit') or private.has_permission('users','assignRole') or private.has_permission('users','deactivate'));
drop policy "Approved staff read centers" on public.centers;
drop policy "Administrators manage centers" on public.centers;
create policy centers_read on public.centers for select to authenticated using(private.has_permission('centers','read'));
create policy centers_create on public.centers for insert to authenticated with check(private.has_permission('centers','create'));
create policy centers_edit on public.centers for update to authenticated using(private.has_permission('centers','edit')) with check(private.has_permission('centers','edit'));
create policy centers_delete on public.centers for delete to authenticated using(private.has_permission('centers','delete'));
drop policy "Approved staff read doctors" on public.doctors;
drop policy "Administrators manage doctors" on public.doctors;
create policy doctors_read on public.doctors for select to authenticated using(private.has_permission('doctors','read'));
create policy doctors_create on public.doctors for insert to authenticated with check(private.has_permission('doctors','create'));
create policy doctors_edit on public.doctors for update to authenticated using(private.has_permission('doctors','edit')) with check(private.has_permission('doctors','edit'));
create policy doctors_delete on public.doctors for delete to authenticated using(private.has_permission('doctors','delete'));
drop policy "Approved staff read organs" on public.organs;
drop policy "Administrators manage organs" on public.organs;
create policy organs_read on public.organs for select to authenticated using(private.has_permission('organs','read'));
create policy organs_create on public.organs for insert to authenticated with check(private.has_permission('organs','create'));
create policy organs_edit on public.organs for update to authenticated using(private.has_permission('organs','edit')) with check(private.has_permission('organs','edit'));
create policy organs_delete on public.organs for delete to authenticated using(private.has_permission('organs','delete'));
drop policy "Approved staff read exams" on public.exams;
drop policy "Administrators manage exams" on public.exams;
create policy exams_read on public.exams for select to authenticated using(private.has_permission('exams','read'));
create policy exams_create on public.exams for insert to authenticated with check(private.has_permission('exams','create'));
create policy exams_edit on public.exams for update to authenticated using(private.has_permission('exams','edit')) with check(private.has_permission('exams','edit'));
create policy exams_delete on public.exams for delete to authenticated using(private.has_permission('exams','delete'));
drop policy "Approved staff read lab configuration" on public.lab_info;
drop policy "Administrators manage lab configuration" on public.lab_info;
create policy lab_read on public.lab_info for select to authenticated using(private.has_permission('settings','read') or private.has_permission('templates','read') or private.has_permission('cases','read') or private.has_permission('reports','read'));
create policy lab_edit on public.lab_info for update to authenticated using(private.has_permission('settings','edit') or private.has_permission('templates','import') or private.has_permission('templates','assign')) with check(private.has_permission('settings','edit') or private.has_permission('templates','import') or private.has_permission('templates','assign'));
create function private.protect_lab_settings() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.settings->'resultTemplates') is distinct from (old.settings->'resultTemplates') and not private.has_permission('templates','import') then raise exception 'No puede importar plantillas.'; end if;
 if (new.settings->'resultTemplateExamGroups') is distinct from (old.settings->'resultTemplateExamGroups') and not private.has_permission('templates','assign') then raise exception 'No puede asignar grupos de plantillas.'; end if;
 if ((to_jsonb(new)-array['settings','updated_at']) is distinct from (to_jsonb(old)-array['settings','updated_at']) or (new.settings-array['resultTemplates','resultTemplateExamGroups']) is distinct from (old.settings-array['resultTemplates','resultTemplateExamGroups'])) and not private.has_permission('settings','edit') then raise exception 'No puede editar la configuración.'; end if;
 return new;
end;
$$;
revoke all on function private.protect_lab_settings() from public, anon, authenticated;
create trigger protect_lab_settings before update on public.lab_info for each row execute function private.protect_lab_settings();

-- Immutable authorization audit, written only by triggers.
create table public.permission_audit_log(id bigint generated always as identity primary key, actor uuid, resource text not null, target text not null, operation text not null, changes jsonb not null, created_at timestamptz not null default now());
alter table public.permission_audit_log enable row level security;
revoke all on public.permission_audit_log from public, anon, authenticated;
grant select on public.permission_audit_log to authenticated;
create policy permission_audit_read on public.permission_audit_log for select to authenticated using(private.has_permission('audit','read'));
create function private.audit_permissions() returns trigger language plpgsql security definer set search_path='' as $$
declare prior jsonb; current_value jsonb;
begin
 if tg_op <> 'INSERT' then prior=to_jsonb(old); end if;
 if tg_op <> 'DELETE' then current_value=to_jsonb(new); end if;
 if tg_table_name='profiles' then
  prior=jsonb_build_object('role',prior->'role','permission_role_id',prior->'permission_role_id','is_active',prior->'is_active');
  current_value=jsonb_build_object('role',current_value->'role','permission_role_id',current_value->'permission_role_id','is_active',current_value->'is_active');
  if prior = current_value then return null; end if;
 end if;
 insert into public.permission_audit_log(actor,resource,target,operation,changes) values(auth.uid(),tg_table_name,coalesce(new.id::text,old.id::text),tg_op,jsonb_build_object('before',prior,'after',current_value));
 return null;
end;
$$;
revoke all on function private.audit_permissions() from public, anon, authenticated;
create trigger audit_roles after insert or update or delete on public.app_roles for each row execute function private.audit_permissions();
create trigger audit_profile_permissions after update on public.profiles for each row execute function private.audit_permissions();
