-- ORVUNO security hardening: browser snapshots must never be authoritative for company money.
-- companies.money is the canonical balance. game_state.money is only a compatibility mirror.

CREATE OR REPLACE FUNCTION public.save_player_business_state(p_company_id bigint, p_state jsonb)
RETURNS public.companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id bigint;
  v_company public.companies;
  v_money numeric;
  v_existing_state jsonb;
  v_property jsonb;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_state IS NULL OR jsonb_typeof(p_state)<>'object' THEN RAISE EXCEPTION 'Ungueltiger Spielstand'; END IF;
  IF octet_length(p_state::text) > 5242880 THEN RAISE EXCEPTION 'Spielstand ist zu gross'; END IF;
  SELECT * INTO v_company FROM public.companies WHERE id=p_company_id AND user_id=v_user_id AND closed_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Betrieb nicht gefunden'; END IF;
  v_money:=COALESCE(v_company.money,0);
  v_existing_state:=COALESCE(v_company.game_state,'{}'::jsonb);
  v_property:=CASE WHEN jsonb_typeof(v_existing_state->'property')='object' THEN v_existing_state->'property' ELSE NULL END;
  p_state:=jsonb_set(p_state,'{money}',to_jsonb(v_money),true);
  IF v_property IS NOT NULL THEN p_state:=jsonb_set(p_state,'{property}',v_property,true); ELSE p_state:=p_state-'property'; END IF;
  UPDATE public.companies SET game_state=p_state,saved_at=NOW() WHERE id=p_company_id AND user_id=v_user_id AND closed_at IS NULL RETURNING * INTO v_company;
  UPDATE public.companies SET game_state=jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),saved_at=NOW() WHERE user_id=v_user_id AND closed_at IS NULL AND id<>p_company_id;
  RETURN v_company;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_player_game_state(p_state jsonb)
RETURNS public.companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id bigint;
  v_company public.companies;
  v_money numeric;
  v_existing_state jsonb;
  v_property jsonb;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_state IS NULL OR jsonb_typeof(p_state)<>'object' THEN RAISE EXCEPTION 'Ungueltiger Spielstand'; END IF;
  IF octet_length(p_state::text) > 5242880 THEN RAISE EXCEPTION 'Spielstand ist zu gross'; END IF;
  SELECT * INTO v_company FROM public.companies WHERE user_id=v_user_id AND is_primary=TRUE AND closed_at IS NULL ORDER BY id LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Noch kein Hauptbetrieb vorhanden'; END IF;
  v_money:=COALESCE(v_company.money,0);
  v_existing_state:=COALESCE(v_company.game_state,'{}'::jsonb);
  v_property:=CASE WHEN jsonb_typeof(v_existing_state->'property')='object' THEN v_existing_state->'property' ELSE NULL END;
  p_state:=jsonb_set(p_state,'{money}',to_jsonb(v_money),true);
  IF v_property IS NOT NULL THEN p_state:=jsonb_set(p_state,'{property}',v_property,true); ELSE p_state:=p_state-'property'; END IF;
  UPDATE public.companies SET game_state=p_state,saved_at=NOW() WHERE id=v_company.id RETURNING * INTO v_company;
  UPDATE public.companies SET game_state=jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),saved_at=NOW() WHERE user_id=v_user_id AND is_primary=FALSE AND closed_at IS NULL;
  RETURN v_company;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.save_player_business_state(bigint,jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.save_player_game_state(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_player_business_state(bigint,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_player_game_state(jsonb) TO authenticated;
