// ORVUNO – Amazon Appstore IAP provider.
// Native Amazon wrapper exposes window.OrvunoAmazonIap; receipt fulfillment stays server-side.
function isAmazonApp(){return window.orvunoAppBridge?.store==='amazon'||!!window.OrvunoAmazonIap;}
function api(){const a=window.worldAccounts?.authApi;if(!a)throw new Error('Zahlungssystem ist noch nicht bereit');return a;}
async function verifyReceipt({amazonUserId,receiptId,sku}){
 const a=api(),token=await a.ensureAccessToken();if(!token)throw new Error('Bitte zuerst anmelden');
 const r=await fetch(`${a.baseUrl}/functions/v1/world-amazon-iap`,{method:'POST',headers:{apikey:a.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({amazonUserId,receiptId,sku})});
 const b=await r.json().catch(()=>({}));if(!r.ok||b.success!==true)throw new Error(b.error||`Amazon-Kauf konnte nicht bestätigt werden (${r.status})`);return b;
}
function native(){const n=window.OrvunoAmazonIap;if(!n||typeof n.purchase!=='function')throw new Error('Amazon In-App-Käufe sind auf diesem Gerät nicht verfügbar');return n;}
let pending=null;
function refresh(){try{window.worldAccounts?.gameStateSync?.refreshBalances?.();window.worldAccounts?.premiumLifecycle?.refreshAccount?.(window.worldAccounts?.authApi);}catch(e){console.warn('Amazon-IAP-Status konnte nicht sofort aktualisiert werden',e);}}
function updatePrices(products={}){for(const [sku,p] of Object.entries(products||{})){document.querySelectorAll(`[data-store-price="${CSS.escape(sku)}"]`).forEach(el=>{if(p?.price)el.textContent=p.price;});}}
function requestProducts(){if(!isAmazonApp())return;try{const skus=window.worldPremiumPlanUI?[...window.worldPremiumPlanUI.PremiumOffers.map(x=>x.id),...window.worldPremiumPlanUI.CoinOffers.map(x=>x.id)]:[];if(skus.length&&typeof native().requestProductData==='function')native().requestProductData(JSON.stringify(skus));}catch(e){console.warn(e.message);}}
async function beginAmazonPurchase({sku}={}){
 if(!isAmazonApp())throw new Error('Amazon IAP ist nur in der Amazon-App verfügbar');
 if(!sku)throw new Error('Ungültiges Kaufprodukt');
 if(pending)throw new Error('Ein Amazon-Kauf läuft bereits');
 return new Promise((resolve,reject)=>{pending={sku,resolve,reject};try{native().purchase(sku);}catch(e){pending=null;reject(e);}});
}
export function beginCoinPurchase(request={}){return beginAmazonPurchase({sku:request.packageId});}
export function beginPremiumPurchase(plan={}){return beginAmazonPurchase({sku:plan.id||plan.planId});}
window.addEventListener('orvuno:amazon-iap-products',e=>updatePrices(e.detail?.products||{}));
window.addEventListener('orvuno:amazon-iap-error',e=>{if(!pending)return;const p=pending;pending=null;p.reject(new Error(e.detail?.message||'Amazon-Kauf wurde abgebrochen'));});
window.addEventListener('orvuno:amazon-iap-purchase',async e=>{
 const d=e.detail||{};if(!d.receiptId||!d.amazonUserId||!d.sku)return;
 try{
  const result=await verifyReceipt(d);
  try{native().notifyFulfilled(d.receiptId);}catch(_e){}
  await refresh();
  window.dispatchEvent(new CustomEvent('world:payment-return',{detail:{provider:'amazon',status:'fulfilled',paid:true,fulfilled:true,sku:d.sku,receiptId:d.receiptId}}));
  if(pending&&pending.sku===d.sku){const p=pending;pending=null;p.resolve(result);}
 }catch(error){if(pending&&pending.sku===d.sku){const p=pending;pending=null;p.reject(error);}else console.error(error);}
});
function install(){if(!isAmazonApp())return;window.worldPaymentProviders??={};const provider={id:'amazon',label:'Amazon Appstore',beginCoinPurchase,beginPremiumPurchase,begin:beginAmazonPurchase,requestProducts};window.worldPaymentProviders.amazon=provider;window.worldPaymentCheckout=provider;const run=()=>setTimeout(requestProducts,800);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();}
if(typeof window!=='undefined')install();
