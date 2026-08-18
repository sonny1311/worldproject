create or replace function public.admin_set_company_money(p_company_id bigint, p_amount numeric, p_reason text)
returns public.companies
language plpgsql
security definer
set search_path to 'public','private'
as $function$
declare
  v_role text;
  v_actor bigint;
  v_before numeric;
  v_row public.companies;
  v_target_user_id bigint;
begin
  v_role := private.current_admin_role();
  if v_role not in ('owner','admin','economy') then raise exception 'Admin-Berechtigung fehlt'; end if;
  if p_amount is null or p_amount < 0 or p_amount > 1000000000000 then raise exception 'Ungültiger Betrag'; end if;
  if length(trim(coalesce(p_reason,''))) < 3 then raise exception 'Begründung erforderlich'; end if;

  select private.current_game_user_id() into v_actor;
  select user_id,money into v_target_user_id,v_before
  from public.companies
  where id=p_company_id
  for update;
  if not found then raise exception 'Betrieb nicht gefunden'; end if;

  -- Firmen eines Spielers verwenden aktuell einen gemeinsamen Firmenkontostand.
  -- Deshalb müssen Spalte und game_state.money synchron auf allen offenen Betrieben gesetzt werden,
  -- sonst überschreibt der nächste Autosave die Admin-Gutschrift wieder mit dem alten Spielstand.
  update public.companies
  set money=p_amount,
      game_state=jsonb_set(coalesce(game_state,'{}'::jsonb),'{money}',to_jsonb(p_amount),true),
      saved_at=now()
  where user_id=v_target_user_id and closed_at is null;

  select * into v_row from public.companies where id=p_company_id;

  insert into public.account_audit_log(user_id,event_type,details)
  values(v_actor,'admin_company_money_set',jsonb_build_object(
    'target_company_id',p_company_id,
    'target_user_id',v_target_user_id,
    'before',v_before,
    'after',p_amount,
    'reason',trim(p_reason),
    'admin_role',v_role,
    'shared_balance_sync',true
  ));
  return v_row;
end
$function$;
