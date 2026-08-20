// ORVUNO – harte Trennung zwischen Betriebsnavigation und Echtgeld-Kauf.
// Ein Wechsel zu einem bereits vorhandenen Betrieb darf niemals einen Checkout starten.
import { businessPortfolio } from './AccountMultiplayerIntegration.js';

const originalActivate=businessPortfolio.activate.bind(businessPortfolio);
let switchDepth=0;

function closeUnexpectedPaymentOverlay(){
  document.querySelector('[data-orvuno-payment-overlay]')?.remove();
}

function releaseSwitchGuard(){
  queueMicrotask(()=>{switchDepth=Math.max(0,switchDepth-1);});
}

if(!businessPortfolio.__orvunoPaymentSwitchGuardInstalled){
  businessPortfolio.__orvunoPaymentSwitchGuardInstalled=true;
  businessPortfolio.activate=function(...args){
    switchDepth+=1;
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
export function runBusinessSwitchPaymentGuardTest(){
  switchDepth+=1;
  try{if(!paymentBlockedByBusinessSwitch())throw new Error('Betriebswechsel sperrt Checkout nicht');}
  finally{switchDepth=Math.max(0,switchDepth-1);}
  if(paymentBlockedByBusinessSwitch())throw new Error('Checkout-Sperre bleibt nach Betriebswechsel aktiv');
  return true;
}

if(typeof window!=='undefined')window.worldBusinessSwitchPaymentGuard={blocked:paymentBlockedByBusinessSwitch,test:runBusinessSwitchPaymentGuardTest};
