-- ORVUNO Premium & Coins hub: product catalogue + server-authoritative coin-to-company-money exchange.

INSERT INTO public.store_products(sku,kind,label,price_eur,coin_amount,premium_plan,duration_days,active)
VALUES
 ('premium_4w','premium','4 Wochen Premium',3.99,NULL,'premium_basic',28,TRUE),
 ('premium_3m','premium','3 Monate Premium',9.99,NULL,'premium_basic',90,TRUE),
 ('premium_6m','premium','6 Monate Premium',17.99,NULL,'premium_basic',180,TRUE),
 ('premium_12m','premium','12 Monate Premium',29.99,NULL,'premium_basic',365,TRUE),
 ('coins_100','coins','100 Coins',0.99,100,NULL,NULL,TRUE),
 ('coins_550','coins','550 Coins',4.99,550,NULL,NULL,TRUE),
 ('coins_1200','coins','1.200 Coins',9.99,1200,NULL,NULL,TRUE),
 ('coins_2600','coins','2.600 Coins',19.99,2600,NULL,NULL,TRUE),
 ('coins_6000','coins','6.000 Coins',39.99,6000,NULL,NULL,TRUE),
 ('coins_13000','coins','13.000 Coins',79.99,13000,NULL,NULL,TRUE),
 ('coins_26000','coins','26.000 Coins',149.99,26000,NULL,NULL,TRUE),
 ('coins_50000','coins','50.000 Coins',249.99,50000,NULL,NULL,TRUE)
ON CONFLICT (sku) DO UPDATE SET kind=EXCLUDED.kind,label=EXCLUDED.label,price_eur=EXCLUDED.price_eur,coin_amount=EXCLUDED.coin_amount,premium_plan=EXCLUDED.premium_plan,duration_days=EXCLUDED.duration_days,active=EXCLUDED.active;

UPDATE public.store_products SET active=FALSE WHERE sku IN ('premium_basic','premium_plus');

CREATE OR REPLACE FUNCTION public.get_orvuno_monetization_state()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user_id bigint;v_coins bigint;v_money numeric;v_plan text;v_until timestamptz;
BEGIN
 v_user_id:=private.require_active_game_user_id();
 SELECT COALESCE(balance,0) INTO v_coins FROM public.coin_wallets WHERE user_id=v_user_id;
 SELECT COALESCE(money,0) INTO v_money FROM public.companies WHERE user_id=v_user_id AND closed_at IS NULL ORDER BY is_primary DESC,id LIMIT 1;
 SELECT premium_plan,premium_until INTO v_plan,v_until FROM public.users WHERE id=v_user_id;
 RETURN jsonb_build_object('coins',COALESCE(v_coins,0),'money',COALESCE(v_money,0),'premiumPlan',v_plan,'premiumUntil',v_until);
END;$$;
REVOKE ALL ON FUNCTION public.get_orvuno_monetization_state() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_orvuno_monetization_state() TO authenticated;

CREATE OR REPLACE FUNCTION public.exchange_coins_for_company_money(p_tier text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user_id bigint;v_cost bigint;v_credit numeric;v_balance bigint;v_money numeric;
BEGIN
 v_user_id:=private.require_active_game_user_id();
 CASE p_tier
  WHEN 'money_65000' THEN v_cost:=200;v_credit:=65000;
  WHEN 'money_200000' THEN v_cost:=525;v_credit:=200000;
  WHEN 'money_450000' THEN v_cost:=1150;v_credit:=450000;
  WHEN 'money_1000000' THEN v_cost:=2400;v_credit:=1000000;
  WHEN 'money_2800000' THEN v_cost:=6500;v_credit:=2800000;
  WHEN 'money_7500000' THEN v_cost:=15000;v_credit:=7500000;
  ELSE RAISE EXCEPTION 'Unbekanntes Firmengeld-Paket';
 END CASE;
 PERFORM pg_advisory_xact_lock(v_user_id);
 INSERT INTO public.coin_wallets(user_id,balance,updated_at) VALUES(v_user_id,0,NOW()) ON CONFLICT(user_id) DO NOTHING;
 SELECT balance INTO v_balance FROM public.coin_wallets WHERE user_id=v_user_id FOR UPDATE;
 IF v_balance<v_cost THEN RAISE EXCEPTION 'Nicht genügend Coins'; END IF;
 SELECT COALESCE(money,0) INTO v_money FROM public.companies WHERE user_id=v_user_id AND closed_at IS NULL ORDER BY is_primary DESC,id LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Noch kein aktiver Betrieb vorhanden'; END IF;
 v_money:=v_money+v_credit;
 UPDATE public.coin_wallets SET balance=balance-v_cost,updated_at=NOW() WHERE user_id=v_user_id RETURNING balance INTO v_balance;
 INSERT INTO public.coin_transactions(user_id,amount,balance_after,transaction_type,reference_type,reference_id,note) VALUES(v_user_id,-v_cost,v_balance,'company_money_exchange','monetization_tier',p_tier,'Coins gegen Firmengeld getauscht');
 UPDATE public.companies SET money=v_money,game_state=jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),saved_at=NOW() WHERE user_id=v_user_id AND closed_at IS NULL;
 RETURN jsonb_build_object('success',true,'tier',p_tier,'coinsSpent',v_cost,'moneyCredited',v_credit,'coins',v_balance,'money',v_money);
END;$$;
REVOKE ALL ON FUNCTION public.exchange_coins_for_company_money(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.exchange_coins_for_company_money(text) TO authenticated;

NOTIFY pgrst,'reload schema';