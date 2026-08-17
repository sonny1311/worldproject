-- ORVUNO / WorldProject
-- 019_security_hardening_client_trust_boundaries.sql
--
-- Security hardening discovered during the Closed-Alpha audit.
-- IMPORTANT: the current game still calculates several economy/inventory operations
-- in the browser. The save RPCs therefore cannot yet make money fully server-authoritative
-- without breaking legitimate gameplay. This migration narrows the trust boundary,
-- closes concrete RPC bypasses, and protects server-generated property state.
-- A later server-authoritative economy migration is still required before a cheat-resistant
-- public/open alpha.

-- Client roles never need structural/destructive table privileges.
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE INSERT ON TABLE public.users FROM authenticated;

-- Messages must be written through send_player_message(), where length/rate/recipient
-- checks are enforced. Direct REST INSERT/UPDATE would bypass those controls.
REVOKE INSERT, UPDATE ON TABLE public.player_messages FROM authenticated;

-- The free company RPC is exclusively the one-time initial-company path.
CREATE OR REPLACE FUNCTION public.create_player_business(
  p_name text,
  p_industry text,
  p_company_type text,
  p_slot_no smallint
)
RETURNS public.companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id bigint;
  v_company public.companies;
BEGIN
  v_user_id := private.require_active_game_user_id();

  IF p_slot_no IS DISTINCT FROM 1::smallint THEN
    RAISE EXCEPTION 'Der erste Betrieb muss Betriebsplatz 1 verwenden';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.companies
    WHERE user_id = v_user_id AND closed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Weitere Betriebe müssen über die bezahlte Expansion angelegt werden';
  END IF;

  INSERT INTO public.companies(
    user_id,name,industry,company_type,money,slot_no,setup_phase,is_primary,building_state,game_state
  ) VALUES (
    v_user_id,
    COALESCE(NULLIF(BTRIM(p_name),''),'Mein Betrieb'),
    NULLIF(BTRIM(p_industry),''),
    NULLIF(BTRIM(p_company_type),''),
    0,1,'empty_building',TRUE,
    '{"kind":"starter_shell","rooms":[],"equipment":[],"ready":false}'::jsonb,
    '{"money":0}'::jsonb
  )
  RETURNING * INTO v_company;

  RETURN v_company;
END;
$$;
REVOKE ALL ON FUNCTION public.create_player_business(text,text,text,smallint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_player_business(text,text,text,smallint) TO authenticated;

-- Persist browser state with bounded payload size. Money remains temporarily client-sourced
-- because legitimate economy actions are still browser-authoritative. Property data, however,
-- is server-generated and must not be overwritten through generic save payloads.
CREATE OR REPLACE FUNCTION public.save_player_game_state(p_state jsonb)
RETURNS public.companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id bigint;
  v_company public.companies;
  v_money numeric;
  v_existing_state jsonb;
  v_property jsonb;
BEGIN
  v_user_id := private.require_active_game_user_id();

  IF p_state IS NULL OR jsonb_typeof(p_state) <> 'object' THEN
    RAISE EXCEPTION 'Ungueltiger Spielstand';
  END IF;
  IF octet_length(p_state::text) > 5242880 THEN
    RAISE EXCEPTION 'Spielstand ist zu gross';
  END IF;

  SELECT * INTO v_company
  FROM public.companies
  WHERE user_id = v_user_id AND is_primary = TRUE AND closed_at IS NULL
  ORDER BY id LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Noch kein Hauptbetrieb vorhanden'; END IF;

  BEGIN
    v_money := (p_state->>'money')::numeric;
  EXCEPTION WHEN OTHERS THEN
    v_money := NULL;
  END;
  IF v_money IS NULL THEN v_money := COALESCE(v_company.money,0); END IF;
  IF v_money < -1000000000000 OR v_money > 1000000000000 THEN
    RAISE EXCEPTION 'Ungueltiger Kontostand';
  END IF;

  v_existing_state := COALESCE(v_company.game_state,'{}'::jsonb);
  v_property := CASE
    WHEN jsonb_typeof(v_existing_state->'property') = 'object' THEN v_existing_state->'property'
    ELSE NULL
  END;

  p_state := jsonb_set(p_state,'{money}',to_jsonb(v_money),true);
  IF v_property IS NOT NULL THEN
    p_state := jsonb_set(p_state,'{property}',v_property,true);
  ELSE
    p_state := p_state - 'property';
  END IF;

  UPDATE public.companies
  SET game_state = p_state, money = v_money, saved_at = NOW()
  WHERE id = v_company.id
  RETURNING * INTO v_company;

  UPDATE public.companies
  SET money = v_money,
      game_state = jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),
      saved_at = NOW()
  WHERE user_id = v_user_id AND is_primary = FALSE AND closed_at IS NULL;

  RETURN v_company;
END;
$$;
REVOKE ALL ON FUNCTION public.save_player_game_state(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_player_game_state(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_player_business_state(p_company_id bigint,p_state jsonb)
RETURNS public.companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id bigint;
  v_company public.companies;
  v_money numeric;
  v_existing_state jsonb;
  v_property jsonb;
BEGIN
  v_user_id := private.require_active_game_user_id();

  IF p_state IS NULL OR jsonb_typeof(p_state) <> 'object' THEN
    RAISE EXCEPTION 'Ungueltiger Spielstand';
  END IF;
  IF octet_length(p_state::text) > 5242880 THEN
    RAISE EXCEPTION 'Spielstand ist zu gross';
  END IF;

  SELECT * INTO v_company
  FROM public.companies
  WHERE id = p_company_id AND user_id = v_user_id AND closed_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Betrieb nicht gefunden'; END IF;

  BEGIN
    v_money := (p_state->>'money')::numeric;
  EXCEPTION WHEN OTHERS THEN
    v_money := NULL;
  END;
  IF v_money IS NULL THEN v_money := COALESCE(v_company.money,0); END IF;
  IF v_money < -1000000000000 OR v_money > 1000000000000 THEN
    RAISE EXCEPTION 'Ungueltiger Kontostand';
  END IF;

  v_existing_state := COALESCE(v_company.game_state,'{}'::jsonb);
  v_property := CASE
    WHEN jsonb_typeof(v_existing_state->'property') = 'object' THEN v_existing_state->'property'
    ELSE NULL
  END;

  p_state := jsonb_set(p_state,'{money}',to_jsonb(v_money),true);
  IF v_property IS NOT NULL THEN
    p_state := jsonb_set(p_state,'{property}',v_property,true);
  ELSE
    p_state := p_state - 'property';
  END IF;

  UPDATE public.companies
  SET game_state = p_state, money = v_money, saved_at = NOW()
  WHERE id = p_company_id AND user_id = v_user_id AND closed_at IS NULL
  RETURNING * INTO v_company;

  UPDATE public.companies
  SET money = v_money,
      game_state = jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),
      saved_at = NOW()
  WHERE user_id = v_user_id AND closed_at IS NULL AND id <> p_company_id;

  RETURN v_company;
END;
$$;
REVOKE ALL ON FUNCTION public.save_player_business_state(bigint,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_player_business_state(bigint,jsonb) TO authenticated;

-- Paid expansion uses companies.money as the authoritative balance. It must never trust
-- game_state.money, because generic browser state can be edited by the client.
CREATE OR REPLACE FUNCTION public.create_player_business_paid(
  p_name text,p_industry text,p_company_type text,p_slot_no smallint,p_source_company_id bigint,
  p_location_class text,p_property_mode text,p_size_level integer
)
RETURNS public.companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id bigint;v_company public.companies;v_source_state jsonb;v_money numeric;
  v_location text;v_mode text;v_size integer;v_purchase_base numeric;v_rent_base numeric;
  v_upfront numeric;v_monthly numeric;v_now_ms bigint;v_finance jsonb;v_cost_ledger jsonb;v_new_state jsonb;
BEGIN
  v_user_id := private.require_active_game_user_id();
  IF p_slot_no < 2 THEN RAISE EXCEPTION 'Zusatzbetriebe müssen Betriebsplatz 2 oder höher verwenden'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.companies WHERE user_id=v_user_id AND is_primary=TRUE AND closed_at IS NULL) THEN
    RAISE EXCEPTION 'Zuerst muss ein Hauptbetrieb bestehen';
  END IF;
  IF EXISTS(SELECT 1 FROM public.companies WHERE user_id=v_user_id AND slot_no=p_slot_no AND closed_at IS NULL) THEN
    RAISE EXCEPTION 'Dieser Betriebsplatz ist bereits belegt';
  END IF;

  v_location := COALESCE(NULLIF(BTRIM(p_location_class),''),'smallTown');
  v_mode := LOWER(COALESCE(NULLIF(BTRIM(p_property_mode),''),'rent'));
  v_size := GREATEST(1,COALESCE(p_size_level,1));
  IF v_mode NOT IN ('rent','buy') THEN RAISE EXCEPTION 'Unbekannte Immobilienart'; END IF;

  CASE v_location
    WHEN 'rural' THEN v_purchase_base:=65000;v_rent_base:=650;
    WHEN 'smallTown' THEN v_purchase_base:=105000;v_rent_base:=1050;
    WHEN 'city' THEN v_purchase_base:=185000;v_rent_base:=1850;
    WHEN 'metro' THEN v_purchase_base:=330000;v_rent_base:=3300;
    ELSE RAISE EXCEPTION 'Unbekannte Standortklasse';
  END CASE;

  IF v_mode='buy' THEN
    v_upfront:=ROUND(v_purchase_base*POWER(1.55,v_size-1));v_monthly:=0;
  ELSE
    v_upfront:=ROUND(v_rent_base*3*POWER(1.35,v_size-1));
    v_monthly:=ROUND(v_rent_base*POWER(1.35,v_size-1));
  END IF;

  SELECT COALESCE(game_state,'{}'::jsonb),COALESCE(money,0)
  INTO v_source_state,v_money
  FROM public.companies
  WHERE id=p_source_company_id AND user_id=v_user_id AND closed_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quellbetrieb nicht gefunden'; END IF;

  IF v_money < v_upfront THEN
    IF v_mode='buy' THEN
      RAISE EXCEPTION 'Nicht genug Spielgeld für den Immobilienkauf: benötigt %',v_upfront;
    ELSE
      RAISE EXCEPTION 'Nicht genug Spielgeld für die Miet-Startkosten: benötigt %',v_upfront;
    END IF;
  END IF;

  v_money:=v_money-v_upfront;
  v_now_ms:=(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint;
  v_finance:=CASE WHEN jsonb_typeof(v_source_state->'financialLog')='array' THEN v_source_state->'financialLog' ELSE '[]'::jsonb END;
  v_cost_ledger:=CASE WHEN jsonb_typeof(v_source_state->'costLedger')='array' THEN v_source_state->'costLedger' ELSE '[]'::jsonb END;
  v_source_state:=jsonb_set(v_source_state,'{money}',to_jsonb(v_money),true);
  v_source_state:=jsonb_set(v_source_state,'{financialLog}',v_finance||jsonb_build_array(jsonb_build_object('type','business_property','amount',-v_upfront,'time',v_now_ms,'slotNo',p_slot_no,'locationClass',v_location,'propertyMode',v_mode,'monthlyRent',v_monthly)),true);
  v_source_state:=jsonb_set(v_source_state,'{costLedger}',v_cost_ledger||jsonb_build_array(jsonb_build_object('type','investment','category',CASE WHEN v_mode='buy' THEN 'property_purchase' ELSE 'property_rental_entry' END,'amount',v_upfront,'time',v_now_ms,'slotNo',p_slot_no,'locationClass',v_location)),true);

  UPDATE public.companies
  SET money=v_money,
      game_state=jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),
      saved_at=NOW()
  WHERE user_id=v_user_id AND closed_at IS NULL;
  UPDATE public.companies SET game_state=v_source_state WHERE id=p_source_company_id AND user_id=v_user_id;

  v_new_state:=jsonb_build_object('money',v_money,'property',jsonb_build_object('locationClass',v_location,'mode',v_mode,'sizeLevel',v_size,'upfrontPaid',v_upfront,'purchaseValue',CASE WHEN v_mode='buy' THEN v_upfront ELSE 0 END,'monthlyRent',v_monthly,'startedAt',v_now_ms,'lastRentChargedAt',v_now_ms));
  INSERT INTO public.companies(user_id,name,industry,company_type,money,slot_no,setup_phase,is_primary,building_state,game_state)
  VALUES(v_user_id,COALESCE(NULLIF(BTRIM(p_name),''),'Neuer Betrieb'),NULLIF(BTRIM(p_industry),''),NULLIF(BTRIM(p_company_type),''),v_money,p_slot_no,'empty_building',FALSE,'{"kind":"starter_shell","rooms":[],"equipment":[],"ready":false}'::jsonb,v_new_state)
  RETURNING * INTO v_company;

  RETURN v_company;
END;
$$;
REVOKE ALL ON FUNCTION public.create_player_business_paid(text,text,text,smallint,bigint,text,text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_player_business_paid(text,text,text,smallint,bigint,text,text,integer) TO authenticated;

-- Loan terms are bounded by the existing in-game bank ranges. The client-provided monthly
-- payment is ignored and recomputed on the server. A transaction advisory lock prevents
-- parallel requests from racing past the outstanding-debt ceiling.
CREATE OR REPLACE FUNCTION public.take_expansion_loan(
  p_company_id bigint,
  p_amount numeric,
  p_annual_rate numeric,
  p_term_months integer,
  p_monthly_payment numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user bigint;
  v_id bigint;
  v_monthly_rate numeric;
  v_factor numeric;
  v_payment numeric;
  v_outstanding numeric;
BEGIN
  v_user := private.require_active_game_user_id();

  IF NOT EXISTS(
    SELECT 1 FROM public.companies
    WHERE id=p_company_id AND user_id=v_user AND closed_at IS NULL
    FOR UPDATE
  ) THEN
    RAISE EXCEPTION 'Betrieb nicht gefunden';
  END IF;

  IF p_amount < 5000 OR p_amount > 5000000 THEN
    RAISE EXCEPTION 'Kreditbetrag muss zwischen 5.000 und 5.000.000 liegen';
  END IF;
  IF p_term_months < 12 OR p_term_months > 120 THEN
    RAISE EXCEPTION 'Kreditlaufzeit muss zwischen 12 und 120 Monaten liegen';
  END IF;
  IF p_annual_rate < 0.025 OR p_annual_rate > 0.18 THEN
    RAISE EXCEPTION 'Zinssatz muss zwischen 2,5 und 18 Prozent liegen';
  END IF;

  PERFORM pg_advisory_xact_lock(v_user);

  SELECT COALESCE(SUM(remaining_principal),0)
  INTO v_outstanding
  FROM public.business_expansion_loans
  WHERE user_id=v_user AND status='active';

  IF v_outstanding + p_amount > 5000000 THEN
    RAISE EXCEPTION 'Maximales offenes Kreditvolumen von 5.000.000 überschritten';
  END IF;

  v_monthly_rate := p_annual_rate / 12;
  v_factor := POWER(1 + v_monthly_rate,p_term_months);
  v_payment := ROUND((p_amount*v_monthly_rate*v_factor/(v_factor-1))::numeric,2);
  IF v_payment <= 0 THEN RAISE EXCEPTION 'Ungueltige Finanzierung'; END IF;

  INSERT INTO public.business_expansion_loans(
    user_id,company_id,principal,annual_rate,term_months,remaining_principal,monthly_payment
  ) VALUES (
    v_user,p_company_id,p_amount,p_annual_rate,p_term_months,p_amount,v_payment
  ) RETURNING id INTO v_id;

  UPDATE public.companies
  SET money=COALESCE(money,0)+p_amount,
      debt=COALESCE(debt,0)+p_amount,
      game_state=jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(COALESCE(money,0)+p_amount),true),
      saved_at=NOW()
  WHERE user_id=v_user AND closed_at IS NULL;

  RETURN jsonb_build_object(
    'loan_id',v_id,
    'amount',p_amount,
    'annual_rate',p_annual_rate,
    'term_months',p_term_months,
    'monthly_payment',v_payment
  );
END;
$$;
REVOKE ALL ON FUNCTION public.take_expansion_loan(bigint,numeric,numeric,integer,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.take_expansion_loan(bigint,numeric,numeric,integer,numeric) TO authenticated;

-- Rent/insolvency processing starts from companies.money, never browser-supplied JSON money.
CREATE OR REPLACE FUNCTION public.process_player_business_finances()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id bigint;v_primary public.companies;v_company public.companies;v_state jsonb;v_property jsonb;
  v_money numeric;v_mode text;v_monthly numeric;v_started bigint;v_last bigint;v_now bigint;
  v_period_ms bigint:=2592000000;v_due integer;v_charge numeric;v_purchase numeric;v_sale numeric;
  v_remainder numeric;v_primary_state jsonb;v_primary_money numeric;v_events jsonb:='[]'::jsonb;
  v_finance jsonb;v_cost_ledger jsonb;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  v_now:=(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint;

  SELECT * INTO v_primary
  FROM public.companies
  WHERE user_id=v_user_id AND is_primary=TRUE AND closed_at IS NULL
  ORDER BY id LIMIT 1 FOR UPDATE;

  FOR v_company IN
    SELECT * FROM public.companies
    WHERE user_id=v_user_id AND is_primary=FALSE AND closed_at IS NULL
    ORDER BY id FOR UPDATE
  LOOP
    v_state:=COALESCE(v_company.game_state,'{}'::jsonb);
    v_property:=CASE WHEN jsonb_typeof(v_state->'property')='object' THEN v_state->'property' ELSE '{}'::jsonb END;
    v_money:=COALESCE(v_company.money,0);
    v_mode:=LOWER(COALESCE(v_property->>'mode','rent'));
    BEGIN v_monthly:=COALESCE((v_property->>'monthlyRent')::numeric,0); EXCEPTION WHEN OTHERS THEN v_monthly:=0; END;
    BEGIN v_started:=COALESCE((v_property->>'startedAt')::bigint,(EXTRACT(EPOCH FROM v_company.founded_at)*1000)::bigint,v_now); EXCEPTION WHEN OTHERS THEN v_started:=v_now; END;
    BEGIN v_last:=COALESCE((v_property->>'lastRentChargedAt')::bigint,v_started); EXCEPTION WHEN OTHERS THEN v_last:=v_started; END;

    IF v_mode='rent' AND v_monthly>0 AND v_now>v_last THEN
      v_due:=FLOOR((v_now-v_last)::numeric/v_period_ms)::integer;
      IF v_due>0 THEN
        v_charge:=v_monthly*v_due;
        v_money:=v_money-v_charge;
        v_last:=v_last+(v_due::bigint*v_period_ms);
        v_property:=jsonb_set(v_property,'{lastRentChargedAt}',to_jsonb(v_last),true);
        v_property:=jsonb_set(v_property,'{lastRentCharge}',to_jsonb(v_charge),true);
        v_property:=jsonb_set(v_property,'{lastRentPeriods}',to_jsonb(v_due),true);
        v_state:=jsonb_set(v_state,'{property}',v_property,true);
        v_finance:=CASE WHEN jsonb_typeof(v_state->'financialLog')='array' THEN v_state->'financialLog' ELSE '[]'::jsonb END;
        v_cost_ledger:=CASE WHEN jsonb_typeof(v_state->'costLedger')='array' THEN v_state->'costLedger' ELSE '[]'::jsonb END;
        v_state:=jsonb_set(v_state,'{financialLog}',v_finance||jsonb_build_array(jsonb_build_object('type','property_rent','amount',-v_charge,'time',v_now,'months',v_due)),true);
        v_state:=jsonb_set(v_state,'{costLedger}',v_cost_ledger||jsonb_build_array(jsonb_build_object('type','operating','category','property_rent','amount',v_charge,'time',v_now,'months',v_due)),true);
      END IF;
    END IF;

    v_state:=jsonb_set(v_state,'{money}',to_jsonb(v_money),true);
    UPDATE public.companies SET money=v_money,game_state=v_state,saved_at=NOW() WHERE id=v_company.id;

    IF v_money<0 THEN
      IF v_mode='buy' THEN
        BEGIN v_purchase:=COALESCE((v_property->>'purchaseValue')::numeric,(v_property->>'upfrontPaid')::numeric,0); EXCEPTION WHEN OTHERS THEN v_purchase:=0; END;
        v_sale:=ROUND(v_purchase*0.75);
        v_remainder:=GREATEST(0,v_money+v_sale);

        IF v_primary.id IS NOT NULL AND v_remainder>0 THEN
          v_primary_state:=COALESCE(v_primary.game_state,'{}'::jsonb);
          v_primary_money:=COALESCE(v_primary.money,0)+v_remainder;
          v_primary_state:=jsonb_set(v_primary_state,'{money}',to_jsonb(v_primary_money),true);
          v_finance:=CASE WHEN jsonb_typeof(v_primary_state->'financialLog')='array' THEN v_primary_state->'financialLog' ELSE '[]'::jsonb END;
          v_primary_state:=jsonb_set(v_primary_state,'{financialLog}',v_finance||jsonb_build_array(jsonb_build_object('type','forced_property_sale_transfer','amount',v_remainder,'time',v_now,'fromCompanyId',v_company.id)),true);
          UPDATE public.companies SET money=v_primary_money,game_state=v_primary_state,saved_at=NOW() WHERE id=v_primary.id;
          v_primary.money:=v_primary_money;v_primary.game_state:=v_primary_state;
        END IF;

        v_property:=jsonb_set(v_property,'{forcedSaleValue}',to_jsonb(v_sale),true);
        v_property:=jsonb_set(v_property,'{forcedSaleRate}',to_jsonb(0.75),true);
        v_property:=jsonb_set(v_property,'{forcedSaleAt}',to_jsonb(v_now),true);
        v_state:=jsonb_set(v_state,'{property}',v_property,true);
        v_state:=jsonb_set(v_state,'{money}',to_jsonb(0),true);
        v_state:=jsonb_set(v_state,'{businessStatus}',to_jsonb('closed'::text),true);
        UPDATE public.companies SET money=0,game_state=v_state,closed_at=NOW(),closure_reason='forced_property_sale',saved_at=NOW() WHERE id=v_company.id;
        v_events:=v_events||jsonb_build_array(jsonb_build_object('type','forced_sale','companyId',v_company.id,'companyName',v_company.name,'saleValue',v_sale,'transferToPrimary',v_remainder,'rate',0.75));
      ELSE
        v_state:=jsonb_set(v_state,'{money}',to_jsonb(0),true);
        v_state:=jsonb_set(v_state,'{businessStatus}',to_jsonb('closed'::text),true);
        UPDATE public.companies SET money=0,game_state=v_state,closed_at=NOW(),closure_reason='rent_insolvency',saved_at=NOW() WHERE id=v_company.id;
        v_events:=v_events||jsonb_build_array(jsonb_build_object('type','rent_closed','companyId',v_company.id,'companyName',v_company.name,'monthlyRent',v_monthly));
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('events',v_events,'processedAt',v_now);
END;
$$;
REVOKE ALL ON FUNCTION public.process_player_business_finances() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_player_business_finances() TO authenticated;

NOTIFY pgrst,'reload schema';
