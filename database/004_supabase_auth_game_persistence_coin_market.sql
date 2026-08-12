-- WorldProject: Supabase Auth, persistenter Spielstand und sicherer Coinmarkt

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS saved_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.daily_coin_claims (
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount BIGINT NOT NULL DEFAULT 1 CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, claim_date)
);
ALTER TABLE public.daily_coin_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.daily_coin_claims FROM anon, authenticated;
GRANT SELECT ON public.daily_coin_claims TO authenticated;
CREATE POLICY daily_coin_claims_select_own ON public.daily_coin_claims FOR SELECT TO authenticated
USING (user_id = (SELECT private.current_game_user_id()));

CREATE OR REPLACE FUNCTION private.require_active_game_user_id()
RETURNS BIGINT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_status TEXT;
BEGIN
  SELECT id,status INTO v_user_id,v_status FROM public.users
  WHERE auth_user_id=(SELECT auth.uid()) LIMIT 1;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Kein verknuepfter Spielaccount'; END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'Account ist nicht zum Spielen freigegeben'; END IF;
  RETURN v_user_id;
END; $$;
REVOKE ALL ON FUNCTION private.require_active_game_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.require_active_game_user_id() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.handle_worldproject_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_game_user_id BIGINT; v_username TEXT; v_country TEXT; v_language TEXT;
BEGIN
  v_username:=NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'username','')),'');
  IF v_username IS NULL THEN v_username:='spieler_'||REPLACE(LEFT(NEW.id::text,8),'-',''); END IF;
  v_country:=UPPER(LEFT(COALESCE(NULLIF(NEW.raw_user_meta_data->>'country_code',''),'DE'),2));
  v_language:=LEFT(COALESCE(NULLIF(NEW.raw_user_meta_data->>'language_code',''),'de'),10);
  INSERT INTO public.users(public_id,auth_user_id,username,email,password_hash,status,country_code,language_code,email_verified_at,terms_accepted_at,privacy_accepted_at,terms_version,privacy_version,display_name)
  VALUES(NEW.id,NEW.id,v_username,NEW.email,'SUPABASE_AUTH',CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active' ELSE 'verification_pending' END,v_country,v_language,NEW.email_confirmed_at,NOW(),NOW(),COALESCE(NULLIF(NEW.raw_user_meta_data->>'terms_version',''),'1.0'),COALESCE(NULLIF(NEW.raw_user_meta_data->>'privacy_version',''),'1.0'),v_username)
  ON CONFLICT(auth_user_id) DO UPDATE SET email=EXCLUDED.email,email_verified_at=COALESCE(public.users.email_verified_at,EXCLUDED.email_verified_at),status=CASE WHEN public.users.status IN ('restricted','suspended','banned') THEN public.users.status WHEN EXCLUDED.email_verified_at IS NOT NULL THEN 'active' ELSE public.users.status END
  RETURNING id INTO v_game_user_id;
  INSERT INTO public.coin_wallets(user_id,balance) VALUES(v_game_user_id,0) ON CONFLICT(user_id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS worldproject_auth_user_created ON auth.users;
CREATE TRIGGER worldproject_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_worldproject_auth_user();
DROP TRIGGER IF EXISTS worldproject_auth_user_updated ON auth.users;
CREATE TRIGGER worldproject_auth_user_updated AFTER UPDATE OF email,email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_worldproject_auth_user();
REVOKE ALL ON FUNCTION public.handle_worldproject_auth_user() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ensure_player_company(p_name TEXT DEFAULT NULL,p_industry TEXT DEFAULT NULL,p_company_type TEXT DEFAULT NULL)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_company public.companies;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  SELECT * INTO v_company FROM public.companies WHERE user_id=v_user_id;
  IF FOUND THEN RETURN v_company; END IF;
  INSERT INTO public.companies(user_id,name,industry,company_type)
  VALUES(v_user_id,COALESCE(NULLIF(BTRIM(p_name),''),'Meine Firma'),NULLIF(BTRIM(p_industry),''),NULLIF(BTRIM(p_company_type),''))
  RETURNING * INTO v_company;
  RETURN v_company;
END; $$;

CREATE OR REPLACE FUNCTION public.save_player_game_state(p_state JSONB)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_company public.companies;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_state IS NULL OR jsonb_typeof(p_state)<>'object' THEN RAISE EXCEPTION 'Ungueltiger Spielstand'; END IF;
  UPDATE public.companies SET game_state=p_state,saved_at=NOW() WHERE user_id=v_user_id RETURNING * INTO v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'Noch keine Firma vorhanden'; END IF;
  RETURN v_company;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_daily_coin_reward()
RETURNS TABLE(balance BIGINT,awarded BIGINT,already_claimed BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_balance BIGINT;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  INSERT INTO public.daily_coin_claims(user_id,claim_date,amount) VALUES(v_user_id,CURRENT_DATE,1) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN
    SELECT w.balance INTO v_balance FROM public.coin_wallets w WHERE w.user_id=v_user_id;
    RETURN QUERY SELECT v_balance,0::BIGINT,TRUE; RETURN;
  END IF;
  UPDATE public.coin_wallets SET balance=coin_wallets.balance+1,updated_at=NOW() WHERE user_id=v_user_id RETURNING coin_wallets.balance INTO v_balance;
  INSERT INTO public.coin_transactions(user_id,amount,balance_after,transaction_type,reference_type,reference_id,note)
  VALUES(v_user_id,1,v_balance,'daily_reward','daily_claim',CURRENT_DATE::text,'Taeglicher Coin-Bonus');
  RETURN QUERY SELECT v_balance,1::BIGINT,FALSE;
END; $$;

CREATE OR REPLACE FUNCTION public.create_coin_sell_order(p_amount BIGINT,p_price_per_coin NUMERIC)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_balance BIGINT; v_order_id BIGINT;
BEGIN
  IF p_amount<=0 OR p_price_per_coin<=0 THEN RAISE EXCEPTION 'Ungueltige Orderdaten'; END IF;
  v_user_id:=private.require_active_game_user_id();
  SELECT balance INTO v_balance FROM public.coin_wallets WHERE user_id=v_user_id FOR UPDATE;
  IF v_balance<p_amount THEN RAISE EXCEPTION 'Nicht genuegend Coins'; END IF;
  UPDATE public.coin_wallets SET balance=balance-p_amount,updated_at=NOW() WHERE user_id=v_user_id RETURNING balance INTO v_balance;
  INSERT INTO public.coin_market_orders(seller_user_id,original_amount,remaining_amount,price_per_coin) VALUES(v_user_id,p_amount,p_amount,p_price_per_coin) RETURNING id INTO v_order_id;
  INSERT INTO public.coin_transactions(user_id,amount,balance_after,transaction_type,reference_type,reference_id,note) VALUES(v_user_id,-p_amount,v_balance,'market_escrow','coin_market_order',v_order_id::text,'Coins fuer Verkaufsorder reserviert');
  RETURN v_order_id;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_coin_sell_order(p_order_id BIGINT)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_remaining BIGINT; v_balance BIGINT;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  SELECT remaining_amount INTO v_remaining FROM public.coin_market_orders WHERE id=p_order_id AND seller_user_id=v_user_id AND status='open' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Offene Verkaufsorder nicht gefunden'; END IF;
  UPDATE public.coin_market_orders SET status='cancelled',closed_at=NOW() WHERE id=p_order_id;
  UPDATE public.coin_wallets SET balance=balance+v_remaining,updated_at=NOW() WHERE user_id=v_user_id RETURNING balance INTO v_balance;
  INSERT INTO public.coin_transactions(user_id,amount,balance_after,transaction_type,reference_type,reference_id,note) VALUES(v_user_id,v_remaining,v_balance,'market_escrow_refund','coin_market_order',p_order_id::text,'Nicht verkaufte Coins zurueckgebucht');
  RETURN v_balance;
END; $$;

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
  SELECT money INTO v_buyer_money FROM public.companies WHERE user_id=v_buyer FOR UPDATE;
  IF v_buyer_money IS NULL THEN RAISE EXCEPTION 'Kaeufer hat noch keine Firma'; END IF;
  IF v_buyer_money<v_total THEN RAISE EXCEPTION 'Nicht genuegend Spielgeld'; END IF;
  PERFORM 1 FROM public.companies WHERE user_id=v_seller FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verkaeufer hat keine Firma'; END IF;
  UPDATE public.companies SET money=money-v_total WHERE user_id=v_buyer RETURNING money INTO v_buyer_money;
  UPDATE public.companies SET money=money+v_total WHERE user_id=v_seller;
  UPDATE public.coin_wallets SET balance=balance+p_amount,updated_at=NOW() WHERE user_id=v_buyer RETURNING balance INTO v_wallet;
  UPDATE public.coin_market_orders SET remaining_amount=remaining_amount-p_amount,status=CASE WHEN remaining_amount-p_amount=0 THEN 'filled' ELSE status END,closed_at=CASE WHEN remaining_amount-p_amount=0 THEN NOW() ELSE closed_at END WHERE id=p_order_id;
  INSERT INTO public.coin_market_trades(order_id,seller_user_id,buyer_user_id,amount,price_per_coin,total_game_money) VALUES(p_order_id,v_seller,v_buyer,p_amount,v_price,v_total) RETURNING id INTO v_trade;
  INSERT INTO public.coin_transactions(user_id,amount,balance_after,transaction_type,reference_type,reference_id,note) VALUES(v_buyer,p_amount,v_wallet,'market_buy','coin_market_trade',v_trade::text,'Coins am Spielermarkt gekauft');
  RETURN QUERY SELECT v_trade,p_amount,v_total,v_wallet,v_buyer_money;
END; $$;

REVOKE ALL ON FUNCTION public.ensure_player_company(TEXT,TEXT,TEXT) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.save_player_game_state(JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.claim_daily_coin_reward() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.create_coin_sell_order(BIGINT,NUMERIC) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.cancel_coin_sell_order(BIGINT) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.buy_coin_market_order(BIGINT,BIGINT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ensure_player_company(TEXT,TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_player_game_state(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_coin_reward() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_coin_sell_order(BIGINT,NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_coin_sell_order(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_coin_market_order(BIGINT,BIGINT) TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.daily_coin_claims TO service_role;

NOTIFY pgrst,'reload schema';