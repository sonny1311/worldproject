import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import braintree from "npm:braintree@3.38.0";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});
const env=(name:string)=>Deno.env.get(name)?.trim()||"";

function gateway(){
 const merchantId=env("BRAINTREE_MERCHANT_ID"),publicKey=env("BRAINTREE_PUBLIC_KEY"),privateKey=env("BRAINTREE_PRIVATE_KEY");
 if(!merchantId||!publicKey||!privateKey) throw new Error("Braintree ist serverseitig noch nicht konfiguriert");
 const mode=env("BRAINTREE_ENVIRONMENT").toLowerCase();
 return new braintree.BraintreeGateway({environment:mode==="production"?braintree.Environment.Production:braintree.Environment.Sandbox,merchantId,publicKey,privateKey});
}

function stripeTestKey(){
 const key=env("STRIPE_SECRET_KEY");
 if(!key) throw new Error("Stripe ist serverseitig noch nicht konfiguriert");
 if(!key.startsWith("sk_test_")) throw new Error("ORVUNO akzeptiert derzeit ausschließlich Stripe-Testschlüssel");
 return key;
}

async function retrieveStripeCheckoutSession(sessionId:string){
 const id=String(sessionId||"").trim();
 if(!id.startsWith("cs_test_")||id.length>255) throw new Error("Ungültige Stripe-Testsession");
 const response=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${stripeTestKey()}`}});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok||!payload?.id) throw new Error(payload?.error?.message||"Stripe-Checkoutstatus konnte nicht geprüft werden");
 if(payload.livemode===true||String(payload.id)!==id||!String(payload.id).startsWith("cs_test_")) throw new Error("Stripe lieferte keine gültige Testsession");
 return payload;
}

async function createStripeCheckoutSession(product:any,profileId:number){
 const key=stripeTestKey();
 const base=env("STRIPE_CHECKOUT_BASE_URL").replace(/\/$/,"");
 if(!/^https:\/\//i.test(base)) throw new Error("STRIPE_CHECKOUT_BASE_URL muss auf eine HTTPS-Spieladresse zeigen");
 const sku=String(product.sku),label=String(product.label||sku),amountCents=Math.round(Number(product.price_eur)*100);
 if(!sku||!Number.isInteger(amountCents)||amountCents<=0) throw new Error("Ungültiges Stripe-Kaufprodukt");
 const form=new URLSearchParams();
 form.set("mode","payment");
 form.set("success_url",`${base}/?payment=stripe_success&session_id={CHECKOUT_SESSION_ID}`);
 form.set("cancel_url",`${base}/?payment=stripe_cancelled`);
 form.set("client_reference_id",String(profileId));
 form.set("line_items[0][quantity]","1");
 form.set("line_items[0][price_data][currency]","eur");
 form.set("line_items[0][price_data][unit_amount]",String(amountCents));
 form.set("line_items[0][price_data][product_data][name]",label);
 form.set("metadata[user_id]",String(profileId));
 form.set("metadata[sku]",sku);
 form.set("payment_intent_data[metadata][user_id]",String(profileId));
 form.set("payment_intent_data[metadata][sku]",sku);
 const response=await fetch("https://api.stripe.com/v1/checkout/sessions",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/x-www-form-urlencoded"},body:form});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok||!payload?.id||!payload?.url) throw new Error(payload?.error?.message||"Stripe Checkout konnte nicht erstellt werden");
 if(payload.livemode===true||!String(payload.id).startsWith("cs_test_")) throw new Error("Stripe hat keine Test-Checkout-Session zurückgegeben");
 return {sessionId:String(payload.id),url:String(payload.url)};
}

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 try{
  const auth=req.headers.get("Authorization")||"",jwt=auth.replace(/^Bearer\s+/i,"");
  if(!jwt) return json({error:"Nicht angemeldet"},401);
  const url=env("SUPABASE_URL"),serviceKey=env("SUPABASE_SERVICE_ROLE_KEY");
  const sb=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:userError}=await sb.auth.getUser(jwt);
  if(userError||!user) return json({error:"Sitzung ist ungültig"},401);
  const {data:profile,error:profileError}=await sb.from("users").select("id,status").eq("auth_user_id",user.id).maybeSingle();
  if(profileError||!profile||profile.status!=="active") return json({error:"Spielerkonto ist nicht aktiv"},403);
  const body=await req.json().catch(()=>({}));const action=String(body?.action||"");

  if(action==="stripe_checkout"){
   const sku=String(body?.sku||"");
   if(!sku) return json({error:"Produkt fehlt"},400);
   const {data:product,error:productError}=await sb.from("store_products").select("sku,label,price_eur,active").eq("sku",sku).eq("active",true).maybeSingle();
   if(productError||!product) return json({error:"Produkt ist nicht verfügbar"},400);
   const session=await createStripeCheckoutSession(product,Number(profile.id));
   return json({success:true,provider:"stripe",environment:"test",...session});
  }

  if(action==="stripe_status"){
   const sessionId=String(body?.sessionId||"").trim();
   const session=await retrieveStripeCheckoutSession(sessionId);
   const expectedUser=String(profile.id),metadataUser=String(session?.metadata?.user_id||""),referenceUser=String(session?.client_reference_id||"");
   if(!metadataUser||!referenceUser||metadataUser!==expectedUser||referenceUser!==expectedUser) return json({error:"Stripe-Session gehört nicht zu diesem Spielerkonto"},403);
   const sku=String(session?.metadata?.sku||"");
   if(!sku) return json({error:"Stripe-Session enthält kein Kaufprodukt"},409);
   const checkoutStatus=String(session?.status||""),paymentStatus=String(session?.payment_status||"");
   return json({success:true,provider:"stripe",environment:"test",sessionId:String(session.id),checkoutStatus,paymentStatus,sku,paid:checkoutStatus==="complete"&&paymentStatus==="paid"});
  }

  const gw=gateway();
  if(action==="client_token"){
   const token=await new Promise<string>((resolve,reject)=>gw.clientToken.generate({},(err:any,res:any)=>err?reject(err):resolve(res.clientToken)));
   return json({success:true,clientToken:token,environment:env("BRAINTREE_ENVIRONMENT").toLowerCase()==="production"?"production":"sandbox"});
  }
  if(action!=="checkout") return json({error:"Unbekannte Zahlungsaktion"},400);
  const sku=String(body?.sku||""),nonce=String(body?.paymentMethodNonce||""),deviceData=body?.deviceData?String(body.deviceData):undefined;
  if(!sku||!nonce) return json({error:"Produkt oder Zahlungsfreigabe fehlt"},400);
  const {data:product,error:productError}=await sb.from("store_products").select("sku,label,price_eur,active").eq("sku",sku).eq("active",true).maybeSingle();
  if(productError||!product) return json({error:"Produkt ist nicht verfügbar"},400);
  const amount=Number(product.price_eur).toFixed(2);
  const sale=await new Promise<any>((resolve,reject)=>gw.transaction.sale({amount,paymentMethodNonce:nonce,deviceData,options:{submitForSettlement:true},orderId:`ORVUNO-${profile.id}-${sku}-${Date.now()}`},(err:any,result:any)=>err?reject(err):resolve(result)));
  if(!sale?.success||!sale?.transaction?.id){
   const message=sale?.message||sale?.errors?.deepErrors?.()?.map((x:any)=>x.message).join("; ")||"Zahlung wurde abgelehnt";
   return json({success:false,error:message},402);
  }
  const tx=sale.transaction,status=String(tx.status||""),currency=String(tx.currencyIsoCode||"EUR").toUpperCase();
  if(currency!=="EUR") return json({success:false,error:"Zahlung wurde in einer unerwarteten Währung verarbeitet",transactionId:tx.id},500);
  if(!["submitted_for_settlement","settling","settled"].includes(status)) return json({success:false,error:"Zahlung ist noch nicht zur Gutschrift freigegeben",transactionId:tx.id,status},409);
  const {data:fulfilled,error:fulfillError}=await sb.rpc("fulfill_braintree_purchase",{p_user_id:profile.id,p_provider_transaction_id:String(tx.id),p_sku:sku,p_amount_eur:Number(tx.amount||amount),p_currency:currency,p_status:status});
  if(fulfillError){console.error("fulfillment failed",fulfillError);return json({success:false,error:"Zahlung bestätigt, Gutschrift konnte nicht abgeschlossen werden. Bitte Support kontaktieren.",transactionId:tx.id},500);}
  return json({success:true,transactionId:tx.id,status,fulfillment:fulfilled});
 }catch(error){console.error(error);return json({error:error instanceof Error?error.message:"Zahlungsfehler"},500);}
});
