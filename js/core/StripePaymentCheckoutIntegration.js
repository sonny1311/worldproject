// ORVUNO – Stripe Hosted Checkout provider (Testmodus).
// Preis und Kaufprodukt werden serverseitig aus store_products aufgelöst.
function api(){const a=window.worldAccounts?.authApi;if(!a)throw new Error('Zahlungssystem ist noch nicht bereit');return a;}
function assertCheckoutContext(){if(window.worldBusinessSwitchPaymentGuard?.blocked?.())throw new Error('Während eines Betriebswechsels kann keine Zahlung gestartet werden');}
async function edge(action,data={}){const a=api(),token=await a.ensureAccessToken();if(!token)throw new Error('Bitte zuerst anmelden');const r=await fetch(`${a.baseUrl}/functions/v1/world-payments`,{method:'POST',headers:{apikey:a.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action,...data})});const b=await r.json().catch(()=>({}));if(!r.ok||b.success===false)throw new Error(b.error||b.message||`Zahlung fehlgeschlagen (${r.status})`);return b;}

export async function beginStripePurchase({sku}={}){
 assertCheckoutContext();
 if(!sku)throw new Error('Ungültiges Kaufprodukt');
 const result=await edge('stripe_checkout',{sku});
 if(result?.environment!=='test'||!String(result?.sessionId||'').startsWith('cs_test_')||!result?.url)throw new Error('Stripe-Testcheckout konnte nicht sicher gestartet werden');
 location.assign(result.url);
 return {success:true,opened:true,provider:'stripe',environment:'test',sessionId:result.sessionId};
}
export function beginCoinPurchase(request={}){return beginStripePurchase({sku:request.packageId});}
export function beginPremiumPurchase(plan={}){return beginStripePurchase({sku:plan.id||plan.planId});}

function install(){
 window.worldPaymentProviders??={};
 window.worldPaymentProviders.stripe={id:'stripe',label:'Stripe (Test)',environment:'test',beginCoinPurchase,beginPremiumPurchase,begin:beginStripePurchase};
}
if(typeof window!=='undefined')install();
