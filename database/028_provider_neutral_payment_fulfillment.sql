-- Shared, service-role-only fulfillment for verified Echtgeld payments.
-- Providers must verify payment with their own server API before calling this function.

CREATE OR REPLACE FUNCTION public.fulfill_verified_purchase(
  p_provider text,
  p_user_id bigint,
  p_provider_transaction_id text,
  p_sku text,
  p_amount_eur numeric,
  p_currency text,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
 v_product public.store_products;
 v_balance bigint;
 v_until timestamptz;
 v_purchase_id bigint;
 v_provider text := lower(coalesce(p_provider,''));
 v_status text := lower(coalesce(p_status,''));
begin
 if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
   raise exception 'Service role required';
 end if;
 if v_provider not in ('braintree','stripe') then raise exception 'Unsupported provider'; end if;
 if coalesce(p_provider_transaction_id,'')='' then raise exception 'Missing transaction id'; end if;
 if upper(coalesce(p_currency,'')) <> 'EUR' then raise exception 'Invalid currency'; end if;
 if v_provider='braintree' and v_status not in ('submitted_for_settlement','settling','settled') then
   raise exception 'Payment not eligible for fulfillment';
 end if;
 if v_provider='stripe' and v_status not in ('paid','succeeded') then
   raise exception 'Payment not eligible for fulfillment';
 end if;

 select * into v_product
 from public.store_products
 where sku=p_sku and active=true
 for share;
 if not found then raise exception 'Unknown product'; end if;
 if round(p_amount_eur,2) <> round(v_product.price_eur,2) then raise exception 'Amount mismatch'; end if;
 if v_product.kind not in ('coins','premium') then raise exception 'Unsupported product kind'; end if;

 insert into public.payment_purchases(user_id,provider,provider_transaction_id,sku,amount_eur,currency,status)
 values(p_user_id,v_provider,p_provider_transaction_id,p_sku,round(p_amount_eur,2),'EUR',v_status)
 on conflict(provider,provider_transaction_id) do nothing
 returning id into v_purchase_id;

 if v_purchase_id is null then
   return jsonb_build_object('success',true,'duplicate',true,'transactionId',p_provider_transaction_id,'provider',v_provider);
 end if;

 if v_product.kind='coins' then
   insert into public.coin_wallets(user_id,balance,updated_at)
   values(p_user_id,v_product.coin_amount,now())
   on conflict(user_id) do update
     set balance=public.coin_wallets.balance+excluded.balance,updated_at=now()
   returning balance into v_balance;

   insert into public.coin_transactions(user_id,amount,balance_after,transaction_type,reference_type,reference_id,note)
   values(p_user_id,v_product.coin_amount,v_balance,'purchase',v_provider||'_transaction',p_provider_transaction_id,'Echtgeld-Coinpaket '||p_sku);

   return jsonb_build_object('success',true,'kind','coins','coins',v_product.coin_amount,'balance',v_balance,'transactionId',p_provider_transaction_id,'provider',v_provider);
 end if;

 update public.users
 set premium_plan=v_product.premium_plan,
     premium_until=(greatest(coalesce(premium_until,now()),now()) + make_interval(days=>v_product.duration_days)),
     premium_auto_renew=false
 where id=p_user_id
 returning premium_until into v_until;

 return jsonb_build_object('success',true,'kind','premium','plan',v_product.premium_plan,'premiumUntil',v_until,'transactionId',p_provider_transaction_id,'provider',v_provider);
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.fulfill_verified_purchase(text,bigint,text,text,numeric,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_verified_purchase(text,bigint,text,text,numeric,text,text) TO service_role;

-- Keep the existing Braintree RPC contract stable while routing both providers through one fulfillment path.
CREATE OR REPLACE FUNCTION public.fulfill_braintree_purchase(
  p_user_id bigint,
  p_provider_transaction_id text,
  p_sku text,
  p_amount_eur numeric,
  p_currency text,
  p_status text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT public.fulfill_verified_purchase('braintree',p_user_id,p_provider_transaction_id,p_sku,p_amount_eur,p_currency,p_status);
$function$;

REVOKE EXECUTE ON FUNCTION public.fulfill_braintree_purchase(bigint,text,text,numeric,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_braintree_purchase(bigint,text,text,numeric,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.fulfill_stripe_purchase(
  p_user_id bigint,
  p_provider_transaction_id text,
  p_sku text,
  p_amount_eur numeric,
  p_currency text,
  p_status text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT public.fulfill_verified_purchase('stripe',p_user_id,p_provider_transaction_id,p_sku,p_amount_eur,p_currency,p_status);
$function$;

REVOKE EXECUTE ON FUNCTION public.fulfill_stripe_purchase(bigint,text,text,numeric,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_stripe_purchase(bigint,text,text,numeric,text,text) TO service_role;
