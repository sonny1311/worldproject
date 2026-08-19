-- ORVUNO / WorldProject
-- Schutz vor veralteten Geld-Snapshots, idempotenter Coin->Firmengeld-Tausch
-- und serverseitiges Finanzprotokoll mit gezielter Admin-Recovery.

alter table public.companies add column if not exists money_revision bigint not null default 0;

update public.companies
set game_state = jsonb_set(jsonb_set(coalesce(game_state,'{}'::jsonb),'{money}',to_jsonb(money),true),'{moneyRevision}',to_jsonb(money_revision),true)
where closed_at is null;

create or replace function private.bump_company_money_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.money is distinct from old.money then
    new.money_revision := greatest(coalesce(new.money_revision,0),coalesce(old.money_revision,0)+1);
  else
    new.money_revision := greatest(coalesce(new.money_revision,0),coalesce(old.money_revision,0));
  end if;
  new.game_state := jsonb_set(coalesce(new.game_state,'{}'::jsonb),'{moneyRevision}',to_jsonb(new.money_revision),true);
  return new;
end;
$$;

drop trigger if exists trg_companies_money_revision on public.companies;
create trigger trg_companies_money_revision before update of money on public.companies
for each row execute function private.bump_company_money_revision();

create table if not exists public.economy_transactions (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  company_id bigint references public.companies(id) on delete set null,
  operation text not null,
  reference_type text,
  reference_id text,
  idempotency_key text,
  source_coin_transaction_id bigint references public.coin_transactions(id) on delete set null,
  recovery_of_transaction_id bigint references public.economy_transactions(id) on delete set null,
  coin_delta bigint not null default 0,
  money_delta numeric not null default 0,
  coins_before bigint,
  coins_after bigint,
  money_before numeric,
  money_after numeric,
  status text not null default 'pending' check (status in ('pending','completed','failed','recovered','cancelled')),
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index if not exists uq_economy_transactions_idempotency on public.economy_transactions(user_id,idempotency_key) where idempotency_key is not null;
create unique index if not exists uq_economy_transactions_recovery on public.economy_transactions(recovery_of_transaction_id) where recovery_of_transaction_id is not null;
create unique index if not exists uq_economy_transactions_source_case on public.economy_transactions(source_coin_transaction_id,operation) where source_coin_transaction_id is not null;
alter table public.economy_transactions enable row level security;

create or replace function public.save_player_business_state(p_company_id bigint, p_state jsonb)
returns public.companies language plpgsql security definer set search_path = '' as $$
declare
  v_user_id bigint; v_company public.companies; v_canonical public.companies;
  v_incoming_money numeric; v_money numeric; v_incoming_revision bigint; v_revision bigint; v_next_revision bigint;
  v_existing_state jsonb; v_property jsonb;
begin
  v_user_id := private.require_active_game_user_id();
  if p_state is null or jsonb_typeof(p_state) <> 'object' then raise exception 'Ungueltiger Spielstand'; end if;
  if octet_length(p_state::text) > 5242880 then raise exception 'Spielstand ist zu gross'; end if;
  perform pg_advisory_xact_lock(v_user_id);
  select * into v_company from public.companies where id=p_company_id and user_id=v_user_id and closed_at is null for update;
  if not found then raise exception 'Betrieb nicht gefunden'; end if;
  select * into v_canonical from public.companies where user_id=v_user_id and closed_at is null order by money_revision desc,is_primary desc,id limit 1 for update;
  v_revision := coalesce(v_canonical.money_revision,0); v_money := coalesce(v_canonical.money,0);
  begin v_incoming_money := (p_state->>'money')::numeric; exception when others then v_incoming_money := null; end;
  begin v_incoming_revision := (p_state->>'moneyRevision')::bigint; exception when others then v_incoming_revision := null; end;
  if v_incoming_revision = v_revision and v_incoming_money is not null then
    if v_incoming_money < -1000000000000 or v_incoming_money > 1000000000000 then raise exception 'Ungueltiger Kontostand'; end if;
    if v_incoming_money is distinct from v_money then v_money:=v_incoming_money; v_next_revision:=v_revision+1; else v_next_revision:=v_revision; end if;
  else v_next_revision:=v_revision; end if;
  v_existing_state := coalesce(v_company.game_state,'{}'::jsonb);
  v_property := case when jsonb_typeof(v_existing_state->'property')='object' then v_existing_state->'property' else null end;
  p_state := jsonb_set(jsonb_set(p_state,'{money}',to_jsonb(v_money),true),'{moneyRevision}',to_jsonb(v_next_revision),true);
  if v_property is not null then p_state:=jsonb_set(p_state,'{property}',v_property,true); else p_state:=p_state-'property'; end if;
  update public.companies set game_state=p_state,money=v_money,money_revision=v_next_revision,saved_at=now() where id=p_company_id and user_id=v_user_id and closed_at is null returning * into v_company;
  update public.companies set money=v_money,money_revision=v_next_revision,game_state=jsonb_set(jsonb_set(coalesce(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),'{moneyRevision}',to_jsonb(v_next_revision),true),saved_at=now() where user_id=v_user_id and closed_at is null and id<>p_company_id;
  select * into v_company from public.companies where id=p_company_id;
  return v_company;
end;
$$;

create or replace function public.save_player_game_state(p_state jsonb)
returns public.companies language plpgsql security definer set search_path = '' as $$
declare
  v_user_id bigint; v_company public.companies; v_canonical public.companies;
  v_incoming_money numeric; v_money numeric; v_incoming_revision bigint; v_revision bigint; v_next_revision bigint;
  v_existing_state jsonb; v_property jsonb;
begin
  v_user_id := private.require_active_game_user_id();
  if p_state is null or jsonb_typeof(p_state) <> 'object' then raise exception 'Ungueltiger Spielstand'; end if;
  if octet_length(p_state::text) > 5242880 then raise exception 'Spielstand ist zu gross'; end if;
  perform pg_advisory_xact_lock(v_user_id);
  select * into v_company from public.companies where user_id=v_user_id and is_primary=true and closed_at is null order by id limit 1 for update;
  if not found then raise exception 'Noch kein Hauptbetrieb vorhanden'; end if;
  select * into v_canonical from public.companies where user_id=v_user_id and closed_at is null order by money_revision desc,is_primary desc,id limit 1 for update;
  v_revision := coalesce(v_canonical.money_revision,0); v_money := coalesce(v_canonical.money,0);
  begin v_incoming_money := (p_state->>'money')::numeric; exception when others then v_incoming_money := null; end;
  begin v_incoming_revision := (p_state->>'moneyRevision')::bigint; exception when others then v_incoming_revision := null; end;
  if v_incoming_revision = v_revision and v_incoming_money is not null then
    if v_incoming_money < -1000000000000 or v_incoming_money > 1000000000000 then raise exception 'Ungueltiger Kontostand'; end if;
    if v_incoming_money is distinct from v_money then v_money:=v_incoming_money; v_next_revision:=v_revision+1; else v_next_revision:=v_revision; end if;
  else v_next_revision:=v_revision; end if;
  v_existing_state := coalesce(v_company.game_state,'{}'::jsonb);
  v_property := case when jsonb_typeof(v_existing_state->'property')='object' then v_existing_state->'property' else null end;
  p_state := jsonb_set(jsonb_set(p_state,'{money}',to_jsonb(v_money),true),'{moneyRevision}',to_jsonb(v_next_revision),true);
  if v_property is not null then p_state:=jsonb_set(p_state,'{property}',v_property,true); else p_state:=p_state-'property'; end if;
  update public.companies set game_state=p_state,money=v_money,money_revision=v_next_revision,saved_at=now() where id=v_company.id returning * into v_company;
  update public.companies set money=v_money,money_revision=v_next_revision,game_state=jsonb_set(jsonb_set(coalesce(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),'{moneyRevision}',to_jsonb(v_next_revision),true),saved_at=now() where user_id=v_user_id and is_primary=false and closed_at is null;
  select * into v_company from public.companies where id=v_company.id;
  return v_company;
end;
$$;

create or replace function public.exchange_coins_for_company_money_v2(p_tier text,p_request_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id bigint; v_cost bigint; v_credit numeric; v_balance bigint; v_money numeric; v_revision bigint; v_company_id bigint;
  v_existing public.economy_transactions; v_coin_tx_id bigint; v_ledger_id bigint;
begin
  v_user_id:=private.require_active_game_user_id();
  if p_request_id is null or length(trim(p_request_id))<8 or length(p_request_id)>160 then raise exception 'Ungueltige Vorgangs-ID'; end if;
  case p_tier
    when 'money_65000' then v_cost:=200; v_credit:=65000;
    when 'money_200000' then v_cost:=525; v_credit:=200000;
    when 'money_450000' then v_cost:=1150; v_credit:=450000;
    when 'money_1000000' then v_cost:=2400; v_credit:=1000000;
    when 'money_2800000' then v_cost:=6500; v_credit:=2800000;
    when 'money_7500000' then v_cost:=15000; v_credit:=7500000;
    else raise exception 'Unbekanntes Firmengeld-Paket';
  end case;
  perform pg_advisory_xact_lock(v_user_id);
  select * into v_existing from public.economy_transactions where user_id=v_user_id and idempotency_key=p_request_id for update;
  if found then
    if v_existing.operation<>'company_money_exchange' or v_existing.reference_id<>p_tier then raise exception 'Vorgangs-ID wurde bereits anders verwendet'; end if;
    return jsonb_build_object('success',v_existing.status='completed','tier',p_tier,'coinsSpent',abs(v_existing.coin_delta),'moneyCredited',v_existing.money_delta,'coins',v_existing.coins_after,'money',v_existing.money_after,'moneyRevision',coalesce((v_existing.metadata->>'moneyRevision')::bigint,0),'transactionId',v_existing.id,'requestId',p_request_id,'replayed',true,'error',v_existing.error);
  end if;
  insert into public.coin_wallets(user_id,balance,updated_at) values(v_user_id,0,now()) on conflict(user_id) do nothing;
  select balance into v_balance from public.coin_wallets where user_id=v_user_id for update;
  select id,coalesce(money,0),coalesce(money_revision,0) into v_company_id,v_money,v_revision from public.companies where user_id=v_user_id and closed_at is null order by money_revision desc,is_primary desc,id limit 1 for update;
  if not found then raise exception 'Noch kein aktiver Betrieb vorhanden'; end if;
  if v_balance < v_cost then
    insert into public.economy_transactions(user_id,company_id,operation,reference_type,reference_id,idempotency_key,coin_delta,money_delta,coins_before,coins_after,money_before,money_after,status,error,completed_at)
    values(v_user_id,v_company_id,'company_money_exchange','monetization_tier',p_tier,p_request_id,0,0,v_balance,v_balance,v_money,v_money,'failed','Nicht genügend Coins',now()) returning id into v_ledger_id;
    return jsonb_build_object('success',false,'tier',p_tier,'coins',v_balance,'money',v_money,'moneyRevision',v_revision,'transactionId',v_ledger_id,'requestId',p_request_id,'replayed',false,'error','Nicht genügend Coins');
  end if;
  update public.coin_wallets set balance=balance-v_cost,updated_at=now() where user_id=v_user_id returning balance into v_balance;
  insert into public.coin_transactions(user_id,amount,balance_after,transaction_type,reference_type,reference_id,note)
  values(v_user_id,-v_cost,v_balance,'company_money_exchange','monetization_tier',p_tier,'Coins gegen Firmengeld getauscht') returning id into v_coin_tx_id;
  v_money:=v_money+v_credit; v_revision:=v_revision+1;
  update public.companies set money=v_money,money_revision=v_revision,game_state=jsonb_set(jsonb_set(coalesce(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),'{moneyRevision}',to_jsonb(v_revision),true),saved_at=now() where user_id=v_user_id and closed_at is null;
  insert into public.economy_transactions(user_id,company_id,operation,reference_type,reference_id,idempotency_key,source_coin_transaction_id,coin_delta,money_delta,coins_before,coins_after,money_before,money_after,status,metadata,completed_at)
  values(v_user_id,v_company_id,'company_money_exchange','monetization_tier',p_tier,p_request_id,v_coin_tx_id,-v_cost,v_credit,v_balance+v_cost,v_balance,v_money-v_credit,v_money,'completed',jsonb_build_object('moneyRevision',v_revision),now()) returning id into v_ledger_id;
  return jsonb_build_object('success',true,'tier',p_tier,'coinsSpent',v_cost,'moneyCredited',v_credit,'coins',v_balance,'money',v_money,'moneyRevision',v_revision,'transactionId',v_ledger_id,'requestId',p_request_id,'replayed',false);
end;
$$;

create or replace function public.admin_list_financial_transactions(p_limit integer default 100,p_user_id bigint default null)
returns table(id bigint,user_id bigint,username text,operation text,coin_delta bigint,money_delta numeric,status text,reference_id text,idempotency_key text,error text,recoverable boolean,created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  v_role:=private.current_admin_role();
  if v_role not in ('owner','admin','economy') then raise exception 'Keine Berechtigung'; end if;
  return query
  with combined as (
    select e.id,e.user_id,u.username::text,e.operation::text,e.coin_delta,e.money_delta,e.status::text,e.reference_id::text,e.idempotency_key::text,e.error::text,
      (e.status='failed' and e.operation='coin_exchange_missing_credit' and coalesce((e.metadata->>'recoverable')::boolean,false)) as recoverable,e.created_at
    from public.economy_transactions e join public.users u on u.id=e.user_id
    where p_user_id is null or e.user_id=p_user_id
    union all
    select -c.id,c.user_id,u.username::text,c.transaction_type::text,c.amount,0::numeric,'legacy'::text,c.reference_id::text,null::text,null::text,false,c.created_at
    from public.coin_transactions c join public.users u on u.id=c.user_id
    where (p_user_id is null or c.user_id=p_user_id)
      and not exists(select 1 from public.economy_transactions e where e.source_coin_transaction_id=c.id)
  )
  select * from combined order by created_at desc limit greatest(1,least(coalesce(p_limit,100),250));
end;
$$;

create or replace function public.admin_recover_financial_transaction(p_transaction_id bigint,p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_role text; v_tx public.economy_transactions; v_existing public.economy_transactions; v_money numeric; v_after numeric; v_revision bigint; v_company_id bigint; v_recovery_id bigint;
begin
  v_role:=private.current_admin_role();
  if v_role not in ('owner','admin','economy') then raise exception 'Keine Berechtigung'; end if;
  if p_reason is null or length(trim(p_reason))<3 then raise exception 'Begründung ist erforderlich'; end if;
  select * into v_tx from public.economy_transactions where id=p_transaction_id for update;
  if not found then raise exception 'Finanztransaktion nicht gefunden'; end if;
  select * into v_existing from public.economy_transactions where recovery_of_transaction_id=v_tx.id;
  if found then return jsonb_build_object('success',true,'transactionId',v_existing.id,'recoveredFrom',v_tx.id,'money',v_existing.money_after,'replayed',true); end if;
  if v_tx.status<>'failed' or v_tx.operation<>'coin_exchange_missing_credit' or not coalesce((v_tx.metadata->>'recoverable')::boolean,false) then raise exception 'Diese Transaktion ist nicht automatisch wiederherstellbar'; end if;
  if v_tx.money_delta<=0 then raise exception 'Ungültiger Wiederherstellungsbetrag'; end if;
  perform pg_advisory_xact_lock(v_tx.user_id);
  select id,coalesce(money,0),coalesce(money_revision,0) into v_company_id,v_money,v_revision from public.companies where user_id=v_tx.user_id and closed_at is null order by money_revision desc,is_primary desc,id limit 1 for update;
  if not found then raise exception 'Kein aktiver Betrieb vorhanden'; end if;
  v_after:=v_money+v_tx.money_delta; v_revision:=v_revision+1;
  update public.companies set money=v_after,money_revision=v_revision,game_state=jsonb_set(jsonb_set(coalesce(game_state,'{}'::jsonb),'{money}',to_jsonb(v_after),true),'{moneyRevision}',to_jsonb(v_revision),true),saved_at=now() where user_id=v_tx.user_id and closed_at is null;
  insert into public.economy_transactions(user_id,company_id,operation,reference_type,reference_id,recovery_of_transaction_id,coin_delta,money_delta,money_before,money_after,status,metadata,completed_at)
  values(v_tx.user_id,v_company_id,'coin_exchange_recovery','economy_transaction',v_tx.id::text,v_tx.id,0,v_tx.money_delta,v_money,v_after,'recovered',jsonb_build_object('reason',trim(p_reason),'moneyRevision',v_revision,'adminRole',v_role),now()) returning id into v_recovery_id;
  update public.economy_transactions set status='recovered',completed_at=now(),metadata=metadata||jsonb_build_object('recoveredByRole',v_role,'recoveryReason',trim(p_reason),'recoveryTransactionId',v_recovery_id) where id=v_tx.id;
  insert into public.account_audit_log(user_id,event_type,details) values(v_tx.user_id,'admin_financial_recovery',jsonb_build_object('sourceTransactionId',v_tx.id,'recoveryTransactionId',v_recovery_id,'amount',v_tx.money_delta,'reason',trim(p_reason),'adminRole',v_role));
  return jsonb_build_object('success',true,'transactionId',v_recovery_id,'recoveredFrom',v_tx.id,'moneyCredited',v_tx.money_delta,'money',v_after,'moneyRevision',v_revision,'replayed',false);
end;
$$;

grant execute on function public.exchange_coins_for_company_money_v2(text,text) to authenticated;
grant execute on function public.admin_list_financial_transactions(integer,bigint) to authenticated;
grant execute on function public.admin_recover_financial_transaction(bigint,text) to authenticated;
revoke all on public.economy_transactions from anon,authenticated;
