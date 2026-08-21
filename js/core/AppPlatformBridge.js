// ORVUNO – schlanke Brücke zwischen Webspiel und späterem Android-/AdMob-Wrapper.
// Enthält absichtlich keine produktiven SDK-IDs, Secrets oder Store-spezifischen Schlüssel.

const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true;

function topVisibleOverlay(){
  const candidates=[...document.querySelectorAll('[data-orvuno-payment-overlay],[role="dialog"],.orvuno-modal,.modal,.dialog')]
    .filter(el=>{
      const s=getComputedStyle(el);
      const r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
    });
  return candidates.at(-1)||null;
}

function closeTopOverlay(){
  const overlay=topVisibleOverlay();
  if(!overlay)return false;
  const close=overlay.querySelector('[data-close],[aria-label*="schließ" i],[aria-label*="close" i],.close,.modal-close,button');
  if(close&&typeof close.click==='function'){
    close.click();
    return true;
  }
  return false;
}

function handleBack(){
  if(closeTopOverlay())return true;
  window.dispatchEvent(new CustomEvent('orvuno:app-back-unhandled'));
  return false;
}

const adProviders=new Map();
function registerRewardedAdProvider(id,provider){
  if(!id||typeof provider?.showRewarded!=='function')throw new Error('Ungültiger Rewarded-Ad-Provider');
  adProviders.set(String(id),provider);
  return true;
}
async function showRewardedAd(context={}){
  const preferred=context.providerId&&adProviders.get(String(context.providerId));
  const provider=preferred||adProviders.values().next().value;
  if(!provider)throw new Error('Noch kein nativer Werbeanbieter eingerichtet');
  return provider.showRewarded(context);
}

function setConnectionState(){
  document.documentElement.dataset.orvunoOnline=navigator.onLine?'1':'0';
  window.dispatchEvent(new CustomEvent('orvuno:connection-changed',{detail:{online:navigator.onLine}}));
}

async function registerServiceWorker(){
  if(!('serviceWorker' in navigator)||location.protocol==='file:')return null;
  try{return await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});}
  catch(error){console.warn('ORVUNO App-Service-Worker konnte nicht registriert werden',error);return null;}
}

window.orvunoAppBridge={
  version:1,
  standalone:isStandalone(),
  handleBack,
  closeTopOverlay,
  registerRewardedAdProvider,
  showRewardedAd,
  get online(){return navigator.onLine;}
};

window.addEventListener('orvuno:native-back',handleBack);
window.addEventListener('online',setConnectionState);
window.addEventListener('offline',setConnectionState);
setConnectionState();
registerServiceWorker();
