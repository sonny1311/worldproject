// ORVUNO – harte Trennung zwischen Betriebsnavigation und Echtgeld-Kauf.
// Ein Wechsel zu einem bereits vorhandenen Betrieb darf niemals einen Checkout starten.
import { businessPortfolio } from './AccountMultiplayerIntegration.js';

const originalActivate=businessPortfolio.activate.bind(businessPortfolio);
let switchDepth=0;
let purchaseIntent=null;
const INTENT_TTL_MS=1500;

function closeUnexpectedPaymentOverlay(){
  document.querySelector('[data-orvuno-payment-overlay]')?.remove();
}

function releaseSwitchGuard(){
  queueMicrotask(()=>{switchDepth=Math.max(0,switchDepth-1);});
}

function clearPurchaseIntent(){purchaseIntent=null;}
function skuFromPurchaseButton(button){
  if(!button)return '';
  return String(button.dataset.premiumOffer||button.dataset.coinOffer||'').trim();
}
function armPurchaseIntentFromTrustedClick(event){
  // Nur ein echter Browser-Klick direkt auf einen Echtgeld-Kaufbutton darf den
  // nachfolgenden Provider-Aufruf freischalten. Navigation, CustomEvents und
  // programmgesteuerte .click()-Aufrufe erhalten keine Zahlungsfreigabe.
  clearPurchaseIntent();
  if(!event?.isTrusted||paymentBlockedByBusinessSwitch())return false;
  const target=event.target instanceof Element?event.target:null;
  const button=target?.closest?.('[data-premium-offer],[data-coin-offer]');
  const sku=skuFromPurchaseButton(button);
  if(!sku)return false;
  purchaseIntent={sku,expiresAt:performance.now()+INTENT_TTL_MS};
  return true;
}
function consumePurchaseIntent(sku){
  const expected=String(sku||'').trim(),intent=purchaseIntent;
  clearPurchaseIntent();
  if(!expected||!intent||paymentBlockedByBusinessSwitch())return false;
  if(performance.now()>intent.expiresAt)return false;
  return intent.sku===expected;
}

if(typeof document!=='undefined'){
  document.addEventListener('click',armPurchaseIntentFromTrustedClick,true);
  document.addEventListener('pointerdown',event=>{
    // Jede andere echte Nutzeraktion verwirft eine eventuell alte Freigabe sofort.
    if(event?.isTrusted){
      const target=event.target instanceof Element?event.target:null;
      if(!target?.closest?.('[data-premium-offer],[data-coin-offer]'))clearPurchaseIntent();
    }
  },true);
}

if(!businessPortfolio.__orvunoPaymentSwitchGuardInstalled){
  businessPortfolio.__orvunoPaymentSwitchGuardInstalled=true;
  businessPortfolio.activate=function(...args){
    switchDepth+=1;
    clearPurchaseIntent();
    closeUnexpectedPaymentOverlay();
    try{
      const result=originalActivate(...args);
      // Falls ein synchroner Listener auf company-switched versehentlich einen Checkout anstößt,
      // wird auch dessen Overlay innerhalb derselben Navigation wieder entfernt.
      closeUnexpectedPaymentOverlay();
      return result;
    }finally{
      releaseSwitchGuard();
    }
  };
}

export function paymentBlockedByBusinessSwitch(){return switchDepth>0;}
export function consumeTrustedPurchaseIntent(sku){return consumePurchaseIntent(sku);}
export function runBusinessSwitchPaymentGuardTest(){
  switchDepth+=1;
  try{if(!paymentBlockedByBusinessSwitch())throw new Error('Betriebswechsel sperrt Checkout nicht');}
  finally{switchDepth=Math.max(0,switchDepth-1);}
  if(paymentBlockedByBusinessSwitch())throw new Error('Checkout-Sperre bleibt nach Betriebswechsel aktiv');
  clearPurchaseIntent();
  if(consumePurchaseIntent('coins_100'))throw new Error('Checkout ohne echten Kaufklick wurde freigegeben');
  return true;
}

if(typeof window!=='undefined')window.worldBusinessSwitchPaymentGuard={
  blocked:paymentBlockedByBusinessSwitch,
  consumePurchaseIntent:consumeTrustedPurchaseIntent,
  clearPurchaseIntent,
  test:runBusinessSwitchPaymentGuardTest
};
