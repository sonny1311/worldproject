import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";

const env=(name:string)=>Deno.env.get(name)?.trim()||"";
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
const encoder=new TextEncoder();

function stripeTestKey(){
 const key=env("STRIPE_SECRET_KEY");
 if(!key) throw new Error("STRIPE_SECRET_KEY fehlt");
 if(!key.startsWith("sk_test_")) throw new Error("Nur Stripe-Testmodus ist erlaubt");
 return key;
}

function hex(bytes:ArrayBuffer){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");}
function equalHex(a:string,b:string){
 if(a.length!==b.length) return false;
 let diff=0;
 for(let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}

async function verifySignature(raw:string,header:string,secret:string){
 const parts=header.split(",").map(x=>x.trim());
 const timestamp=parts.find(x=>x.startsWith("t="))?.slice(2)||"";
 const signatures=parts.filter(x=>x.startsWith("v1=")).map(x=>x.slice(3));
 if(!/^\d+$/.test(timestamp)||signatures.length===0) return false;
 const age=Math.abs(Math.floor(Date.now()/1000)-Number(timestamp));
 if(age>300) return false;
 const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const digest=hex(await crypto.subtle.sign("HMAC",key,encoder.encode(`${timestamp}.${raw}`)));
 return signatures.some(sig=>equalHex(digest,sig));
}

async function retrieveSession(id:string,key:string){
 if(!id.startsWith("cs_test_")||id.length>255) throw new Error("Keine gültige Stripe-Testsession");
 const response=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${key}`}});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok||!payload?.id) throw new Error(payload?.error?.message||"Stripe-Session konnte nicht verifiziert werden");
 if(String(payload.id)!==id) throw new Error("Stripe-Session-ID stimmt nicht überein");
 return payload;
}

Deno.serve(async(req:Request)=>{
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 try{
  const webhookSecret=env("STRIPE_WEBHOOK_SECRET");
  if(!webhookSecret) return json({error:"Stripe webhook is not configured"},503);
  const raw=await req.text();
  const signature=req.headers.get("Stripe-Signature")||"";
  if(!signature||!(await verifySignature(raw,signature,webhookSecret))) return json({error:"Invalid Stripe signature"},400);

  const event=JSON.parse(raw);
  const eventId=String(event?.id||"");
  if(!eventId.startsWith("evt_")||event?.livemode!==false) return json({error:"Invalid or live Stripe event"},400);
  const type=String(event?.type||"");
  if(!["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(type)) return json({received:true,ignored:true});

  const eventSession=event?.data?.object;
  const sessionId=String(eventSession?.id||"");
  if(eventSession?.object!=="checkout.session"||!sessionId.startsWith("cs_test_")) return json({error:"Invalid Stripe checkout event"},400);
  const stripeKey=stripeTestKey();
  const session=await retrieveSession(sessionId,stripeKey);
  if(session.livemode!==false||session.object!=="checkout.session") return json({error:"Live or invalid Stripe session"},400);
  if(String(session.status||"")!=="complete") return json({received:true,pending:true});
  if(String(session.payment_status||"")!=="paid") return json({received:true,pending:true});

  const metadataUserId=Number(session?.metadata?.user_id||0);
  const referenceUserId=Number(session?.client_reference_id||0);
  const sku=String(session?.metadata?.sku||"");
  const amountCents=Number(session?.amount_total);
  const currency=String(session?.currency||"").toUpperCase();
  const paymentIntent=typeof session?.payment_intent==="string"?session.payment_intent:"";
  if(!Number.isSafeInteger(metadataUserId)||metadataUserId<=0||!Number.isSafeInteger(referenceUserId)||referenceUserId<=0||metadataUserId!==referenceUserId) return json({error:"Stripe session user identity is inconsistent"},400);
  if(!sku||!Number.isInteger(amountCents)||amountCents<=0) return json({error:"Stripe session metadata is incomplete"},400);
  if(currency!=="EUR") return json({error:"Unexpected currency"},400);
  if(!paymentIntent.startsWith("pi_")) return json({error:"Missing or invalid Stripe payment intent"},400);

  const url=env("SUPABASE_URL"),serviceKey=env("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!serviceKey) throw new Error("Supabase service configuration missing");
  const sb=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:intent,error:intentError}=await sb.from("payment_checkout_intents").select("user_id,sku,amount_eur,currency,kind,coin_amount,premium_plan,duration_days,fulfilled_at").eq("provider","stripe").eq("provider_session_id",sessionId).maybeSingle();
  if(intentError||!intent) return json({error:"Unknown Stripe checkout intent"},400);
  const expectedCents=Math.round(Number(intent.amount_eur)*100);
  if(Number(intent.user_id)!==metadataUserId||String(intent.sku)!==sku||String(intent.currency).toUpperCase()!==currency||!Number.isInteger(expectedCents)||expectedCents!==amountCents) return json({error:"Stripe session does not match stored checkout intent"},400);

  const {data:fulfilled,error:fulfillError}=await sb.rpc("fulfill_stripe_checkout_intent",{
   p_user_id:metadataUserId,
   p_provider_session_id:sessionId,
   p_provider_transaction_id:paymentIntent,
   p_amount_eur:amountCents/100,
   p_currency:currency,
   p_status:"paid"
  });
  if(fulfillError){console.error("stripe fulfillment failed",{eventId,sessionId,transactionId:paymentIntent,code:fulfillError.code});return json({error:"Fulfillment failed"},500);}
  return json({received:true,fulfilled:true,transactionId:paymentIntent,result:fulfilled});
 }catch(error){console.error("stripe webhook error",error instanceof Error?error.message:"unknown");return json({error:"Webhook processing failed"},500);}
});
