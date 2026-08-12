-- WorldProject Supabase Auth linkage + RLS baseline
CREATE SCHEMA IF NOT EXISTS private;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

CREATE OR REPLACE FUNCTION private.current_game_user_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.users
  WHERE auth_user_id = (SELECT auth.uid())
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION private.current_game_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_game_user_id() TO authenticated, service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_market_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_market_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT SELECT (id, public_id, auth_user_id, username, email, status, country_code, language_code,
              email_verified_at, terms_accepted_at, privacy_accepted_at, created_at, last_login_at,
              terms_version, privacy_version, last_seen_at, display_name, profile_image_url)
ON public.users TO authenticated;
GRANT UPDATE (country_code, language_code, display_name, profile_image_url)
ON public.users TO authenticated;

CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND auth_user_id = (SELECT auth.uid()));
CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND auth_user_id = (SELECT auth.uid()))
WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND auth_user_id = (SELECT auth.uid()));

GRANT SELECT ON public.companies TO authenticated;
GRANT UPDATE (name, industry, company_type) ON public.companies TO authenticated;
CREATE POLICY companies_select_own ON public.companies FOR SELECT TO authenticated
USING (user_id = (SELECT private.current_game_user_id()));
CREATE POLICY companies_update_own ON public.companies FOR UPDATE TO authenticated
USING (user_id = (SELECT private.current_game_user_id()))
WITH CHECK (user_id = (SELECT private.current_game_user_id()));

GRANT SELECT ON public.coin_wallets TO authenticated;
CREATE POLICY coin_wallets_select_own ON public.coin_wallets FOR SELECT TO authenticated
USING (user_id = (SELECT private.current_game_user_id()));

GRANT SELECT ON public.coin_transactions TO authenticated;
CREATE POLICY coin_transactions_select_own ON public.coin_transactions FOR SELECT TO authenticated
USING (user_id = (SELECT private.current_game_user_id()));

GRANT SELECT ON public.coin_market_orders TO authenticated;
GRANT SELECT ON public.coin_market_trades TO authenticated;
CREATE POLICY coin_market_orders_read_authenticated ON public.coin_market_orders FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY coin_market_trades_read_authenticated ON public.coin_market_trades FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

GRANT SELECT ON public.guilds TO authenticated;
GRANT SELECT ON public.guild_members TO authenticated;
CREATE POLICY guilds_read_authenticated ON public.guilds FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY guild_members_read_authenticated ON public.guild_members FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

GRANT SELECT ON public.household_declarations TO authenticated;
CREATE POLICY household_declarations_select_own ON public.household_declarations FOR SELECT TO authenticated
USING (user_id = (SELECT private.current_game_user_id()));

GRANT SELECT ON public.account_deletion_requests TO authenticated;
CREATE POLICY account_deletion_requests_select_own ON public.account_deletion_requests FOR SELECT TO authenticated
USING (user_id = (SELECT private.current_game_user_id()));

-- Sicherheits- und Auth-Hilfstabellen bleiben absichtlich ohne Client-Policies.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';
