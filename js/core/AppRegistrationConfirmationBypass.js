// ORVUNO – Registrierung in Android-Store-Apps ohne E-Mail-Bestätigung.
// Die normale Web-Registrierung bleibt unverändert und nutzt weiterhin Supabase /auth/v1/signup.

const APP_MARKER_KEY = 'orvuno.android.store-app';
const APP_REGISTER_URL = 'https://ojhaeccyulyrwoxgeurf.supabase.co/functions/v1/world-app-register';

function rememberExplicitStoreMarker(){
  try{
    const params=new URLSearchParams(location.search);
    const store=String(params.get('orvuno_store')||params.get('store')||'').toLowerCase();
    const app=String(params.get('orvuno_app')||params.get('app')||'').toLowerCase();
    if(['google','amazon','play','googleplay'].includes(store)||['android','orvuno'].includes(app)){
      localStorage.setItem(APP_MARKER_KEY,store||app||'android');
      return true;
    }
  }catch{}
  return false;
}

function isAndroidStoreApp(){
  if(rememberExplicitStoreMarker())return true;
  try{if(localStorage.getItem(APP_MARKER_KEY))return true;}catch{}
  const android=/Android/i.test(navigator.userAgent||'');
  const standalone=window.matchMedia?.('(display-mode: standalone)')?.matches===true||window.navigator.standalone===true;
  return android&&standalone;
}

const nativeFetch=window.fetch.bind(window);
window.orvunoIsAndroidStoreApp=isAndroidStoreApp;

window.fetch=async function orvunoAppAwareFetch(input,init={}){
  const url=typeof input==='string'?input:input?.url||'';
  const method=String(init?.method||(typeof input!=='string'&&input?.method)||'GET').toUpperCase();
  const isSignup=/\/auth\/v1\/signup(?:\?|$)/.test(url);

  if(!isSignup||method!=='POST'||!isAndroidStoreApp())return nativeFetch(input,init);

  let source={};
  try{source=JSON.parse(init?.body||'{}');}catch{}
  const meta=source?.data||{};
  const payload={
    email:source?.email||'',
    password:source?.password||'',
    username:meta?.username||'',
    countryCode:meta?.country_code||'DE',
    languageCode:meta?.language_code||'en'
  };

  return nativeFetch(APP_REGISTER_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','X-Orvuno-App':'android'},
    body:JSON.stringify(payload)
  });
};
