-- A registration is a pending profile, never an authorization grant.
create function private.create_pending_lab_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,full_name,role,is_active)
 values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''), split_part(coalesce(new.email,''),'@',1)), 200), 'viewer', false)
 on conflict(id) do nothing;
 return new;
end;
$$;
revoke all on function private.create_pending_lab_profile() from public, anon, authenticated;
create trigger create_pending_lab_profile after insert on auth.users for each row execute function private.create_pending_lab_profile();

-- Recover accounts registered before profile provisioning existed. Preserve every existing profile.
insert into public.profiles(id,full_name,role,is_active)
select u.id, left(coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'),''), split_part(coalesce(u.email,''),'@',1)), 200), 'viewer', false
from auth.users u where not exists(select 1 from public.profiles p where p.id=u.id)
on conflict(id) do nothing;

-- The Auth schema remains private. Only these directory fields cross the authorization boundary.
create function private.list_lab_users() returns setof jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'full_name',p.full_name,'role',p.role,'is_active',p.is_active,
 'permission_role_id',p.permission_role_id,'email',coalesce(u.email,''),'email_confirmed',u.email_confirmed_at is not null,'last_sign_in_at',u.last_sign_in_at)
 from public.profiles p join auth.users u on u.id=p.id
 where auth.uid() is not null and (private.has_permission('users','read') or p.id=auth.uid())
 order by p.full_name,p.id;
$$;
revoke all on function private.list_lab_users() from public, anon;
grant execute on function private.list_lab_users() to authenticated;
create function public.list_lab_users() returns setof jsonb
language sql stable security invoker set search_path='' as $$ select * from private.list_lab_users(); $$;
revoke all on function public.list_lab_users() from public, anon;
grant execute on function public.list_lab_users() to authenticated;

create or replace function private.protect_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare admin_actor boolean;
begin
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_active) into admin_actor;
 if new.id <> old.id or new.created_at is distinct from old.created_at then raise exception 'Identidad protegida.'; end if;
 if new.permission_role_id is distinct from old.permission_role_id and not private.has_permission('users','assignRole') then raise exception 'No puede asignar roles.'; end if;
 if new.is_active is distinct from old.is_active and not private.has_permission('users','deactivate') then raise exception 'No puede cambiar el estado del usuario.'; end if;
 if (new.full_name is distinct from old.full_name or new.avatar_url is distinct from old.avatar_url) and not private.has_permission('users','edit') then raise exception 'No puede editar usuarios.'; end if;
 if old.role='viewer' and new.role<>'viewer' then
  if not private.has_permission('users','assignRole') or not private.has_permission('users','deactivate') then raise exception 'No puede admitir usuarios.'; end if;
  if new.permission_role_id is null or not exists(select 1 from public.app_roles r where r.id=new.permission_role_id and r.is_active) then raise exception 'Seleccione un rol activo antes de admitir.'; end if;
  if not exists(select 1 from auth.users u where u.id=old.id and u.email_confirmed_at is not null) then raise exception 'El usuario debe confirmar su correo antes de ser admitido.'; end if;
 elsif new.role is distinct from old.role and not admin_actor then
  raise exception 'Solo un administrador puede cambiar el tipo de acceso.';
 end if;
 if new.role='admin' and old.role<>'admin' and not admin_actor then raise exception 'Solo un administrador puede conceder acceso administrativo.'; end if;
 if new.is_active and new.role='viewer' then raise exception 'Seleccione un rol y admita al usuario antes de activarlo.'; end if;
 if new.permission_role_id='1' and new.role<>'admin' then raise exception 'El rol administrador requiere autorización administrativa.'; end if;
 if old.role='admin' and old.is_active and (new.role<>'admin' or not new.is_active) then
  perform pg_advisory_xact_lock(7312048);
  if not exists(select 1 from public.profiles where role='admin' and is_active and id<>old.id) then raise exception 'Debe conservar al menos un administrador activo.'; end if;
 end if;
 return new;
end;
$$;
revoke all on function private.protect_profile() from public, anon, authenticated;

-- Atomic admission: verified email, chosen role and activation all succeed together.
create function private.admit_lab_user(target_user_id uuid, selected_role_id text) returns void
language plpgsql security definer set search_path='' as $$
declare target_role text; profile_role text;
begin
 if auth.uid() is null or not private.has_permission('users','assignRole') or not private.has_permission('users','deactivate') then raise exception 'No tiene permiso para admitir usuarios.' using errcode='42501'; end if;
 select p.role into profile_role from public.profiles p where p.id=target_user_id for update;
 if not found then raise exception 'Usuario no encontrado.'; end if;
 if profile_role<>'viewer' then raise exception 'Este usuario ya fue admitido. Edite sus permisos desde Usuarios.'; end if;
 perform 1 from public.app_roles r where r.id=selected_role_id and r.is_active for share;
 if not found then raise exception 'Seleccione un rol activo.'; end if;
 if not exists(select 1 from auth.users u where u.id=target_user_id and u.email_confirmed_at is not null) then raise exception 'El usuario debe confirmar su correo antes de ser admitido.'; end if;
 target_role=case selected_role_id when '1' then 'admin' when '3' then 'technician' when '4' then 'courier' else 'pathologist' end;
 update public.profiles set role=target_role, permission_role_id=selected_role_id, is_active=true, updated_at=now() where id=target_user_id;
end;
$$;
revoke all on function private.admit_lab_user(uuid,text) from public, anon;
grant execute on function private.admit_lab_user(uuid,text) to authenticated;
create function public.admit_lab_user(target_user_id uuid, selected_role_id text) returns void
language sql security invoker set search_path='' as $$ select private.admit_lab_user(target_user_id,selected_role_id); $$;
revoke all on function public.admit_lab_user(uuid,text) from public, anon;
grant execute on function public.admit_lab_user(uuid,text) to authenticated;
