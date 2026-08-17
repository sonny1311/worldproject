-- ORVUNO security hardening: loan pricing is server authoritative.
-- Client-supplied annual_rate/monthly_payment values are ignored.

CREATE OR REPLACE FUNCTION public.take_expansion_loan(p_company_id bigint, p_amount numeric, p_annual_rate numeric, p_term_months integer, p_monthly_payment numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user bigint;
  v_id bigint;
  v_annual_rate numeric := 0.06;
  v_monthly_rate numeric;
  v_factor numeric;
  v_payment numeric;
  v_outstanding numeric;
BEGIN
  v_user := private.require_active_game_user_id();
  IF NOT EXISTS(SELECT 1 FROM public.companies WHERE id=p_company_id AND user_id=v_user AND closed_at IS NULL FOR UPDATE) THEN
    RAISE EXCEPTION 'Betrieb nicht gefunden';
  END IF;
  IF p_amount < 5000 OR p_amount > 5000000 THEN RAISE EXCEPTION 'Kreditbetrag muss zwischen 5.000 und 5.000.000 liegen'; END IF;
  IF p_term_months < 12 OR p_term_months > 120 THEN RAISE EXCEPTION 'Kreditlaufzeit muss zwischen 12 und 120 Monaten liegen'; END IF;
  PERFORM pg_advisory_xact_lock(v_user);
  SELECT COALESCE(SUM(remaining_principal),0) INTO v_outstanding FROM public.business_expansion_loans WHERE user_id=v_user AND status='active';
  IF v_outstanding+p_amount>5000000 THEN RAISE EXCEPTION 'Maximales offenes Kreditvolumen von 5.000.000 überschritten'; END IF;
  v_monthly_rate:=v_annual_rate/12;
  v_factor:=POWER(1+v_monthly_rate,p_term_months);
  v_payment:=ROUND((p_amount*v_monthly_rate*v_factor/(v_factor-1))::numeric,2);
  IF v_payment<=0 THEN RAISE EXCEPTION 'Ungueltige Finanzierung'; END IF;
  INSERT INTO public.business_expansion_loans(user_id,company_id,principal,annual_rate,term_months,remaining_principal,monthly_payment)
  VALUES(v_user,p_company_id,p_amount,v_annual_rate,p_term_months,p_amount,v_payment) RETURNING id INTO v_id;
  UPDATE public.companies SET money=COALESCE(money,0)+p_amount,debt=COALESCE(debt,0)+p_amount,game_state=jsonb_set(COALESCE(game_state,'{}'::jsonb),'{money}',to_jsonb(COALESCE(money,0)+p_amount),true),saved_at=NOW() WHERE user_id=v_user AND closed_at IS NULL;
  RETURN jsonb_build_object('loan_id',v_id,'amount',p_amount,'annual_rate',v_annual_rate,'term_months',p_term_months,'monthly_payment',v_payment);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.take_expansion_loan(bigint,numeric,numeric,integer,numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.take_expansion_loan(bigint,numeric,numeric,integer,numeric) TO authenticated;
