-- WorldProject: entfernt die historische 4-Betriebe-Grenze aus der serverseitigen Gruendungsfunktion.
-- Bestehende Betriebe/Daten werden nicht veraendert. slot_no bleibt SMALLINT und damit praktisch sehr gross genug.

-- Migration 005 hatte auf frischen Installationen noch einen 1..4-Check angelegt.
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_slot_no_check;

CREATE OR REPLACE FUNCTION public.create_player_business(p_name TEXT,p_industry TEXT,p_company_type TEXT,p_slot_no SMALLINT)
RETURNS public.companies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id BIGINT; v_company public.companies;
BEGIN
  v_user_id:=private.require_active_game_user_id();
  IF p_slot_no < 1 THEN RAISE EXCEPTION 'Betriebsplatz muss mindestens 1 sein'; END IF;
  IF EXISTS(SELECT 1 FROM public.companies WHERE user_id=v_user_id AND slot_no=p_slot_no) THEN RAISE EXCEPTION 'Dieser Betriebsplatz ist bereits belegt'; END IF;
  INSERT INTO public.companies(user_id,name,industry,company_type,money,slot_no,setup_phase,is_primary,building_state)
  VALUES(v_user_id,COALESCE(NULLIF(BTRIM(p_name),''),'Neuer Betrieb'),NULLIF(BTRIM(p_industry),''),NULLIF(BTRIM(p_company_type),''),CASE WHEN p_slot_no=1 THEN 50000 ELSE 0 END,p_slot_no,'empty_building',p_slot_no=1,'{"kind":"starter_shell","rooms":[],"equipment":[],"ready":false}'::jsonb)
  RETURNING * INTO v_company;
  RETURN v_company;
END; $$;

REVOKE ALL ON FUNCTION public.create_player_business(TEXT,TEXT,TEXT,SMALLINT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_player_business(TEXT,TEXT,TEXT,SMALLINT) TO authenticated;
NOTIFY pgrst,'reload schema';
