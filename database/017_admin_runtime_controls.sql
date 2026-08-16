-- ORVUNO / WorldProject: sichere Admin-Runtime-RPCs fuer Closed-Alpha und Testerbetrieb.
-- Kritische Aenderungen laufen ausschliesslich serverseitig, rollenpruefend und mit Auditlog.
-- Diese Migration ist absichtlich eigenstaendig und nutzt users.admin_role als serverseitige Rollenquelle.

alter table public.users add column if not exists premium_until timestamptz;
alter table public.users add column if not exists admin_role text;

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id),
  action text not null,
  target_type text,
  target_id text,
  reason text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from public,anon,authenticated;
grant select,insert,update,delete on public.admin_audit_log to service_role;

create or replace function private.require_worldproject_admin(p_roles text[])
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_role text;
begin
  select lower(nullif(btrim(u.admin_role),'')) into v_role
  from public.users u
  where u.auth_user_id=(select auth.uid())
    and u.status='active'
  limit 1;
  if v_role is null or not (v_role=any(p_roles)) then raise exception 'Admin-Berechtigung fehlt'; end if;
  return v_role;
end;
$$;
revoke all on function private.require_worldproject_admin(text[]) from public,anon,authenticated;
grant execute on function private.require_worldproject_admin(text[]) to authenticated,service_role;

create or replace function private.admin_audit(p_action text,p_target_type text,p_target_id text,p_reason text,p_before jsonb,p_after jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,reason,before_data,after_data)
  values((select auth.uid()),p_action,p_target_type,p_target_id,nullif(btrim(coalesce(p_reason,'')),''),p_before,p_after);
end;
$$;
revoke all on function private.admin_audit(text,text,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function private.admin_audit(text,text,text,text,jsonb,jsonb) to authenticated,service_role;

create or replace function public.admin_list_players()
returns table(id bigint,public_id uuid,username text,email text,display_name text,status text,premium boolean,premium_until timestamptz,created_at timestamptz,last_login_at timestamptz,failed_login_count integer,locked_until timestamptz,admin_role text,coins bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_worldproject_admin(array['owner','admin','moderator','support','economy']);
  return query
  select u.id,u.public_id,u.username::text,u.email::text,u.display_name::text,u.status::text,
         (u.premium_until is not null and u.premium_until>now()),u.premium_until,u.created_at,u.last_login_at,
         coalesce(u.failed_login_count,0),u.locked_until,u.admin_role::text,coalesce(w.balance,0)
  from public.users u left join public.coin_wallets w on w.user_id=u.id order by u.id;
end;
$$;

create or replace function public.admin_list_companies()
returns table(id bigint,user_id bigint,name text,industry text,company_type text,money numeric,created_at timestamptz,saved_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_worldproject_admin(array['owner','admin','moderator','support','economy']);
  return query select c.id,c.user_id,c.name::text,c.industry::text,c.company_type::text,c.money,c.created_at,c.saved_at from public.companies c order by c.id;
end;
$$;

create or replace function public.admin_adjust_user_coins(p_user_id bigint,p_delta bigint,p_reason text default '')
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_before bigint;v_after bigint;
begin
  perform private.require_worldproject_admin(array['owner','admin','economy']);
  if p_user_id is null or p_delta is null or p_delta=0 then raise exception 'Ungueltige Coin-Aenderung'; end if;
  if not exists(select 1 from public.users where id=p_user_id) then raise exception 'Spieler nicht gefunden'; end if;
  insert into public.coin_wallets(user_id,balance) values(p_user_id,0) on conflict(user_id) do nothing;
  select balance into v_before from public.coin_wallets where user_id=p_user_id for update;
  v_after:=v_before+p_delta;if v_after<0 then raise exception 'Coinstand darf nicht negativ werden'; end if;
  update public.coin_wallets set balance=v_after,updated_at=now() where user_id=p_user_id;
  insert into public.coin_transactions(user_id,amount,balance_after,transaction_type,reference_type,reference_id,note)
  values(p_user_id,p_delta,v_after,'admin_adjustment','admin',(select auth.uid())::text,nullif(btrim(coalesce(p_reason,'')),''));
  perform private.admin_audit('user.coins.adjust','user',p_user_id::text,p_reason,jsonb_build_object('balance',v_before),jsonb_build_object('balance',v_after,'delta',p_delta));
  return v_after;
end;
$$;

create or replace function public.admin_set_user_premium(p_user_id bigint,p_enabled boolean,p_until timestamptz default null,p_reason text default '')
returns table(id bigint,premium boolean,premium_until timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_before jsonb;v_after jsonb;v_enabled boolean:=coalesce(p_enabled,false);
begin
  perform private.require_worldproject_admin(array['owner','admin']);
  select jsonb_build_object('premium_until',u.premium_until) into v_before from public.users u where u.id=p_user_id for update;
  if v_before is null then raise exception 'Spieler nicht gefunden'; end if;
  if v_enabled and (p_until is null or p_until<=now()) then raise exception 'Premium-Ende muss in der Zukunft liegen'; end if;
  update public.users u set premium_until=case when v_enabled then p_until else null end where u.id=p_user_id;
  select jsonb_build_object('premium_until',u.premium_until) into v_after from public.users u where u.id=p_user_id;
  perform private.admin_audit('user.premium.set','user',p_user_id::text,p_reason,v_before,v_after);
  return query select u.id,(u.premium_until is not null and u.premium_until>now()),u.premium_until from public.users u where u.id=p_user_id;
end;
$$;

create or replace function public.admin_set_company_money(p_company_id bigint,p_amount numeric,p_reason text default '')
returns table(id bigint,user_id bigint,name text,money numeric)
language plpgsql security definer set search_path = '' as $$
declare v_before numeric;v_after numeric;
begin
  perform private.require_worldproject_admin(array['owner','admin','economy']);
  if p_amount is null or p_amount<0 then raise exception 'Ungueltiges Firmenkapital'; end if;
  select c.money into v_before from public.companies c where c.id=p_company_id for update;if not found then raise exception 'Betrieb nicht gefunden'; end if;
  update public.companies c set money=p_amount where c.id=p_company_id returning c.money into v_after;
  perform private.admin_audit('company.money.set','company',p_company_id::text,p_reason,jsonb_build_object('money',v_before),jsonb_build_object('money',v_after));
  return query select c.id,c.user_id,c.name::text,c.money from public.companies c where c.id=p_company_id;
end;
$$;

create or replace function public.admin_set_user_status(p_user_id bigint,p_status text,p_reason text default '')
returns table(id bigint,status text,failed_login_count integer,locked_until timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_before jsonb;v_status text:=lower(btrim(coalesce(p_status,'')));
begin
  perform private.require_worldproject_admin(array['owner','admin','moderator']);
  if v_status not in ('active','suspended','restricted','banned') then raise exception 'Ungueltiger Accountstatus'; end if;
  select jsonb_build_object('status',u.status) into v_before from public.users u where u.id=p_user_id for update;if v_before is null then raise exception 'Spieler nicht gefunden'; end if;
  update public.users u set status=v_status where u.id=p_user_id;
  perform private.admin_audit('user.status.set','user',p_user_id::text,p_reason,v_before,jsonb_build_object('status',v_status));
  return query select u.id,u.status::text,coalesce(u.failed_login_count,0),u.locked_until from public.users u where u.id=p_user_id;
end;
$$;

create or replace function public.admin_unlock_user(p_user_id bigint,p_reason text default '')
returns table(id bigint,status text,failed_login_count integer,locked_until timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_before jsonb;v_after jsonb;
begin
  perform private.require_worldproject_admin(array['owner','admin','moderator','support']);
  select jsonb_build_object('failed_login_count',coalesce(u.failed_login_count,0),'locked_until',u.locked_until,'status',u.status) into v_before from public.users u where u.id=p_user_id for update;
  if v_before is null then raise exception 'Spieler nicht gefunden'; end if;
  update public.users u set failed_login_count=0,locked_until=null where u.id=p_user_id;
  select jsonb_build_object('failed_login_count',coalesce(u.failed_login_count,0),'locked_until',u.locked_until,'status',u.status) into v_after from public.users u where u.id=p_user_id;
  perform private.admin_audit('user.login.unlock','user',p_user_id::text,p_reason,v_before,v_after);
  return query select u.id,u.status::text,coalesce(u.failed_login_count,0),u.locked_until from public.users u where u.id=p_user_id;
end;
$$;

create or replace function public.admin_write_audit(p_action text,p_target_type text default null,p_target_id text default null,p_reason text default '',p_before jsonb default null,p_after jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_worldproject_admin(array['owner','admin','moderator','support','economy']);
  perform private.admin_audit(p_action,p_target_type,p_target_id,p_reason,p_before,p_after);
end;
$$;

revoke all on function public.admin_list_players() from public,anon;
revoke all on function public.admin_list_companies() from public,anon;
revoke all on function public.admin_adjust_user_coins(bigint,bigint,text) from public,anon;
revoke all on function public.admin_set_user_premium(bigint,boolean,timestamptz,text) from public,anon;
revoke all on function public.admin_set_company_money(bigint,numeric,text) from public,anon;
revoke all on function public.admin_set_user_status(bigint,text,text) from public,anon;
revoke all on function public.admin_unlock_user(bigint,text) from public,anon;
revoke all on function public.admin_write_audit(text,text,text,text,jsonb,jsonb) from public,anon;
grant execute on function public.admin_list_players() to authenticated,service_role;
grant execute on function public.admin_list_companies() to authenticated,service_role;
grant execute on function public.admin_adjust_user_coins(bigint,bigint,text) to authenticated,service_role;
grant execute on function public.admin_set_user_premium(bigint,boolean,timestamptz,text) to authenticated,service_role;
grant execute on function public.admin_set_company_money(bigint,numeric,text) to authenticated,service_role;
grant execute on function public.admin_set_user_status(bigint,text,text) to authenticated,service_role;
grant execute on function public.admin_unlock_user(bigint,text) to authenticated,service_role;
grant execute on function public.admin_write_audit(text,text,text,text,jsonb,jsonb) to authenticated,service_role;
notify pgrst,'reload schema';
