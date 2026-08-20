-- ORVUNO: revisionssichere Admin-Finanzen, idempotente Entschädigungen und RPC-Härtung.

CREATE OR REPLACE FUNCTION public.admin_set_company_money(p_company_id bigint, p_amount numeric, p_reason text)
RETURNS public.companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','private'
AS $function$
DECLARE
  v_role text;
  v_actor bigint;
  v_before numeric;
  v_row public.companies;
  v_target_user_id bigint;
  v_revision bigint;
BEGIN
  v_role := private.current_admin_role();
  IF v_role NOT IN ('owner','admin','economy') THEN RAISE EXCEPTION 'Admin-Berechtigung fehlt'; END IF;
  IF p_amount IS NULL OR p_amount < 0 OR p_amount > 1000000000000 THEN RAISE EXCEPTION 'Ungültiger Betrag'; END IF;
  IF length(trim(coalesce(p_reason,''))) < 3 THEN RAISE EXCEPTION 'Begründung erforderlich'; END IF;

  SELECT private.current_game_user_id() INTO v_actor;
  SELECT user_id INTO v_target_user_id FROM public.companies WHERE id=p_company_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Betrieb nicht gefunden'; END IF;

  PERFORM pg_advisory_xact_lock(v_target_user_id);
  SELECT money,coalesce(money_revision,0) INTO v_before,v_revision
  FROM public.companies
  WHERE user_id=v_target_user_id AND closed_at IS NULL
  ORDER BY is_primary DESC,id LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kein aktiver Betrieb vorhanden'; END IF;
  v_revision := v_revision + 1;

  UPDATE public.companies
  SET money=p_amount,
      money_revision=v_revision,
      game_state=jsonb_set(
        jsonb_set(coalesce(game_state,'{}'::jsonb),'{money}',to_jsonb(p_amount),true),
        '{moneyRevision}',to_jsonb(v_revision),true
      ),
      saved_at=now()
  WHERE user_id=v_target_user_id AND closed_at IS NULL;

  SELECT * INTO v_row FROM public.companies WHERE id=p_company_id;
  INSERT INTO public.account_audit_log(user_id,event_type,details)
  VALUES(v_actor,'admin_company_money_set',jsonb_build_object(
    'target_company_id',p_company_id,'target_user_id',v_target_user_id,
    'before',v_before,'after',p_amount,'money_revision',v_revision,
    'reason',trim(p_reason),'admin_role',v_role,'shared_balance_sync',true
  ));
  INSERT INTO public.economy_transactions(
    user_id,company_id,operation,reference_type,reference_id,coin_delta,money_delta,
    money_before,money_after,status,metadata,completed_at
  ) VALUES(
    v_target_user_id,p_company_id,'admin_money_set','admin_action',coalesce(v_actor::text,'system'),0,p_amount-coalesce(v_before,0),
    v_before,p_amount,'completed',jsonb_build_object('reason',trim(p_reason),'adminRole',v_role,'moneyRevision',v_revision),now()
  );
  RETURN v_row;
END
$function$;

CREATE OR REPLACE FUNCTION public.admin_grant_player_compensation(
  p_user_id bigint,
  p_money numeric,
  p_coins bigint,
  p_reason text,
  p_request_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','private'
AS $function$
DECLARE
  v_role text;
  v_actor bigint;
  v_money_amount numeric := coalesce(p_money,0);
  v_coin_amount bigint := coalesce(p_coins,0);
  v_reason text := trim(coalesce(p_reason,''));
  v_request text := trim(coalesce(p_request_id,''));
  v_key text;
  v_existing public.economy_transactions;
  v_company_id bigint;
  v_money_before numeric;
  v_money_after numeric;
  v_revision bigint;
  v_coins_before bigint;
  v_coins_after bigint;
  v_tx_id bigint;
BEGIN
  v_role := private.current_admin_role();
  IF v_role NOT IN ('owner','admin','economy') THEN RAISE EXCEPTION 'Admin-Berechtigung fehlt'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id=p_user_id AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Spieler nicht gefunden'; END IF;
  IF v_money_amount < 0 OR v_coin_amount < 0 OR (v_money_amount=0 AND v_coin_amount=0) THEN RAISE EXCEPTION 'Mindestens eine positive Gutschrift erforderlich'; END IF;
  IF v_money_amount > 100000000 OR v_coin_amount > 1000000 THEN RAISE EXCEPTION 'Gutschrift überschreitet das Sicherheitslimit'; END IF;
  IF length(v_reason) < 3 OR length(v_reason) > 500 THEN RAISE EXCEPTION 'Begründung erforderlich (3-500 Zeichen)'; END IF;
  IF length(v_request) < 8 OR length(v_request) > 128 THEN RAISE EXCEPTION 'Ungültige Vorgangs-ID'; END IF;

  SELECT private.current_game_user_id() INTO v_actor;
  v_key := 'admin-comp:' || v_request;
  PERFORM pg_advisory_xact_lock(p_user_id);

  SELECT * INTO v_existing FROM public.economy_transactions
  WHERE user_id=p_user_id AND idempotency_key=v_key LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success',true,'replayed',true,'transactionId',v_existing.id,
      'moneyGranted',v_existing.money_delta,'coinsGranted',v_existing.coin_delta,
      'money',v_existing.money_after,'coins',v_existing.coins_after,
      'moneyRevision',coalesce((v_existing.metadata->>'moneyRevision')::bigint,0)
    );
  END IF;

  IF v_money_amount > 0 THEN
    SELECT id,coalesce(money,0),coalesce(money_revision,0)
    INTO v_company_id,v_money_before,v_revision
    FROM public.companies
    WHERE user_id=p_user_id AND closed_at IS NULL
    ORDER BY is_primary DESC,id LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Spieler hat keinen aktiven Betrieb für Firmengeld'; END IF;
    v_money_after := v_money_before + v_money_amount;
    v_revision := v_revision + 1;
    UPDATE public.companies
    SET money=v_money_after,
        money_revision=v_revision,
        game_state=jsonb_set(
          jsonb_set(coalesce(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money_after),true),
          '{moneyRevision}',to_jsonb(v_revision),true
        ),
        saved_at=now()
    WHERE user_id=p_user_id AND closed_at IS NULL;
  ELSE
    SELECT id,coalesce(money,0),coalesce(money_revision,0)
    INTO v_company_id,v_money_before,v_revision
    FROM public.companies WHERE user_id=p_user_id AND closed_at IS NULL
    ORDER BY is_primary DESC,id LIMIT 1;
    v_money_after := v_money_before;
  END IF;

  INSERT INTO public.coin_wallets(user_id,balance,updated_at)
  VALUES(p_user_id,0,now()) ON CONFLICT(user_id) DO NOTHING;
  SELECT balance INTO v_coins_before FROM public.coin_wallets WHERE user_id=p_user_id FOR UPDATE;
  v_coins_after := coalesce(v_coins_before,0) + v_coin_amount;
  IF v_coin_amount > 0 THEN
    UPDATE public.coin_wallets SET balance=v_coins_after,updated_at=now() WHERE user_id=p_user_id;
    INSERT INTO public.coin_transactions(user_id,amount,balance_after,transaction_type,reference_type,reference_id,note)
    VALUES(p_user_id,v_coin_amount,v_coins_after,'admin_compensation','admin_request',v_request,v_reason);
  END IF;

  INSERT INTO public.economy_transactions(
    user_id,company_id,operation,reference_type,reference_id,idempotency_key,
    coin_delta,money_delta,coins_before,coins_after,money_before,money_after,
    status,metadata,completed_at
  ) VALUES(
    p_user_id,v_company_id,'admin_compensation','admin_request',v_request,v_key,
    v_coin_amount,v_money_amount,v_coins_before,v_coins_after,v_money_before,v_money_after,
    'completed',jsonb_build_object('reason',v_reason,'adminRole',v_role,'adminUserId',v_actor,'moneyRevision',coalesce(v_revision,0)),now()
  ) RETURNING id INTO v_tx_id;

  INSERT INTO public.account_audit_log(user_id,event_type,details)
  VALUES(v_actor,'admin_player_compensation',jsonb_build_object(
    'target_user_id',p_user_id,'transaction_id',v_tx_id,'request_id',v_request,
    'money',v_money_amount,'coins',v_coin_amount,'reason',v_reason,'admin_role',v_role,
    'money_revision',coalesce(v_revision,0)
  ));

  RETURN jsonb_build_object(
    'success',true,'replayed',false,'transactionId',v_tx_id,
    'moneyGranted',v_money_amount,'coinsGranted',v_coin_amount,
    'money',v_money_after,'coins',v_coins_after,'moneyRevision',coalesce(v_revision,0)
  );
END
$function$;

REVOKE ALL ON FUNCTION public.admin_list_financial_transactions(integer,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_financial_transactions(integer,bigint) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_recover_financial_transaction(bigint,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_recover_financial_transaction(bigint,text) TO authenticated;
REVOKE ALL ON FUNCTION public.exchange_coins_for_company_money_v2(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.exchange_coins_for_company_money_v2(text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.exchange_coins_for_company_money(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_grant_player_compensation(bigint,numeric,bigint,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_player_compensation(bigint,numeric,bigint,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_set_company_money(bigint,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_company_money(bigint,numeric,text) TO authenticated;
