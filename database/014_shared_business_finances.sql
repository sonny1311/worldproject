-- WorldProject: Alle aktiven Betriebe eines Spielers verwenden ein gemeinsames Firmenkonto.
-- Der Kontostand wird in jeder Betriebszeile gespiegelt, damit beim Betriebswechsel immer derselbe Betrag sichtbar ist.

CREATE OR REPLACE FUNCTION public.save_player_business_state(p_company_id BIGINT,p_state JSONB)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user_id BIGINT;v_company public.companies;v_money NUMERIC;v_primary_money NUMERIC;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_state IS NULL OR jsonb_typeof(p_state)<>'object' THEN RAISE EXCEPTION 'Ungueltiger Spielstand'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.companies WHERE id=p_company_id AND user_id=v_user_id AND closed_at IS NULL) THEN RAISE EXCEPTION 'Betrieb nicht gefunden'; END IF;
  BEGIN v_money:=(p_state->>'money')::NUMERIC; EXCEPTION WHEN OTHERS THEN v_money:=NULL; END;
  IF v_money IS NULL THEN
    SELECT COALESCE((CASE WHEN game_state ? 'money' THEN game_state->>'money' ELSE NULL END)::NUMERIC,money,0)
      INTO v_primary_money FROM public.companies WHERE user_id=v_user_id AND is_primary=TRUE AND closed_at IS NULL ORDER BY id LIMIT 1;
    v_money:=COALESCE(v_primary_money,0);
  END IF;
  p_state:=jsonb_set(p_state,'{money}',to_jsonb(v_money),true);
  UPDATE public.companies SET game_state=p_state,money=v_money,saved_at=NOW()
    WHERE id=p_company_id AND user_id=v_user_id AND closed_at IS NULL RETURNING * INTO v_company;
  UPDATE public.companies SET money=v_money,game_state=jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),saved_at=NOW()
    WHERE user_id=v_user_id AND closed_at IS NULL AND id<>p_company_id;
  RETURN v_company;
END; $$;

CREATE OR REPLACE FUNCTION public.save_player_game_state(p_state JSONB)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user_id BIGINT;v_company public.companies;v_money NUMERIC;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_state IS NULL OR jsonb_typeof(p_state)<>'object' THEN RAISE EXCEPTION 'Ungueltiger Spielstand'; END IF;
  BEGIN v_money:=(p_state->>'money')::NUMERIC; EXCEPTION WHEN OTHERS THEN v_money:=NULL; END;
  IF v_money IS NULL THEN SELECT money INTO v_money FROM public.companies WHERE user_id=v_user_id AND is_primary=TRUE AND closed_at IS NULL ORDER BY id LIMIT 1; END IF;
  v_money:=COALESCE(v_money,0);p_state:=jsonb_set(p_state,'{money}',to_jsonb(v_money),true);
  UPDATE public.companies SET game_state=p_state,money=v_money,saved_at=NOW() WHERE user_id=v_user_id AND is_primary=TRUE AND closed_at IS NULL RETURNING * INTO v_company;
  IF NOT FOUND THEN RAISE EXCEPTION 'Noch kein Hauptbetrieb vorhanden'; END IF;
  UPDATE public.companies SET money=v_money,game_state=jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),saved_at=NOW()
    WHERE user_id=v_user_id AND is_primary=FALSE AND closed_at IS NULL;
  RETURN v_company;
END; $$;

CREATE OR REPLACE FUNCTION public.create_player_business_paid(p_name TEXT,p_industry TEXT,p_company_type TEXT,p_slot_no SMALLINT,p_source_company_id BIGINT,p_location_class TEXT,p_property_mode TEXT,p_size_level INTEGER)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user_id BIGINT;v_company public.companies;v_source_state JSONB;v_money NUMERIC;v_location TEXT;v_mode TEXT;v_size INTEGER;v_purchase_base NUMERIC;v_rent_base NUMERIC;v_upfront NUMERIC;v_monthly NUMERIC;v_now_ms BIGINT;v_finance JSONB;v_cost_ledger JSONB;v_new_state JSONB;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_slot_no<1 THEN RAISE EXCEPTION 'Betriebsplatz muss mindestens 1 sein';END IF;
  IF NOT EXISTS(SELECT 1 FROM public.companies WHERE user_id=v_user_id AND closed_at IS NULL) THEN RAISE EXCEPTION 'Zuerst muss ein Hauptbetrieb bestehen';END IF;
  IF EXISTS(SELECT 1 FROM public.companies WHERE user_id=v_user_id AND slot_no=p_slot_no AND closed_at IS NULL) THEN RAISE EXCEPTION 'Dieser Betriebsplatz ist bereits belegt';END IF;
  v_location:=COALESCE(NULLIF(BTRIM(p_location_class),''),'smallTown');v_mode:=LOWER(COALESCE(NULLIF(BTRIM(p_property_mode),''),'rent'));v_size:=GREATEST(1,COALESCE(p_size_level,1));
  IF v_mode NOT IN ('rent','buy') THEN RAISE EXCEPTION 'Unbekannte Immobilienart';END IF;
  CASE v_location WHEN 'rural' THEN v_purchase_base:=65000;v_rent_base:=650;WHEN 'smallTown' THEN v_purchase_base:=105000;v_rent_base:=1050;WHEN 'city' THEN v_purchase_base:=185000;v_rent_base:=1850;WHEN 'metro' THEN v_purchase_base:=330000;v_rent_base:=3300;ELSE RAISE EXCEPTION 'Unbekannte Standortklasse';END CASE;
  IF v_mode='buy' THEN v_upfront:=ROUND(v_purchase_base*POWER(1.55,v_size-1));v_monthly:=0;ELSE v_upfront:=ROUND(v_rent_base*3*POWER(1.35,v_size-1));v_monthly:=ROUND(v_rent_base*POWER(1.35,v_size-1));END IF;
  SELECT COALESCE(game_state,'{}'::jsonb),COALESCE((CASE WHEN game_state ? 'money' THEN game_state->>'money' ELSE NULL END)::NUMERIC,money,0)
    INTO v_source_state,v_money FROM public.companies WHERE id=p_source_company_id AND user_id=v_user_id AND closed_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quellbetrieb nicht gefunden';END IF;
  IF v_money<v_upfront THEN IF v_mode='buy' THEN RAISE EXCEPTION 'Nicht genug Spielgeld für den Immobilienkauf: benötigt %',v_upfront;ELSE RAISE EXCEPTION 'Nicht genug Spielgeld für die Miet-Startkosten: benötigt %',v_upfront;END IF;END IF;
  v_money:=v_money-v_upfront;v_now_ms:=(EXTRACT(EPOCH FROM clock_timestamp())*1000)::BIGINT;
  v_finance:=CASE WHEN jsonb_typeof(v_source_state->'financialLog')='array' THEN v_source_state->'financialLog' ELSE '[]'::jsonb END;v_cost_ledger:=CASE WHEN jsonb_typeof(v_source_state->'costLedger')='array' THEN v_source_state->'costLedger' ELSE '[]'::jsonb END;
  v_source_state:=jsonb_set(v_source_state,'{money}',to_jsonb(v_money),true);
  v_source_state:=jsonb_set(v_source_state,'{financialLog}',v_finance||jsonb_build_array(jsonb_build_object('type','business_property','amount',-v_upfront,'time',v_now_ms,'slotNo',p_slot_no,'locationClass',v_location,'propertyMode',v_mode,'monthlyRent',v_monthly)),true);
  v_source_state:=jsonb_set(v_source_state,'{costLedger}',v_cost_ledger||jsonb_build_array(jsonb_build_object('type','investment','category',CASE WHEN v_mode='buy' THEN 'property_purchase' ELSE 'property_rental_entry' END,'amount',v_upfront,'time',v_now_ms,'slotNo',p_slot_no,'locationClass',v_location)),true);
  UPDATE public.companies SET money=v_money,game_state=jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(v_money),true),saved_at=NOW() WHERE user_id=v_user_id AND closed_at IS NULL;
  UPDATE public.companies SET game_state=v_source_state WHERE id=p_source_company_id AND user_id=v_user_id;
  v_new_state:=jsonb_build_object('money',v_money,'property',jsonb_build_object('locationClass',v_location,'mode',v_mode,'sizeLevel',v_size,'upfrontPaid',v_upfront,'purchaseValue',CASE WHEN v_mode='buy' THEN v_upfront ELSE 0 END,'monthlyRent',v_monthly,'startedAt',v_now_ms,'lastRentChargedAt',v_now_ms));
  INSERT INTO public.companies(user_id,name,industry,company_type,money,slot_no,setup_phase,is_primary,building_state,game_state)
  VALUES(v_user_id,COALESCE(NULLIF(BTRIM(p_name),''),'Neuer Betrieb'),NULLIF(BTRIM(p_industry),''),NULLIF(BTRIM(p_company_type),''),v_money,p_slot_no,'empty_building',FALSE,'{"kind":"starter_shell","rooms":[],"equipment":[],"ready":false}'::jsonb,v_new_state) RETURNING * INTO v_company;
  RETURN v_company;
END; $$;

CREATE OR REPLACE FUNCTION public.transfer_business_money(p_from_company_id BIGINT,p_to_company_id BIGINT,p_amount NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  RAISE EXCEPTION 'Alle eigenen Betriebe verwenden dasselbe Firmenkonto; ein Geldtransfer zwischen eigenen Betrieben ist nicht erforderlich';
END; $$;

-- Bestehende offene Mehrbetriebe sofort auf den Kontostand ihres Hauptbetriebs synchronisieren.
WITH balances AS (
  SELECT user_id,COALESCE((CASE WHEN game_state ? 'money' THEN game_state->>'money' ELSE NULL END)::NUMERIC,money,0) AS shared_money
  FROM public.companies WHERE is_primary=TRUE AND closed_at IS NULL
)
UPDATE public.companies c SET money=b.shared_money,game_state=jsonb_set(COALESCE(c.game_state,'{}'::jsonb),'{money}',to_jsonb(b.shared_money),true),saved_at=NOW()
FROM balances b WHERE c.user_id=b.user_id AND c.closed_at IS NULL;

REVOKE ALL ON FUNCTION public.save_player_business_state(BIGINT,JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.save_player_game_state(JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.create_player_business_paid(TEXT,TEXT,TEXT,SMALLINT,BIGINT,TEXT,TEXT,INTEGER) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_player_business_state(BIGINT,JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_player_game_state(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_player_business_paid(TEXT,TEXT,TEXT,SMALLINT,BIGINT,TEXT,TEXT,INTEGER) TO authenticated;
NOTIFY pgrst,'reload schema';
