-- ORVUNO / WorldProject
-- 020_disable_coin_market_until_server_authoritative_economy.sql
--
-- The current game still persists several money-producing/consuming actions from
-- browser-authoritative state. Allowing that money to purchase server-side Coins
-- would let a manipulated game-state balance be converted into protected Coin assets.
-- Therefore new Coin sell orders and purchases remain disabled until the economy
-- is migrated to validated server-side transactions.
-- Existing open sell orders can still be cancelled via cancel_coin_sell_order(),
-- so escrowed Coins are never trapped by this safety switch.

CREATE OR REPLACE FUNCTION public.create_coin_sell_order(
  p_amount bigint,
  p_price_per_coin numeric
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Coin-Spielermarkt ist bis zur serverautoritativen Wirtschaft deaktiviert';
END;
$$;
REVOKE ALL ON FUNCTION public.create_coin_sell_order(bigint,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_coin_sell_order(bigint,numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.buy_coin_market_order(
  p_order_id bigint,
  p_amount bigint
)
RETURNS TABLE(
  trade_id bigint,
  bought bigint,
  total_game_money numeric,
  wallet_balance bigint,
  company_money numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Coin-Spielermarkt ist bis zur serverautoritativen Wirtschaft deaktiviert';
END;
$$;
REVOKE ALL ON FUNCTION public.buy_coin_market_order(bigint,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buy_coin_market_order(bigint,bigint) TO authenticated;

NOTIFY pgrst,'reload schema';
