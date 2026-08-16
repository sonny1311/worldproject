-- ORVUNO / WorldProject: Sicherheitsfix fuer Admin-RPCs.
-- SQL NOT IN mit NULL ergibt NULL statt TRUE. Darum liefert die zentrale Rollenfunktion
-- fuer nicht angemeldete / nicht privilegierte Accounts bewusst einen leeren String.
create or replace function private.current_admin_role()
returns text
language sql
stable
security definer
set search_path = 'public','private'
as $$
  select coalesce((
    select lower(nullif(btrim(u.admin_role),''))
    from public.users u
    where u.auth_user_id = auth.uid()
      and u.status = 'active'
    limit 1
  ),'')
$$;
revoke all on function private.current_admin_role() from public,anon,authenticated;
grant execute on function private.current_admin_role() to authenticated,service_role;
notify pgrst,'reload schema';
