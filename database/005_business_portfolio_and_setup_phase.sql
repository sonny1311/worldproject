-- WorldProject: mehrere Betriebe pro Spieler + echte Gruendungsphase

DROP FUNCTION IF EXISTS public.claim_daily_coin_reward();
DROP TABLE IF EXISTS public.daily_coin_claims CASCADE;

ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_user_id_key;
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS slot_no SMALLINT NOT NULL DEFAULT 1 CHECK (slot_no BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS setup_phase VARCHAR(40) NOT NULL DEFAULT 'empty_building',
  ADD COLUMN IF NOT EXISTS building_state JSONB NOT NULL DEFAULT '{"kind":"starter_shell","rooms":[],"equipment":[],"ready":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.companies SET slot_no=1,is_primary=TRUE WHERE slot_no IS NULL OR slot_no=1;
CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_user_slot ON public.companies(user_id,slot_no);
CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_primary_per_user ON public.companies(user_id) WHERE is_primary;

CREATE OR REPLACE FUNCTION public.ensure_player_company(p_name TEXT DEFAULT NULL,p_industry TEXT DEFAULT NULL,p_company_type TEXT DEFAULT NULL)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_company public.companies;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  SELECT * INTO v_company FROM public.companies WHERE user_id=v_user_id AND slot_no=1 LIMIT 1;
  IF FOUND THEN RETURN v_company; END IF;
  INSERT INTO public.companies(user_id,name,industry,company_type,money,slot_no,setup_phase,is_primary,building_state)
  VALUES(v_user_id,COALESCE(NULLIF(BTRIM(p_name),''),'Meine Firma'),NULLIF(BTRIM(p_industry),''),NULLIF(BTRIM(p_company_type),''),50000,1,'empty_building',TRUE,'{"kind":"starter_shell","rooms":[],"equipment":[],"ready":false}'::jsonb)
  RETURNING * INTO v_company;
  RETURN v_company;
END; $$;

CREATE OR REPLACE FUNCTION public.create_player_business(p_name TEXT,p_industry TEXT,p_company_type TEXT,p_slot_no SMALLINT)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_company public.companies; v_count INTEGER;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_slot_no NOT BETWEEN 1 AND 4 THEN RAISE EXCEPTION 'Betriebsplatz muss zwischen 1 und 4 liegen'; END IF;
  SELECT COUNT(*) INTO v_count FROM public.companies WHERE user_id=v_user_id;
  IF v_count>=4 THEN RAISE EXCEPTION 'Maximal vier Betriebe pro Spieler'; END IF;
  IF EXISTS(SELECT 1 FROM public.companies WHERE user_id=v_user_id AND slot_no=p_slot_no) THEN RAISE EXCEPTION 'Dieser Betriebsplatz ist bereits belegt'; END IF;
  INSERT INTO public.companies(user_id,name,industry,company_type,money,slot_no,setup_phase,is_primary,building_state)
  VALUES(v_user_id,COALESCE(NULLIF(BTRIM(p_name),''),'Neuer Betrieb'),NULLIF(BTRIM(p_industry),''),NULLIF(BTRIM(p_company_type),''),CASE WHEN p_slot_no=1 THEN 50000 ELSE 0 END,p_slot_no,'empty_building',p_slot_no=1,'{"kind":"starter_shell","rooms":[],"equipment":[],"ready":false}'::jsonb)
  RETURNING * INTO v_company;
  RETURN v_company;
END; $$;

CREATE OR REPLACE FUNCTION public.save_player_business_state(p_company_id BIGINT,p_state JSONB)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_company public.companies;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_state IS NULL OR jsonb_typeof(p_state)<>'object' THEN RAISE EXCEPTION 'Ungueltiger Spielstand'; END IF;
  UPDATE public.companies SET game_state=p_state,saved_at=NOW()
  WHERE id=p_company_id AND user_id=v_user_id RETURNING * INTO v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'Betrieb nicht gefunden'; END IF;
  RETURN v_company;
END; $$;

CREATE OR REPLACE FUNCTION public.update_player_business_setup(p_company_id BIGINT,p_setup_phase TEXT,p_building_state JSONB)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_company public.companies;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_setup_phase NOT IN ('empty_building','furnishing','ready','operating') THEN RAISE EXCEPTION 'Ungueltige Gruendungsphase'; END IF;
  UPDATE public.companies
  SET setup_phase=p_setup_phase,building_state=COALESCE(p_building_state,building_state),saved_at=NOW()
  WHERE id=p_company_id AND user_id=v_user_id RETURNING * INTO v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'Betrieb nicht gefunden'; END IF;
  RETURN v_company;
END; $$;

CREATE OR REPLACE FUNCTION public.transfer_business_money(p_from_company_id BIGINT,p_to_company_id BIGINT,p_amount NUMERIC)
RETURNS TABLE(from_balance NUMERIC,to_balance NUMERIC) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_from NUMERIC; v_to NUMERIC;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_amount<=0 THEN RAISE EXCEPTION 'Betrag muss groesser 0 sein'; END IF;
  SELECT money INTO v_from FROM public.companies WHERE id=p_from_company_id AND user_id=v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quellbetrieb nicht gefunden'; END IF;
  SELECT money INTO v_to FROM public.companies WHERE id=p_to_company_id AND user_id=v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Zielbetrieb nicht gefunden'; END IF;
  IF v_from<p_amount THEN RAISE EXCEPTION 'Nicht genug Spielgeld im Quellbetrieb'; END IF;
  UPDATE public.companies SET money=money-p_amount WHERE id=p_from_company_id RETURNING money INTO v_from;
  UPDATE public.companies SET money=money+p_amount WHERE id=p_to_company_id RETURNING money INTO v_to;
  RETURN QUERY SELECT v_from,v_to;
END; $$;

CREATE OR REPLACE FUNCTION public.save_player_game_state(p_state JSONB)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_company public.companies;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_state IS NULL OR jsonb_typeof(p_state)<>'object' THEN RAISE EXCEPTION 'Ungueltiger Spielstand'; END IF;
  UPDATE public.companies SET game_state=p_state,saved_at=NOW() WHERE user_id=v_user_id AND slot_no=1 RETURNING * INTO v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'Noch kein Hauptbetrieb vorhanden'; END IF;
  RETURN v_company;
END; $$;

-- Coinhandel nutzt vorerst das Hauptunternehmen (Slot 1) als Spielgeldkonto.
CREATE OR REPLACE FUNCTION public.buy_coin_market_order(p_order_id BIGINT,p_amount BIGINT)
RETURNS TABLE(trade_id BIGINT,bought BIGINT,total_game_money NUMERIC,wallet_balance BIGINT,company_money NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_buyer BIGINT; v_seller BIGINT; v_remaining BIGINT; v_price NUMERIC; v_total NUMERIC; v_buyer_money NUMERIC; v_wallet BIGINT; v_trade BIGINT;
BEGIN
  IF p_amount<=0 THEN RAISE EXCEPTION 'Menge muss groesser 0 sein'; END IF;
  v_buyer:=private.require_active_game_user_id();
  SELECT seller_user_id,remaining_amount,price_per_coin INTO v_seller,v_remaining,v_price FROM public.coin_market_orders WHERE id=p_order_id AND status='open' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verkaufsorder nicht gefunden'; END IF;
  IF v_seller=v_buyer THEN RAISE EXCEPTION 'Eigene Coins koennen nicht gekauft werden'; END IF;
  IF p_amount>v_remaining THEN RAISE EXCEPTION 'Nicht genuegend Coins in dieser Order'; END IF;
  v_total:=p_amount*v_price;
  SELECT money INTO v_buyer_money FROM public.companies WHERE user_id=v_buyer AND slot_no=1 FOR UPDATE;
  IF v_buyer_money IS NULL THEN RAISE EXCEPTION 'Kaeufer hat noch keinen Hauptbetrieb'; END IF;
  IF v_buyer_money<v_total THEN RAISE EXCEPTION 'Nicht genuegend Spielgeld'; END IF;
  PERFORM 1 FROM public.companies WHERE user_id=v_seller AND slot_no=1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verkaeufer hat keinen Hauptbetrieb'; END IF;
  UPDATE public.companies SET money=money-v_total WHERE user_id=v_buyer AND slot_no=1 RETURNING money INTO v_buyer_money;
  UPDATE public.companies SET money=money+v_total WHERE user_id=v_seller AND slot_no=1;
  UPDATE public.coin_wallets SET balance=balance+p_amount,updated_at=NOW() WHERE user_id=v_buyer RETURNING balance INTO v_wallet;
  UPDATE public.coin_market_orders SET remaining_amount=remaining_amount-p_amount,status=CASE WHEN remaining_amount-p_amount=0 THEN 'filled' ELSE status END,closed_at=CASE WHEN remaining_amount-p_amount=0 THEN NOW() ELSE closed_at END WHERE id=p_order_id;
  INSERT INTO public.coin_market_trades(order_id,seller_user_id,buyer_user_id,amount,price_per_coin,total_game_money) VALUES(p_order_id,v_seller,v_buyer,p_amount,v_price,v_total) RETURNING id INTO v_trade;
  INSERT INTO public.coin_transactions(user_id,amount,balance_after,transaction_type,reference_type,reference_id,note) VALUES(v_buyer,p_amount,v_wallet,'market_buy','coin_market_trade',v_trade::text,'Coins am Spielermarkt gekauft');
  RETURN QUERY SELECT v_trade,p_amount,v_total,v_wallet,v_buyer_money;
END; $$;

REVOKE ALL ON FUNCTION public.create_player_business(TEXT,TEXT,TEXT,SMALLINT) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.save_player_business_state(BIGINT,JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.update_player_business_setup(BIGINT,TEXT,JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.transfer_business_money(BIGINT,BIGINT,NUMERIC) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_player_business(TEXT,TEXT,TEXT,SMALLINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_player_business_state(BIGINT,JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_player_business_setup(BIGINT,TEXT,JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_business_money(BIGINT,BIGINT,NUMERIC) TO authenticated;

NOTIFY pgrst,'reload schema';