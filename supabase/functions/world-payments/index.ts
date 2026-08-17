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
