// ORVUNO – only load the payment provider allowed on the current platform.
const store=window.orvunoAppBridge?.store||'web';
if(store==='amazon'){
  await import('./AmazonIapCheckoutIntegration.js');
  await import('./NativeStorePaymentPolicyIntegration.js');
}else if(store==='google'){
  // Google Play billing will be connected separately. External checkout stays unavailable in the app.
  await import('./NativeStorePaymentPolicyIntegration.js');
}else{
  // Browser/web version keeps the existing external checkout providers.
  await import('./BraintreePaymentCheckoutIntegration.js');
  await import('./StripePaymentCheckoutIntegration.js');
}
