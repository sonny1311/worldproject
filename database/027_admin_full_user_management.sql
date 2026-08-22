-- ORVUNO / WorldProject
-- 027_admin_full_user_management.sql
-- Vollstaendige, aber sichere User-Verwaltung fuer die In-Game-Admin-Konsole.
-- Keine Passwoerter, Session-Tokens oder sonstigen Auth-Secrets werden exponiert.

-- admin_list_players() existiert bereits mit einer kleineren Rueckgabesignatur.
-- PostgreSQL erlaubt keinen Return-Type-Wechsel per CREATE OR REPLACE.
drop function if exists public.admin_list_players();

create function public.admin_list_players()
returns table(
  id bigint,
  public_id uuid,
  username text,
  email text,
  display_name text,
  status text,
  premium boolean,
  premium_plan text,
  premium_until timestamptz,
  premium_auto_renew boolean,
  country_code text,
  language_code text,
  profile_image_url text,
  terms_version text,
  privacy_version text,
  email_verified_at timestamptz,
  created_at timestamptz,
  last_login_at timestamptz,
  last_seen_at timestamptz,
  failed_login_count integer,
  locked_until timestamptz,
  deleted_at timestamptz,
  admin_role text,
  coins bigint
)
language plpgsql
stable
security definer
set search_path = 'public','private'
as $$
declare v_role text;
begin
  v_role:=private.current_admin_role();
  if v_role not in ('owner','admin','moderator','support','economy') then
    raise exception 'Admin-Berechtigung fehlt';
  end if;

  return query
  select
    u.id,u.public_id,u.username::text,u.email::text,u.display_name::text,u.status::text,
    (u.premium_until is not null and u.premium_until>now()),
    u.premium_plan::text,u.premium_until,coalesce(u.premium_auto_renew,false),
    u.country_code::text,u.language_code::text,u.profile_image_url::text,
    u.terms_version::text,u.privacy_version::text,u.email_verified_at,
    u.created_at,u.last_login_at,u.last_seen_at,coalesce(u.failed_login_count,0),
    u.locked_until,u.deleted_at,u.admin_role::text,coalesce(w.balance,0)
  from public.users u
  left join public.coin_wallets w on w.user_id=u.id
  order by u.id;
end;
$$;

create or replace function public.admin_update_user_profile(
  p_user_id bigint,
  p_username text default null,
  p_display_name text default null,
  p_country_code text default null,
  p_language_code text default null,
  p_profile_image_url text default null,
  p_reason text default null
)
returns public.users
language plpgsql
security definer
set search_path = 'public','private'
as $$
declare
  v_role text;
  v_before jsonb;
  v_after public.users;
begin
  v_role:=private.current_admin_role();
  if v_role not in ('owner','admin','support') then raise exception 'Admin-Berechtigung fehlt'; end if;
  if coalesce(length(btrim(p_reason)),0)<3 then raise exception 'Begruendung erforderlich'; end if;

  select to_jsonb(u) - 'password_hash' into v_before from public.users u where u.id=p_user_id for update;
  if v_before is null then raise exception 'Spieler nicht gefunden'; end if;

  update public.users
  set username=case when p_username is null then username else nullif(btrim(p_username),'') end,
      display_name=case when p_display_name is null then display_name else nullif(btrim(p_display_name),'') end,
      country_code=case when p_country_code is null then country_code else upper(left(btrim(p_country_code),2)) end,
      language_code=case when p_language_code is null then language_code else left(lower(btrim(p_language_code)),10) end,
      profile_image_url=case when p_profile_image_url is null then profile_image_url else nullif(btrim(p_profile_image_url),'') end
  where id=p_user_id
  returning * into v_after;

  insert into public.account_audit_log(user_id,event_type,details)
  values(p_user_id,'admin_user_profile_update',jsonb_build_object(
    'actor_auth_user_id',auth.uid(),'actor_role',v_role,'reason',p_reason,
    'before',v_before,'after',to_jsonb(v_after)-'password_hash'
  ));
  return v_after;
end;
$$;

create or replace function public.admin_set_user_admin_role(
  p_user_id bigint,
  p_admin_role text,
  p_reason text
)
returns public.users
language plpgsql
security definer
set search_path = 'public','private'
as $$
declare
  v_role text;
  v_old text;
  v_after public.users;
  v_new text;
begin
  v_role:=private.current_admin_role();
  if v_role <> 'owner' then raise exception 'Nur der Owner darf Admin-Rollen aendern'; end if;
  if coalesce(length(btrim(p_reason)),0)<3 then raise exception 'Begruendung erforderlich'; end if;
  v_new:=nullif(lower(btrim(coalesce(p_admin_role,''))),'');
  if v_new is not null and v_new not in ('owner','admin','moderator','support','economy') then
    raise exception 'Ungueltige Admin-Rolle';
  end if;

  select admin_role::text into v_old from public.users where id=p_user_id for update;
  if not found then raise exception 'Spieler nicht gefunden'; end if;

  -- Der angemeldete Owner darf sich nicht versehentlich selbst entmachten.
  if auth.uid()=(select auth_user_id from public.users where id=p_user_id) and v_old='owner' and v_new is distinct from 'owner' then
    raise exception 'Die eigene Owner-Rolle kann hier nicht entfernt werden';
  end if;

  update public.users set admin_role=v_new where id=p_user_id returning * into v_after;

  insert into public.account_audit_log(user_id,event_type,details)
  values(p_user_id,'admin_role_change',jsonb_build_object(
    'actor_auth_user_id',auth.uid(),'actor_role',v_role,'reason',p_reason,
    'before_role',v_old,'after_role',v_new
  ));
  return v_after;
end;
$$;

create or replace function public.admin_set_user_premium_details(
  p_user_id bigint,
  p_plan text default null,
  p_until timestamptz default null,
  p_auto_renew boolean default false,
  p_reason text default null
)
returns public.users
language plpgsql
security definer
set search_path = 'public','private'
as $$
declare
  v_role text;
  v_before jsonb;
  v_after public.users;
begin
  v_role:=private.current_admin_role();
  if v_role not in ('owner','admin','support') then raise exception 'Admin-Berechtigung fehlt'; end if;
  if coalesce(length(btrim(p_reason)),0)<3 then raise exception 'Begruendung erforderlich'; end if;

  select jsonb_build_object('premium_plan',u.premium_plan,'premium_until',u.premium_until,'premium_auto_renew',u.premium_auto_renew)
  into v_before from public.users u where u.id=p_user_id for update;
  if v_before is null then raise exception 'Spieler nicht gefunden'; end if;

  update public.users
  set premium_plan=nullif(btrim(coalesce(p_plan,'')),''),
      premium_until=p_until,
      premium_auto_renew=coalesce(p_auto_renew,false)
  where id=p_user_id returning * into v_after;

  insert into public.account_audit_log(user_id,event_type,details)
  values(p_user_id,'admin_premium_details_change',jsonb_build_object(
    'actor_auth_user_id',auth.uid(),'actor_role',v_role,'reason',p_reason,
    'before',v_before,'after',jsonb_build_object('premium_plan',v_after.premium_plan,'premium_until',v_after.premium_until,'premium_auto_renew',v_after.premium_auto_renew)
  ));
  return v_after;
end;
$$;

create or replace function public.admin_list_user_audit(
  p_user_id bigint,
  p_limit integer default 100
)
returns table(id bigint,event_type text,details jsonb,created_at timestamptz)
language plpgsql
stable
security definer
set search_path = 'public','private'
as $$
declare v_role text;
begin
  v_role:=private.current_admin_role();
  if v_role not in ('owner','admin','moderator','support','economy') then raise exception 'Admin-Berechtigung fehlt'; end if;
  return query
  select a.id,a.event_type::text,a.details,a.created_at
  from public.account_audit_log a
  where a.user_id=p_user_id
  order by a.created_at desc
  limit greatest(1,least(coalesce(p_limit,100),250));
end;
$$;

revoke all on function public.admin_list_players() from public,anon;
revoke all on function public.admin_update_user_profile(bigint,text,text,text,text,text,text) from public,anon;
revoke all on function public.admin_set_user_admin_role(bigint,text,text) from public,anon;
revoke all on function public.admin_set_user_premium_details(bigint,text,timestamptz,boolean,text) from public,anon;
revoke all on function public.admin_list_user_audit(bigint,integer) from public,anon;

grant execute on function public.admin_list_players() to authenticated,service_role;
grant execute on function public.admin_update_user_profile(bigint,text,text,text,text,text,text) to authenticated,service_role;
grant execute on function public.admin_set_user_admin_role(bigint,text,text) to authenticated,service_role;
grant execute on function public.admin_set_user_premium_details(bigint,text,timestamptz,boolean,text) to authenticated,service_role;
grant execute on function public.admin_list_user_audit(bigint,integer) to authenticated,service_role;

notify pgrst,'reload schema';
