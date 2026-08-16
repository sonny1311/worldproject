// WorldProject - zentrale Internationalisierung (i18n)
// Alle sichtbaren Texte sollen langfristig ueber Schluessel laufen statt fest im UI zu stehen.
export const SupportedLocales={
  de:{label:"Deutsch",nativeLabel:"Deutsch"},
  en:{label:"English",nativeLabel:"English"},
  es:{label:"Spanish",nativeLabel:"Español"},
  fr:{label:"French",nativeLabel:"Français"},
  it:{label:"Italian",nativeLabel:"Italiano"},
  nl:{label:"Dutch",nativeLabel:"Nederlands"},
  pl:{label:"Polish",nativeLabel:"Polski"},
  pt:{label:"Portuguese",nativeLabel:"Português"},
  tr:{label:"Turkish",nativeLabel:"Türkçe"},
  ru:{label:"Russian",nativeLabel:"Русский"},
  uk:{label:"Ukrainian",nativeLabel:"Українська"},
  ar:{label:"Arabic",nativeLabel:"العربية"},
  zh:{label:"Chinese",nativeLabel:"中文"},
  ja:{label:"Japanese",nativeLabel:"日本語"},
  ko:{label:"Korean",nativeLabel:"한국어"},
  hi:{label:"Hindi",nativeLabel:"हिन्दी"}
};

export const CountryLocale={DE:'de',AT:'de',CH:'de',GB:'en',US:'en',CA:'en',AU:'en',NZ:'en',IE:'en',ES:'es',MX:'es',AR:'es',CL:'es',CO:'es',PE:'es',FR:'fr',IT:'it',NL:'nl',BE:'nl',PL:'pl',PT:'pt',BR:'pt',TR:'tr',RU:'ru',UA:'uk',CN:'zh',TW:'zh',HK:'zh',JP:'ja',KR:'ko',IN:'hi',AE:'ar',SA:'ar',EG:'ar',MA:'ar'};
export function localeForCountry(country='DE'){return CountryLocale[String(country||'DE').toUpperCase()]||'en';}

const dictionaries={
  de:{
    "production.missing_title":"Für diese Produktion fehlen noch:","production.target_quantity":"Gewünschte Produktionsmenge","production.required_for":"Benötigt für {quantity} {unit} {product}","production.start":"Produktion starten","production.queue":"Produktion einplanen","production.start_planned":"Geplante Produktion starten","production.delete_planned":"Planung löschen","production.pause":"Pausieren","production.resume":"Fortsetzen","production.cannot_start":"Geplante Produktion kann derzeit nicht gestartet werden. Prüfe Rohstoffe und Maschinenverfügbarkeit.","production.brew_master_required":"Für die Bierproduktion wird ein aktiver Braumeister benötigt.","production.take_order_quantity":"Fehlmenge aus Auftrag übernehmen","operations.open":"Einkauf, Lager & Produktion öffnen","operations.manage_hint":"Einkauf, Lieferungen, Lager und Produktionsplanung werden gemeinsam im operativen Betriebsdialog verwaltet.","operations.supply_title":"📦 Lieferungen & Einkauf","operations.production_title":"🏗️ Produktion","economy.insufficient_funds":"Nicht genug Firmenvermögen: {required} benötigt, {available} verfügbar.",
    "status.order.ordered":"Bestellt","status.order.in_transit":"Unterwegs","status.order.arrived":"Angekommen","status.order.stored":"Eingelagert","status.order.delayed":"Verspätet","status.order.cancelled":"Storniert","status.production.queued":"Geplant","status.production.available":"Bereit","status.production.running":"In Produktion","status.production.paused":"Pausiert","status.production.finished":"Fertig","status.production.cancelled":"Abgebrochen","time.arrived":"angekommen","time.unknown":"unbekannt","storage.raw":"Rohstofflager","storage.packaging":"Verpackungslager","storage.finished":"Fertigwarenlager","storage.cold":"Kühllager","materials.malt":"Malz","materials.hops":"Hopfen","materials.yeast":"Hefe","materials.water":"Wasser","materials.bottles":"0,33-l-Flaschen","materials.clean_bottles":"Gereinigte 0,33-l-Flaschen","materials.caps":"Kronkorken","materials.labels":"Etiketten","units.kg":"kg","units.l":"l","units.pcs":"Stück","units.m2":"m²","units.m3":"m³",
    "supplier.regional_malt":"Regionaler Malzlieferant","supplier.regional_hops":"Regionaler Hopfenlieferant","supplier.regional_yeast":"Regionaler Hefelieferant","supplier.regional_water":"Regionaler Wasserlieferant","supplier.regional_packaging":"Regionaler Verpackungslieferant","supplier.generic":"Lieferant","traffic.ai_carrier":"KI-Transporteur"
  },
  en:{
    "production.missing_title":"Still required for this production:","production.target_quantity":"Target production quantity","production.required_for":"Required for {quantity} {unit} of {product}","production.start":"Start production","production.queue":"Schedule production","production.start_planned":"Start planned production","production.delete_planned":"Delete plan","production.pause":"Pause","production.resume":"Resume","production.cannot_start":"The planned production cannot be started right now. Check materials and machine availability.","production.brew_master_required":"An active brewmaster is required for beer production.","production.take_order_quantity":"Use missing quantity from order","operations.open":"Open purchasing, storage & production","operations.manage_hint":"Purchasing, deliveries, storage and production planning are managed together in the operations dialog.","operations.supply_title":"📦 Deliveries & purchasing","operations.production_title":"🏗️ Production","economy.insufficient_funds":"Insufficient company funds: {required} required, {available} available.",
    "status.order.ordered":"Ordered","status.order.in_transit":"In transit","status.order.arrived":"Arrived","status.order.stored":"Stored","status.order.delayed":"Delayed","status.order.cancelled":"Cancelled","status.production.queued":"Planned","status.production.available":"Ready","status.production.running":"In production","status.production.paused":"Paused","status.production.finished":"Finished","status.production.cancelled":"Cancelled","time.arrived":"arrived","time.unknown":"unknown","storage.raw":"Raw materials","storage.packaging":"Packaging","storage.finished":"Finished goods","storage.cold":"Cold storage","materials.malt":"Malt","materials.hops":"Hops","materials.yeast":"Yeast","materials.water":"Water","materials.bottles":"0.33 l bottles","materials.clean_bottles":"Clean 0.33 l bottles","materials.caps":"Bottle caps","materials.labels":"Labels","units.kg":"kg","units.l":"l","units.pcs":"pcs","units.m2":"m²","units.m3":"m³",
    "supplier.regional_malt":"Regional malt supplier","supplier.regional_hops":"Regional hops supplier","supplier.regional_yeast":"Regional yeast supplier","supplier.regional_water":"Regional water supplier","supplier.regional_packaging":"Regional packaging supplier","supplier.generic":"Supplier","traffic.ai_carrier":"AI carrier"
  },
  es:{"materials.malt":"Malta","materials.hops":"Lúpulo","materials.yeast":"Levadura","materials.water":"Agua","materials.bottles":"Botellas de 0,33 l","materials.clean_bottles":"Botellas limpias de 0,33 l","materials.caps":"Chapas","materials.labels":"Etiquetas"},
  zh:{"materials.malt":"麦芽","materials.hops":"啤酒花","materials.yeast":"酵母","materials.water":"水","materials.bottles":"0.33升玻璃瓶","materials.clean_bottles":"已清洗0.33升玻璃瓶","materials.caps":"瓶盖","materials.labels":"标签"}
};

export class InternationalizationSystem{
 constructor({locale=null,fallback="en"}={}){this.fallback=fallback;this.locale=this.normalize(locale||this.detectLocale());}
 normalize(locale){const l=String(locale||"").toLowerCase().replace("_","-");const base=l.split("-")[0];return SupportedLocales[base]?base:(SupportedLocales[this.fallback]?this.fallback:"en");}
 detectLocale(){return navigator.languages?.[0]||navigator.language||"en";}
 setLocale(locale){this.locale=this.normalize(locale);try{localStorage.setItem("worldproject.locale",this.locale);}catch{}window.dispatchEvent(new CustomEvent("world:locale-changed",{detail:{locale:this.locale}}));return this.locale;}
 setCountryLocale(country){return this.setLocale(localeForCountry(country));}
 loadSavedLocale(){try{const saved=localStorage.getItem("worldproject.locale");if(saved)this.locale=this.normalize(saved);}catch{}return this.locale;}
 addDictionary(locale,entries){const l=this.normalize(locale);dictionaries[l]={...(dictionaries[l]||{}),...(entries||{})};}
 t(key,vars={}){const dict=dictionaries[this.locale]||{},fallback=dictionaries[this.fallback]||dictionaries.en||{};let text=dict[key]??fallback[key]??key;for(const[k,v]of Object.entries(vars))text=text.replaceAll(`{${k}}`,String(v));return text;}
 materialLabel(id){return this.t(`materials.${id}`);}
 formatNumber(value,{maximumFractionDigits=2}={}){return new Intl.NumberFormat(this.locale,{maximumFractionDigits}).format(Number(value||0));}
}

export const i18n=new InternationalizationSystem();
i18n.loadSavedLocale();
if(typeof window!=='undefined'){
 window.worldI18n=i18n;
 const applyAccountLocale=e=>{const a=e?.detail?.account||e?.detail?.profile||window.worldCurrentUser||window.worldAccount||null;const country=a?.country||a?.countryCode||a?.country_code;if(country)i18n.setCountryLocale(country);};
 for(const ev of ['worldproject:account-loaded','worldproject:profile-loaded','worldproject:company-activated'])window.addEventListener(ev,applyAccountLocale);
}
