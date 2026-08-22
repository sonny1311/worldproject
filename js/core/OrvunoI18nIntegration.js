// ORVUNO internationalization foundation.
// Additional languages can register themselves with window.orvunoI18n.registerLocale(...)
// without changing the language selector or player UI integration.
const STORAGE_KEY='orvuno.locale';
const DEFAULT_LOCALE='de';
const FALLBACK_LOCALE='de';
const RTL_LANGUAGES=new Set(['ar','fa','he','ur']);
const locales=new Map();
let activeLocale=DEFAULT_LOCALE;
let observer=null;
let applying=false;

const DE={
  meta:{name:'Deutsch',nativeName:'Deutsch'},
  messages:{
    'language.label':'Sprache','language.choose':'Sprache auswählen',
    'common.loading':'Laden …','common.reload':'Neu laden','common.close':'Schließen','common.cancel':'Abbrechen','common.save':'Speichern','common.back':'Zurück','common.next':'Weiter','common.yes':'Ja','common.no':'Nein','common.ok':'OK','common.buy':'Kaufen','common.sell':'Verkaufen','common.start':'Starten','common.stop':'Stoppen','common.open':'Öffnen','common.details':'Details','common.search':'Suchen','common.settings':'Einstellungen','common.available':'Verfügbar','common.locked':'Gesperrt','common.active':'Aktiv','common.inactive':'Inaktiv','common.finished':'Fertig','common.running':'Läuft','common.ordered':'Bestellt','common.delivered':'Geliefert','common.error':'Fehler','common.success':'Erfolgreich',
    'nav.dashboard':'Übersicht','nav.business':'Betrieb','nav.production':'Produktion','nav.inventory':'Lager','nav.purchasing':'Einkauf','nav.employees':'Personal','nav.machines':'Maschinen','nav.orders':'Kundenaufträge','nav.logistics':'Logistik','nav.finance':'Finanzen','nav.upgrades':'Ausbau','nav.market':'Markt','nav.messages':'Nachrichten','nav.profile':'Profil','nav.logout':'Abmelden',
    'auth.login':'Anmelden','auth.register':'Registrieren','auth.email':'E-Mail','auth.password':'Passwort','auth.forgot':'Passwort vergessen','auth.loginAction':'Einloggen',
    'business.company':'Unternehmen','business.account':'Firmenkonto','business.money':'Geld','business.premium':'Premium','business.coins':'Coins','business.switch':'Betrieb wechseln','business.new':'Neuen Betrieb gründen',
    'production.title':'Produktion','production.queue':'Produktionswarteschlange','production.amount':'Menge','production.duration':'Dauer','production.progress':'Fortschritt','production.start':'Produktion starten',
    'inventory.title':'Lager','inventory.stock':'Lagerbestand','inventory.capacity':'Kapazität','inventory.materials':'Rohstoffe','inventory.finishedGoods':'Fertigwaren',
    'purchasing.title':'Einkauf','purchasing.supplier':'Lieferant','purchasing.suppliers':'Lieferanten','purchasing.price':'Preis','purchasing.deliveryTime':'Lieferzeit','purchasing.order':'Bestellen',
    'employees.title':'Personal','employees.employee':'Mitarbeiter','employees.hire':'Einstellen','employees.salary':'Gehalt',
    'machines.title':'Maschinen','machines.machine':'Maschine','machines.condition':'Zustand','machines.capacity':'Kapazität','machines.upgrade':'Verbessern',
    'orders.title':'Kundenaufträge','orders.customer':'Kunde','orders.deadline':'Lieferfrist','orders.deliver':'Liefern','orders.remaining':'Restmenge',
    'logistics.title':'Logistik','logistics.deliveries':'Lieferungen','logistics.delivery':'Lieferung','logistics.transport':'Transport','logistics.distance':'Entfernung','logistics.arrival':'Ankunft',
    'finance.title':'Finanzen','finance.revenue':'Umsatz','finance.costs':'Kosten','finance.profit':'Gewinn','finance.balance':'Kontostand',
    'upgrades.title':'Ausbau','upgrades.build':'Bauen','upgrades.upgrade':'Ausbauen','upgrades.level':'Stufe','upgrades.time':'Bauzeit',
    'status.queued':'Wartet','status.available':'Verfügbar','status.running':'Läuft','status.finished':'Fertig','status.ordered':'Bestellt','status.inTransit':'Unterwegs','status.delivered':'Geliefert',
    'android.download':'📱 ORVUNO für Android herunterladen',
    'boot.title':'ORVUNO konnte nicht gestartet werden','boot.text':'Beim Laden ist ein technischer Fehler aufgetreten. Der Spielstand wurde dadurch nicht verändert.',
    'cleanup.packaging':'Verpackungslieferant','cleanup.brewBasics':'Brauerei-Grundstoffe','cleanup.bottleWash':'Flaschenwaschmittel','cleanup.labels':'Etiketten','cleanup.hereMissing':'HERE-Zugang für Live-Verkehr ist noch nicht eingerichtet','cleanup.hereAccess':'HERE-Zugang','cleanup.startMissing':'Startort fehlt'
  }
};

const EN={
  meta:{name:'English',nativeName:'English'},
  messages:{
    'language.label':'Language','language.choose':'Choose language',
    'common.loading':'Loading …','common.reload':'Reload','common.close':'Close','common.cancel':'Cancel','common.save':'Save','common.back':'Back','common.next':'Next','common.yes':'Yes','common.no':'No','common.ok':'OK','common.buy':'Buy','common.sell':'Sell','common.start':'Start','common.stop':'Stop','common.open':'Open','common.details':'Details','common.search':'Search','common.settings':'Settings','common.available':'Available','common.locked':'Locked','common.active':'Active','common.inactive':'Inactive','common.finished':'Finished','common.running':'Running','common.ordered':'Ordered','common.delivered':'Delivered','common.error':'Error','common.success':'Success',
    'nav.dashboard':'Overview','nav.business':'Business','nav.production':'Production','nav.inventory':'Inventory','nav.purchasing':'Purchasing','nav.employees':'Employees','nav.machines':'Machines','nav.orders':'Customer orders','nav.logistics':'Logistics','nav.finance':'Finance','nav.upgrades':'Upgrades','nav.market':'Market','nav.messages':'Messages','nav.profile':'Profile','nav.logout':'Log out',
    'auth.login':'Sign in','auth.register':'Register','auth.email':'Email','auth.password':'Password','auth.forgot':'Forgot password','auth.loginAction':'Log in',
    'business.company':'Company','business.account':'Company account','business.money':'Money','business.premium':'Premium','business.coins':'Coins','business.switch':'Switch business','business.new':'Start a new business',
    'production.title':'Production','production.queue':'Production queue','production.amount':'Amount','production.duration':'Duration','production.progress':'Progress','production.start':'Start production',
    'inventory.title':'Inventory','inventory.stock':'Inventory','inventory.capacity':'Capacity','inventory.materials':'Raw materials','inventory.finishedGoods':'Finished goods',
    'purchasing.title':'Purchasing','purchasing.supplier':'Supplier','purchasing.suppliers':'Suppliers','purchasing.price':'Price','purchasing.deliveryTime':'Delivery time','purchasing.order':'Order',
    'employees.title':'Employees','employees.employee':'Employee','employees.hire':'Hire','employees.salary':'Salary',
    'machines.title':'Machines','machines.machine':'Machine','machines.condition':'Condition','machines.capacity':'Capacity','machines.upgrade':'Upgrade',
    'orders.title':'Customer orders','orders.customer':'Customer','orders.deadline':'Delivery deadline','orders.deliver':'Deliver','orders.remaining':'Remaining quantity',
    'logistics.title':'Logistics','logistics.deliveries':'Deliveries','logistics.delivery':'Delivery','logistics.transport':'Transport','logistics.distance':'Distance','logistics.arrival':'Arrival',
    'finance.title':'Finance','finance.revenue':'Revenue','finance.costs':'Costs','finance.profit':'Profit','finance.balance':'Balance',
    'upgrades.title':'Upgrades','upgrades.build':'Build','upgrades.upgrade':'Upgrade','upgrades.level':'Level','upgrades.time':'Construction time',
    'status.queued':'Queued','status.available':'Available','status.running':'Running','status.finished':'Finished','status.ordered':'Ordered','status.inTransit':'In transit','status.delivered':'Delivered',
    'android.download':'📱 Download ORVUNO for Android',
    'boot.title':'ORVUNO could not be started','boot.text':'A technical error occurred while loading. Your game state was not changed.',
    'cleanup.packaging':'Packaging supplier','cleanup.brewBasics':'Brewery raw materials','cleanup.bottleWash':'Bottle washing detergent','cleanup.labels':'Labels','cleanup.hereMissing':'HERE access for live traffic is not configured yet','cleanup.hereAccess':'HERE access','cleanup.startMissing':'Starting location is missing'
  }
};

const PHRASE_KEYS={
  'Übersicht':'nav.dashboard','Dashboard':'nav.dashboard','Betrieb':'nav.business','Produktion':'nav.production','Lager':'nav.inventory','Einkauf':'nav.purchasing','Personal':'nav.employees','Maschinen':'nav.machines','Kundenaufträge':'nav.orders','Logistik':'nav.logistics','Finanzen':'nav.finance','Ausbau':'nav.upgrades','Markt':'nav.market','Nachrichten':'nav.messages','Profil':'nav.profile','Abmelden':'nav.logout',
  'Anmelden':'auth.login','Registrieren':'auth.register','E-Mail':'auth.email','Passwort':'auth.password','Passwort vergessen':'auth.forgot','Einloggen':'auth.loginAction',
  'Unternehmen':'business.company','Firmenkonto':'business.account','Geld':'business.money','Betrieb wechseln':'business.switch','Neuen Betrieb gründen':'business.new',
  'Produktionswarteschlange':'production.queue','Menge':'production.amount','Dauer':'production.duration','Fortschritt':'production.progress','Produktion starten':'production.start',
  'Lagerbestand':'inventory.stock','Kapazität':'inventory.capacity','Rohstoffe':'inventory.materials','Fertigwaren':'inventory.finishedGoods',
  'Lieferant':'purchasing.supplier','Lieferanten':'purchasing.suppliers','Preis':'purchasing.price','Lieferzeit':'purchasing.deliveryTime','Bestellen':'purchasing.order',
  'Mitarbeiter':'employees.employee','Einstellen':'employees.hire','Gehalt':'employees.salary','Maschine':'machines.machine','Zustand':'machines.condition','Verbessern':'machines.upgrade',
  'Kunde':'orders.customer','Lieferfrist':'orders.deadline','Liefern':'orders.deliver','Restmenge':'orders.remaining','Lieferungen':'logistics.deliveries','Lieferung':'logistics.delivery','Transport':'logistics.transport','Entfernung':'logistics.distance','Ankunft':'logistics.arrival',
  'Umsatz':'finance.revenue','Kosten':'finance.costs','Gewinn':'finance.profit','Kontostand':'finance.balance','Bauen':'upgrades.build','Ausbauen':'upgrades.upgrade','Stufe':'upgrades.level','Bauzeit':'upgrades.time',
  'Wartet':'status.queued','Verfügbar':'status.available','Läuft':'status.running','Fertig':'status.finished','Bestellt':'status.ordered','Unterwegs':'status.inTransit','Geliefert':'status.delivered',
  'Neu laden':'common.reload','Schließen':'common.close','Abbrechen':'common.cancel','Speichern':'common.save','Zurück':'common.back','Weiter':'common.next','Kaufen':'common.buy','Verkaufen':'common.sell','Starten':'common.start','Stoppen':'common.stop','Öffnen':'common.open','Details':'common.details','Suchen':'common.search','Einstellungen':'common.settings',
  '📱 ORVUNO für Android herunterladen':'android.download','ORVUNO konnte nicht gestartet werden':'boot.title','Beim Laden ist ein technischer Fehler aufgetreten. Der Spielstand wurde dadurch nicht verändert.':'boot.text',
  'Verpackungslieferant':'cleanup.packaging','Brauerei-Grundstoffe':'cleanup.brewBasics','Flaschenwaschmittel':'cleanup.bottleWash','Etiketten':'cleanup.labels','HERE-Zugang für Live-Verkehr ist noch nicht eingerichtet':'cleanup.hereMissing','HERE-Zugang':'cleanup.hereAccess','Startort fehlt':'cleanup.startMissing'
};

function normalizeLocale(code=''){
  return String(code).trim().toLowerCase().replace('_','-').split('-')[0];
}
function registerLocale(code,definition){
  const normalized=normalizeLocale(code);
  if(!normalized||!definition||typeof definition.messages!=='object')throw new Error('Invalid ORVUNO locale registration');
  locales.set(normalized,{meta:{name:normalized,nativeName:normalized,...definition.meta},messages:{...definition.messages}});
  refreshSelector();
  return normalized;
}
function getSavedLocale(){try{return normalizeLocale(localStorage.getItem(STORAGE_KEY)||'');}catch{return '';}}
function detectLocale(){
  const saved=getSavedLocale();if(saved&&locales.has(saved))return saved;
  const requested=(typeof navigator!=='undefined'?(navigator.languages?.length?navigator.languages:[navigator.language]):[])||[];
  for(const item of requested){const code=normalizeLocale(item);if(locales.has(code))return code;}
  return DEFAULT_LOCALE;
}
function t(key,params={}){
  const active=locales.get(activeLocale)?.messages||{};
  const fallback=locales.get(FALLBACK_LOCALE)?.messages||{};
  let value=active[key]??fallback[key]??key;
  for(const [name,replacement] of Object.entries(params))value=String(value).replaceAll(`{${name}}`,String(replacement));
  return value;
}
function setDirection(){
  if(typeof document==='undefined')return;
  document.documentElement.lang=activeLocale;
  document.documentElement.dir=RTL_LANGUAGES.has(activeLocale)?'rtl':'ltr';
}
function setLocale(code,{persist=true}={}){
  const normalized=normalizeLocale(code);
  if(!locales.has(normalized))return false;
  activeLocale=normalized;
  if(persist){try{localStorage.setItem(STORAGE_KEY,activeLocale);}catch{}}
  setDirection();apply(document);refreshSelector();
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('orvuno:localechange',{detail:{locale:activeLocale}}));
  return true;
}
function translateTextValue(value){
  if(activeLocale===DEFAULT_LOCALE)return value;
  const raw=String(value);const trimmed=raw.trim();if(!trimmed)return value;
  const key=PHRASE_KEYS[trimmed];if(!key)return value;
  const translated=t(key);return raw.replace(trimmed,translated);
}
function applyElement(el){
  if(!(el instanceof Element))return;
  const key=el.getAttribute('data-i18n');if(key)el.textContent=t(key);
  const placeholderKey=el.getAttribute('data-i18n-placeholder');if(placeholderKey)el.setAttribute('placeholder',t(placeholderKey));
  const titleKey=el.getAttribute('data-i18n-title');if(titleKey)el.setAttribute('title',t(titleKey));
  for(const child of el.childNodes){if(child.nodeType===Node.TEXT_NODE){const next=translateTextValue(child.nodeValue);if(next!==child.nodeValue)child.nodeValue=next;}}
}
function apply(root=document){
  if(typeof document==='undefined'||applying)return;
  applying=true;
  try{
    if(root.nodeType===Node.TEXT_NODE){const next=translateTextValue(root.nodeValue);if(next!==root.nodeValue)root.nodeValue=next;return;}
    if(root instanceof Element)applyElement(root);
    const scope=root.querySelectorAll?root:document;
    scope.querySelectorAll('[data-i18n],[data-i18n-placeholder],[data-i18n-title],button,a,label,h1,h2,h3,h4,th,td,span,div,p,option').forEach(applyElement);
  }finally{applying=false;}
}
function ensureSelector(){
  if(typeof document==='undefined'||document.getElementById('orvuno-language-control'))return;
  const wrap=document.createElement('div');wrap.id='orvuno-language-control';wrap.setAttribute('aria-label',t('language.choose'));
  Object.assign(wrap.style,{position:'fixed',right:'16px',top:'14px',zIndex:'99995',display:'flex',alignItems:'center',gap:'6px',padding:'6px 8px',border:'1px solid rgba(255,255,255,.22)',borderRadius:'10px',background:'rgba(7,16,29,.92)',boxShadow:'0 6px 20px rgba(0,0,0,.25)'});
  const icon=document.createElement('span');icon.textContent='🌐';icon.setAttribute('aria-hidden','true');
  const select=document.createElement('select');select.id='orvuno-language-select';select.title=t('language.choose');select.setAttribute('aria-label',t('language.choose'));
  Object.assign(select.style,{border:'0',outline:'0',background:'#142033',color:'#fff',padding:'6px 8px',borderRadius:'7px',fontWeight:'700',cursor:'pointer'});
  select.addEventListener('change',()=>setLocale(select.value));wrap.append(icon,select);document.body.append(wrap);refreshSelector();
}
function refreshSelector(){
  if(typeof document==='undefined')return;
  const select=document.getElementById('orvuno-language-select');if(!select)return;
  const old=select.value;select.textContent='';
  for(const [code,definition] of locales){const option=document.createElement('option');option.value=code;option.textContent=definition.meta.nativeName||definition.meta.name||code;select.append(option);}
  select.value=activeLocale||old||DEFAULT_LOCALE;select.title=t('language.choose');select.setAttribute('aria-label',t('language.choose'));
  const wrap=document.getElementById('orvuno-language-control');if(wrap)wrap.setAttribute('aria-label',t('language.choose'));
}
function install(){
  if(typeof document==='undefined')return false;
  activeLocale=detectLocale();setDirection();
  const start=()=>{ensureSelector();apply(document);if(observer)observer.disconnect();observer=new MutationObserver(records=>{if(applying)return;for(const record of records){for(const node of record.addedNodes)apply(node);}});observer.observe(document.documentElement,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  return true;
}

registerLocale('de',DE);registerLocale('en',EN);
activeLocale=detectLocale();
const api={registerLocale,setLocale,getLocale:()=>activeLocale,getAvailableLocales:()=>Array.from(locales.entries()).map(([code,v])=>({code,...v.meta})),t,apply,install,normalizeLocale};
if(typeof window!=='undefined'){window.orvunoI18n=api;install();}
export {registerLocale,setLocale,t,apply,install};
export default api;
