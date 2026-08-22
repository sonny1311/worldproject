-- ORVUNO / WorldProject
-- 028_admin_user_rpc_secret_hardening.sql
-- Admin-Mutatoren duerfen niemals komplette public.users-Zeilen zurueckgeben,
-- weil diese Legacy-Tabelle u.a. password_hash enthalten kann.

create or replace function private.safe_admin_user_json(p_user_id bigint)
returns jsonb
language sql
stable
security definer
set search_path='public','private'
as $$
  select jsonb_build_object(
    'id',u.id,
    'public_id',u.public_id,
    'username',u.username,
    'email',u.email,
    'display_name',u.display_name,
    'status',u.status,
    'premium_plan',u.premium_plan,
    'premium_until',u.premium_until,
    'premium_auto_renew',u.premium_auto_renew,
    'country_code',u.country_code,
    'language_code',u.language_code,
    'profile_image_url',u.profile_image_url,
    'email_verified_at',u.email_verified_at,
    'created_at',u.created_at,
    'last_login_at',u.last_login_at,
    'last_seen_at',u.last_seen_at,
    'failed_login_count',u.failed_login_count,
    'locked_until',u.locked_until,
    'deleted_at',u.deleted_at,
    'admin_role',u.admin_role
  )
  from public.users u where u.id=p_user_id
$$;
revoke all on function private.safe_admin_user_json(bigint) from public,anon,authenticated;
grant execute on function private.safe_admin_user_json(bigint) to service_role;

drop function if exists public.admin_update_user_profile(bigint,text,text,text,text,text,text);
create function public.admin_update_user_profile(
  p_user_id bigint,
  p_username text default null,
  p_display_name text default null,
  p_country_code text default null,
  p_language_code text default null,
  p_profile_image_url text default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path='public','private'
as $$
declare v_role text;v_before jsonb;v_after jsonb;
begin
  v_role:=private.current_admin_role();
  if v_role not in ('owner','admin','support') then raise exception 'Admin-Berechtigung fehlt'; end if;
  if coalesce(length(btrim(p_reason)),0)<3 then raise exception 'Begruendung erforderlich'; end if;
  v_before:=private.safe_admin_user_json(p_user_id);
  if v_before is null then raise exception 'Spieler nicht gefunden'; end if;
  update public.users
  set username=case when p_username is null then username else nullif(btrim(p_username),'') end,
      display_name=case when p_display_name is null then display_name else nullif(btrim(p_display_name),'') end,
      country_code=case when p_country_code is null then country_code else upper(left(btrim(p_country_code),2)) end,
      language_code=case when p_language_code is null then language_code else left(lower(btrim(p_language_code)),10) end,
      profile_image_url=case when p_profile_image_url is null then profile_image_url else nullif(btrim(p_profile_image_url),'') end
  where id=p_user_id;
  v_after:=private.safe_admin_user_json(p_user_id);
  insert into public.account_audit_log(user_id,event_type,details)
  values(p_user_id,'admin_user_profile_update',jsonb_build_object('actor_auth_user_id',auth.uid(),'actor_role',v_role,'reason',p_reason,'before',v_before,'after',v_after));
  return v_after;
end;
$$;

drop function if exists public.admin_set_user_admin_role(bigint,text,text);
create function public.admin_set_user_admin_role(p_user_id bigint,p_admin_role text,p_reason text)
returns jsonb
language plpgsql
security definer
set search_path='public','private'
as $$
declare v_role text;v_old text;v_new text;v_after jsonb;v_target_auth uuid;
begin
  v_role:=private.current_admin_role();
  if v_role <> 'owner' then raise exception 'Nur der Owner darf Admin-Rollen aendern'; end if;
  if coalesce(length(btrim(p_reason)),0)<3 then raise exception 'Begruendung erforderlich'; end if;
  v_new:=nullif(lower(btrim(coalesce(p_admin_role,''))),'');
  if v_new is not null and v_new not in ('owner','admin','moderator','support','economy') then raise exception 'Ungueltige Admin-Rolle'; end if;
  select admin_role::text,auth_user_id into v_old,v_target_auth from public.users where id=p_user_id for update;
  if not found then raise exception 'Spieler nicht gefunden'; end if;
  if auth.uid()=v_target_auth and v_old='owner' and v_new is distinct from 'owner' then raise exception 'Die eigene Owner-Rolle kann hier nicht entfernt werden'; end if;
  update public.users set admin_role=v_new where id=p_user_id;
  v_after:=private.safe_admin_user_json(p_user_id);
  insert into public.account_audit_log(user_id,event_type,details)
  values(p_user_id,'admin_role_change',jsonb_build_object('actor_auth_user_id',auth.uid(),'actor_role',v_role,'reason',p_reason,'before_role',v_old,'after_role',v_new));
  return v_after;
end;
$$;

drop function if exists public.admin_set_user_premium_details(bigint,text,timestamptz,boolean,text);
create function public.admin_set_user_premium_details(
  p_user_id bigint,
  p_plan text default null,
  p_until timestamptz default null,
  p_auto_renew boolean default false,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path='public','private'
as $$
declare v_role text;v_before jsonb;v_after jsonb;
begin
  v_role:=private.current_admin_role();
  if v_role not in ('owner','admin','support') then raise exception 'Admin-Berechtigung fehlt'; end if;
  if coalesce(length(btrim(p_reason)),0)<3 then raise exception 'Begruendung erforderlich'; end if;
  select jsonb_build_object('premium_plan',u.premium_plan,'premium_until',u.premium_until,'premium_auto_renew',u.premium_auto_renew)
    into v_before from public.users u where u.id=p_user_id for update;
  if v_before is null then raise exception 'Spieler nicht gefunden'; end if;
  update public.users set premium_plan=nullif(btrim(coalesce(p_plan,'')),''),premium_until=p_until,premium_auto_renew=coalesce(p_auto_renew,false) where id=p_user_id;
  v_after:=private.safe_admin_user_json(p_user_id);
  insert into public.account_audit_log(user_id,event_type,details)
  values(p_user_id,'admin_premium_details_change',jsonb_build_object('actor_auth_user_id',auth.uid(),'actor_role',v_role,'reason',p_reason,'before',v_before,'after',jsonb_build_object('premium_plan',v_after->'premium_plan','premium_until',v_after->'premium_until','premium_auto_renew',v_after->'premium_auto_renew')));
  return v_after;
end;
$$;

revoke all on function public.admin_update_user_profile(bigint,text,text,text,text,text,text) from public,anon;
revoke all on function public.admin_set_user_admin_role(bigint,text,text) from public,anon;
revoke all on function public.admin_set_user_premium_details(bigint,text,timestamptz,boolean,text) from public,anon;
grant execute on function public.admin_update_user_profile(bigint,text,text,text,text,text,text) to authenticated,service_role;
grant execute on function public.admin_set_user_admin_role(bigint,text,text) to authenticated,service_role;
grant execute on function public.admin_set_user_premium_details(bigint,text,timestamptz,boolean,text) to authenticated,service_role;
notify pgrst,'reload schema';
