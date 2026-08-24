// ORVUNO – Store policy guard: native store apps must never expose Stripe/external checkout.
(function(){
 const app=window.orvunoAppBridge;
 if(!app?.isNativeApp)return;
 window.worldPaymentProviders??={};
 delete window.worldPaymentProviders.stripe;
 delete window.worldPaymentProviders.braintree;
 if(app.store==='amazon'){
   if(window.worldPaymentProviders.amazon)window.worldPaymentCheckout=window.worldPaymentProviders.amazon;
   return;
 }
 const unavailable=()=>Promise.reject(new Error('In-App-Käufe werden in dieser App-Version über den jeweiligen Store bereitgestellt.'));
 window.worldPaymentCheckout={id:app.store||'native',label:'Store',begin:unavailable,beginCoinPurchase:unavailable,beginPremiumPurchase:unavailable};
})();
