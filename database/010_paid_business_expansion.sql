-- WorldProject: normale weitere Betriebe bezahlen ihre Gründungskosten serverseitig.
-- Die aktuelle Entwicklungsfreigabe für den zweiten Testbetrieb nutzt weiterhin bewusst den separaten freien Testpfad.

CREATE OR REPLACE FUNCTION public.create_player_business_paid(p_name TEXT,p_industry TEXT,p_company_type TEXT,p_slot_no SMALLINT,p_source_company_id BIGINT)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user_id BIGINT;
  v_company public.companies;
  v_count INTEGER;
  v_cost NUMERIC;
  v_source_money NUMERIC;
  v_source_state JSONB;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_slot_no < 1 THEN RAISE EXCEPTION 'Betriebsplatz muss mindestens 1 sein'; END IF;
  SELECT COUNT(*) INTO v_count FROM public.companies WHERE user_id=v_user_id;
  IF v_count < 1 THEN RAISE EXCEPTION 'Zuerst muss ein Hauptbetrieb bestehen'; END IF;
  IF EXISTS(SELECT 1 FROM public.companies WHERE user_id=v_user_id AND slot_no=p_slot_no) THEN RAISE EXCEPTION 'Dieser Betriebsplatz ist bereits belegt'; END IF;

  SELECT money,COALESCE(game_state,'{}'::jsonb) INTO v_source_money,v_source_state
  FROM public.companies WHERE id=p_source_company_id AND user_id=v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quellbetrieb nicht gefunden'; END IF;
  IF jsonb_typeof(v_source_state)='object' AND v_source_state ? 'money' THEN
    BEGIN v_source_money:=(v_source_state->>'money')::NUMERIC; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  IF v_source_money IS NULL THEN SELECT money INTO v_source_money FROM public.companies WHERE id=p_source_company_id; END IF;

  -- Muss mit BusinessExpansionSystem.expansionRequirements(existingBusinesses).creationCost übereinstimmen.
  v_cost:=ROUND(75000*POWER(1.72,GREATEST(v_count-1,0)));
  IF v_source_money < v_cost THEN RAISE EXCEPTION 'Nicht genug Spielgeld für die Betriebsgründung: benötigt %',v_cost; END IF;
  v_source_money:=v_source_money-v_cost;

  UPDATE public.companies
  SET money=v_source_money,
      game_state=jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(v_source_money),true),
      saved_at=NOW()
  WHERE id=p_source_company_id AND user_id=v_user_id;

  INSERT INTO public.companies(user_id,name,industry,company_type,money,slot_no,setup_phase,is_primary,building_state,game_state)
  VALUES(v_user_id,COALESCE(NULLIF(BTRIM(p_name),''),'Neuer Betrieb'),NULLIF(BTRIM(p_industry),''),NULLIF(BTRIM(p_company_type),''),0,p_slot_no,'empty_building',FALSE,'{"kind":"starter_shell","rooms":[],"equipment":[],"ready":false}'::jsonb,'{"money":0}'::jsonb)
  RETURNING * INTO v_company;
  RETURN v_company;
END; $$;

REVOKE ALL ON FUNCTION public.create_player_business_paid(TEXT,TEXT,TEXT,SMALLINT,BIGINT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_player_business_paid(TEXT,TEXT,TEXT,SMALLINT,BIGINT) TO authenticated;
NOTIFY pgrst,'reload schema';
