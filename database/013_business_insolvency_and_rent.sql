-- WorldProject: laufende Miete, Zahlungsunfaehigkeit und Zwangsverkauf.
-- Nebenbetriebe werden bei negativem Kontostand geschlossen. Gekaufte Immobilien
-- werden dabei automatisch zu 75 % des Kaufpreises verwertet; ein positiver
-- Restbetrag fliesst an den Hauptbetrieb zurueck.

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS closure_reason TEXT;

DROP INDEX IF EXISTS public.uq_companies_user_slot;
CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_user_slot_active
ON public.companies(user_id,slot_no) WHERE closed_at IS NULL;

CREATE OR REPLACE FUNCTION public.process_player_business_finances()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user_id BIGINT;
  v_primary public.companies;
  v_company public.companies;
  v_state JSONB;
  v_property JSONB;
  v_money NUMERIC;
  v_mode TEXT;
  v_monthly NUMERIC;
  v_started BIGINT;
  v_last BIGINT;
  v_now BIGINT;
  v_period_ms BIGINT := 2592000000; -- 30 Tage = ein Mietmonat
  v_due INTEGER;
  v_charge NUMERIC;
  v_purchase NUMERIC;
  v_sale NUMERIC;
  v_remainder NUMERIC;
  v_primary_state JSONB;
  v_primary_money NUMERIC;
  v_events JSONB := '[]'::jsonb;
  v_finance JSONB;
  v_cost_ledger JSONB;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  v_now:=(EXTRACT(EPOCH FROM clock_timestamp())*1000)::BIGINT;

  SELECT * INTO v_primary FROM public.companies
  WHERE user_id=v_user_id AND is_primary=TRUE AND closed_at IS NULL
  ORDER BY id LIMIT 1 FOR UPDATE;

  FOR v_company IN
    SELECT * FROM public.companies
    WHERE user_id=v_user_id AND is_primary=FALSE AND closed_at IS NULL
    ORDER BY id FOR UPDATE
  LOOP
    v_state:=COALESCE(v_company.game_state,'{}'::jsonb);
    v_property:=CASE WHEN jsonb_typeof(v_state->'property')='object' THEN v_state->'property' ELSE '{}'::jsonb END;
    BEGIN v_money:=COALESCE((v_state->>'money')::NUMERIC,v_company.money,0); EXCEPTION WHEN OTHERS THEN v_money:=COALESCE(v_company.money,0); END;
    v_mode:=LOWER(COALESCE(v_property->>'mode','rent'));
    BEGIN v_monthly:=COALESCE((v_property->>'monthlyRent')::NUMERIC,0); EXCEPTION WHEN OTHERS THEN v_monthly:=0; END;
    BEGIN v_started:=COALESCE((v_property->>'startedAt')::BIGINT,(EXTRACT(EPOCH FROM v_company.founded_at)*1000)::BIGINT,v_now); EXCEPTION WHEN OTHERS THEN v_started:=v_now; END;
    BEGIN v_last:=COALESCE((v_property->>'lastRentChargedAt')::BIGINT,v_started); EXCEPTION WHEN OTHERS THEN v_last:=v_started; END;

    IF v_mode='rent' AND v_monthly>0 AND v_now>v_last THEN
      v_due:=FLOOR((v_now-v_last)::NUMERIC/v_period_ms)::INTEGER;
      IF v_due>0 THEN
        v_charge:=v_monthly*v_due;
        v_money:=v_money-v_charge;
        v_last:=v_last+(v_due::BIGINT*v_period_ms);
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
        BEGIN v_purchase:=COALESCE((v_property->>'purchaseValue')::NUMERIC,(v_property->>'upfrontPaid')::NUMERIC,0); EXCEPTION WHEN OTHERS THEN v_purchase:=0; END;
        v_sale:=ROUND(v_purchase*0.75);
        v_remainder:=GREATEST(0,v_money+v_sale);

        IF v_primary.id IS NOT NULL AND v_remainder>0 THEN
          v_primary_state:=COALESCE(v_primary.game_state,'{}'::jsonb);
          BEGIN v_primary_money:=COALESCE((v_primary_state->>'money')::NUMERIC,v_primary.money,0); EXCEPTION WHEN OTHERS THEN v_primary_money:=COALESCE(v_primary.money,0); END;
          v_primary_money:=v_primary_money+v_remainder;
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
END; $$;

REVOKE ALL ON FUNCTION public.process_player_business_finances() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.process_player_business_finances() TO authenticated;

-- Aktive Betriebe duerfen einen frei gewordenen Slot wiederverwenden.
CREATE OR REPLACE FUNCTION public.create_player_business_paid(
  p_name TEXT,p_industry TEXT,p_company_type TEXT,p_slot_no SMALLINT,p_source_company_id BIGINT,
  p_location_class TEXT,p_property_mode TEXT,p_size_level INTEGER
)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user_id BIGINT;v_company public.companies;v_source_money NUMERIC;v_source_state JSONB;
  v_location TEXT;v_mode TEXT;v_size INTEGER;v_purchase_base NUMERIC;v_rent_base NUMERIC;
  v_upfront NUMERIC;v_monthly NUMERIC;v_now_ms BIGINT;v_finance JSONB;v_cost_ledger JSONB;v_new_state JSONB;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_slot_no<1 THEN RAISE EXCEPTION 'Betriebsplatz muss mindestens 1 sein'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.companies WHERE user_id=v_user_id AND closed_at IS NULL) THEN RAISE EXCEPTION 'Zuerst muss ein Hauptbetrieb bestehen'; END IF;
  IF EXISTS(SELECT 1 FROM public.companies WHERE user_id=v_user_id AND slot_no=p_slot_no AND closed_at IS NULL) THEN RAISE EXCEPTION 'Dieser Betriebsplatz ist bereits belegt'; END IF;
  v_location:=COALESCE(NULLIF(BTRIM(p_location_class),''),'smallTown');v_mode:=LOWER(COALESCE(NULLIF(BTRIM(p_property_mode),''),'rent'));v_size:=GREATEST(1,COALESCE(p_size_level,1));
  IF v_mode NOT IN ('rent','buy') THEN RAISE EXCEPTION 'Unbekannte Immobilienart'; END IF;
  CASE v_location WHEN 'rural' THEN v_purchase_base:=65000;v_rent_base:=650;WHEN 'smallTown' THEN v_purchase_base:=105000;v_rent_base:=1050;WHEN 'city' THEN v_purchase_base:=185000;v_rent_base:=1850;WHEN 'metro' THEN v_purchase_base:=330000;v_rent_base:=3300;ELSE RAISE EXCEPTION 'Unbekannte Standortklasse';END CASE;
  IF v_mode='buy' THEN v_upfront:=ROUND(v_purchase_base*POWER(1.55,v_size-1));v_monthly:=0;ELSE v_upfront:=ROUND(v_rent_base*3*POWER(1.35,v_size-1));v_monthly:=ROUND(v_rent_base*POWER(1.35,v_size-1));END IF;
  SELECT money,COALESCE(game_state,'{}'::jsonb) INTO v_source_money,v_source_state FROM public.companies WHERE id=p_source_company_id AND user_id=v_user_id AND closed_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quellbetrieb nicht gefunden'; END IF;
  IF jsonb_typeof(v_source_state)='object' AND v_source_state?'money' THEN BEGIN v_source_money:=(v_source_state->>'money')::NUMERIC;EXCEPTION WHEN OTHERS THEN NULL;END;END IF;
  IF v_source_money IS NULL THEN SELECT money INTO v_source_money FROM public.companies WHERE id=p_source_company_id;END IF;
  IF v_source_money<v_upfront THEN IF v_mode='buy' THEN RAISE EXCEPTION 'Nicht genug Spielgeld für den Immobilienkauf: benötigt %',v_upfront;ELSE RAISE EXCEPTION 'Nicht genug Spielgeld für die Miet-Startkosten: benötigt %',v_upfront;END IF;END IF;
  v_source_money:=v_source_money-v_upfront;v_now_ms:=(EXTRACT(EPOCH FROM clock_timestamp())*1000)::BIGINT;
  v_finance:=CASE WHEN jsonb_typeof(v_source_state->'financialLog')='array' THEN v_source_state->'financialLog' ELSE '[]'::jsonb END;v_cost_ledger:=CASE WHEN jsonb_typeof(v_source_state->'costLedger')='array' THEN v_source_state->'costLedger' ELSE '[]'::jsonb END;
  v_source_state:=jsonb_set(v_source_state,'{money}',to_jsonb(v_source_money),true);v_source_state:=jsonb_set(v_source_state,'{financialLog}',v_finance||jsonb_build_array(jsonb_build_object('type','business_property','amount',-v_upfront,'time',v_now_ms,'slotNo',p_slot_no,'locationClass',v_location,'propertyMode',v_mode,'monthlyRent',v_monthly)),true);v_source_state:=jsonb_set(v_source_state,'{costLedger}',v_cost_ledger||jsonb_build_array(jsonb_build_object('type','investment','category',CASE WHEN v_mode='buy' THEN 'property_purchase' ELSE 'property_rental_entry' END,'amount',v_upfront,'time',v_now_ms,'slotNo',p_slot_no,'locationClass',v_location)),true);
  UPDATE public.companies SET money=v_source_money,game_state=v_source_state,saved_at=NOW() WHERE id=p_source_company_id AND user_id=v_user_id;
  v_new_state:=jsonb_build_object('money',0,'property',jsonb_build_object('locationClass',v_location,'mode',v_mode,'sizeLevel',v_size,'upfrontPaid',v_upfront,'purchaseValue',CASE WHEN v_mode='buy' THEN v_upfront ELSE 0 END,'monthlyRent',v_monthly,'startedAt',v_now_ms,'lastRentChargedAt',v_now_ms));
  INSERT INTO public.companies(user_id,name,industry,company_type,money,slot_no,setup_phase,is_primary,building_state,game_state)
  VALUES(v_user_id,COALESCE(NULLIF(BTRIM(p_name),''),'Neuer Betrieb'),NULLIF(BTRIM(p_industry),''),NULLIF(BTRIM(p_company_type),''),0,p_slot_no,'empty_building',FALSE,'{"kind":"starter_shell","rooms":[],"equipment":[],"ready":false}'::jsonb,v_new_state) RETURNING * INTO v_company;
  RETURN v_company;
END; $$;
REVOKE ALL ON FUNCTION public.create_player_business_paid(TEXT,TEXT,TEXT,SMALLINT,BIGINT,TEXT,TEXT,INTEGER) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_player_business_paid(TEXT,TEXT,TEXT,SMALLINT,BIGINT,TEXT,TEXT,INTEGER) TO authenticated;

NOTIFY pgrst,'reload schema';
