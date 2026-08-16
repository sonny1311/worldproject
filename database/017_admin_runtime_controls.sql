-- ORVUNO / WorldProject: geschuetzte Admin-Verzeichnis-RPCs.
-- Die vorhandenen Admin-Mutatoren (Coins, Premium, Geld, Status, Unlock) bleiben unveraendert:
-- sie pruefen private.current_admin_role() serverseitig und protokollieren in account_audit_log.

create or replace function public.admin_list_players()
returns table(
  id bigint,
  public_id uuid,
  username text,
  email text,
  display_name text,
  status text,
  premium boolean,
  premium_until timestamptz,
  created_at timestamptz,
  last_login_at timestamptz,
  failed_login_count integer,
  locked_until timestamptz,
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
  if v_role not in ('owner','admin','moderator','support','economy') then raise exception 'Admin-Berechtigung fehlt'; end if;
  return query
  select u.id,u.public_id,u.username::text,u.email::text,u.display_name::text,u.status::text,
         (u.premium_until is not null and u.premium_until>now()),u.premium_until,u.created_at,u.last_login_at,
         coalesce(u.failed_login_count,0),u.locked_until,u.admin_role::text,coalesce(w.balance,0)
  from public.users u
  left join public.coin_wallets w on w.user_id=u.id
  order by u.id;
end;
$$;

create or replace function public.admin_list_companies()
returns table(
  id bigint,
  user_id bigint,
  name text,
  industry text,
  company_type text,
  money numeric,
  created_at timestamptz,
  saved_at timestamptz
)
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
  select c.id,c.user_id,c.name::text,c.industry::text,c.company_type::text,c.money,c.created_at,c.saved_at
  from public.companies c
  order by c.id;
end;
$$;

revoke all on function public.admin_list_players() from public,anon;
revoke all on function public.admin_list_companies() from public,anon;
grant execute on function public.admin_list_players() to authenticated,service_role;
grant execute on function public.admin_list_companies() to authenticated,service_role;
notify pgrst,'reload schema';
