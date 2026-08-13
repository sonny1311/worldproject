// WorldProject - zentrale Waehrungsschicht. Interne Wirtschaftswerte bleiben in EUR.
export const BASE_CURRENCY="EUR";
export const CurrencyMeta={EUR:{digits:2},USD:{digits:2},GBP:{digits:2},CHF:{digits:2},PLN:{digits:2},CZK:{digits:2},DKK:{digits:2},SEK:{digits:2},NOK:{digits:2},CNY:{digits:2},JPY:{digits:0},KRW:{digits:0},INR:{digits:2},AUD:{digits:2},CAD:{digits:2},BRL:{digits:2},MXN:{digits:2},ZAR:{digits:2},TRY:{digits:2},UAH:{digits:2}};
export const CountryCurrency={DE:"EUR",AT:"EUR",BE:"EUR",ES:"EUR",FI:"EUR",FR:"EUR",GR:"EUR",HR:"EUR",IE:"EUR",IT:"EUR",NL:"EUR",PT:"EUR",SK:"EUR",SI:"EUR",US:"USD",GB:"GBP",CH:"CHF",PL:"PLN",CZ:"CZK",DK:"DKK",SE:"SEK",NO:"NOK",CN:"CNY",JP:"JPY",KR:"KRW",IN:"INR",AU:"AUD",CA:"CAD",BR:"BRL",MX:"MXN",ZA:"ZAR",TR:"TRY",UA:"UAH"};
export const DefaultExchangeRates={EUR:1,USD:1.17,GBP:.87,CHF:.93,PLN:4.26,CZK:24.5,DKK:7.46,SEK:11.1,NOK:11.8,CNY:8.39,JPY:173,KRW:1620,INR:102,AUD:1.8,CAD:1.61,BRL:6.35,MXN:21.8,ZAR:20.8,TRY:47.8,UAH:48.3};
const valid=c=>CurrencyMeta[String(c||"").toUpperCase()]?String(c).toUpperCase():BASE_CURRENCY;
export function countryFromLocale(locale=""){const p=String(locale).replace("_","-").split("-");const r=p.find((x,i)=>i>0&&/^[A-Za-z]{2}$/.test(x));return r?r.toUpperCase():null;}
export function currencyForCountry(country="DE"){return CountryCurrency[String(country).toUpperCase()]||BASE_CURRENCY;}
export function detectPlayerCountry(nav=globalThis.navigator){for(const l of [...(nav?.languages||[]),nav?.language].filter(Boolean)){const c=countryFromLocale(l);if(c)return c;}return"DE";}
export class WorldCurrencySystem{
 constructor({country=null,currency=null,locale="de-DE",rates=null}={}){this.baseCurrency=BASE_CURRENCY;this.country=String(country||detectPlayerCountry()).toUpperCase();this.currency=valid(currency||currencyForCountry(this.country));this.locale=locale;this.rates={...DefaultExchangeRates,...(rates||{}),EUR:1};this.ratesUpdatedAt=0;}
 setLocale(locale){this.locale=String(locale||"en");return this.locale;}
 setCountry(country,{keepCurrency=false}={}){this.country=String(country||"DE").toUpperCase();if(!keepCurrency)this.currency=currencyForCountry(this.country);this.savePreference();return this.country;}
 setCurrency(currency){this.currency=valid(currency);this.savePreference();return this.currency;}
 updateRates(rates={},updatedAt=Date.now()){for(const[k,v]of Object.entries(rates)){const c=valid(k),n=Number(v);if(c===String(k).toUpperCase()&&Number.isFinite(n)&&n>0)this.rates[c]=n;}this.rates.EUR=1;this.ratesUpdatedAt=Number(updatedAt)||Date.now();return this.rates;}
 convert(value,{from=BASE_CURRENCY,to=this.currency}={}){const n=Number(value||0),f=valid(from),t=valid(to);if(!Number.isFinite(n))return 0;return n/Number(this.rates[f]||1)*Number(this.rates[t]||1);}
 toBase(value,currency=this.currency){return this.convert(value,{from:currency,to:BASE_CURRENCY});}
 format(value,{from=BASE_CURRENCY,currency=this.currency,locale=this.locale,showCode=false}={}){const c=valid(currency),digits=CurrencyMeta[c].digits,n=this.convert(value,{from,to:c});return new Intl.NumberFormat(locale||"en",{style:"currency",currency:c,currencyDisplay:showCode?"code":"symbol",minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n);}
 savePreference(){try{localStorage.setItem("worldproject.currency",JSON.stringify({country:this.country,currency:this.currency}));}catch{}return{country:this.country,currency:this.currency};}
 loadPreference(){try{const p=JSON.parse(localStorage.getItem("worldproject.currency")||"null");if(p?.country)this.country=String(p.country).toUpperCase();if(p?.currency)this.currency=valid(p.currency);}catch{}return{country:this.country,currency:this.currency};}
 snapshot(){return{baseCurrency:BASE_CURRENCY,country:this.country,currency:this.currency,rates:{...this.rates},ratesUpdatedAt:this.ratesUpdatedAt};}
}
export const worldCurrency=new WorldCurrencySystem();worldCurrency.loadPreference();if(typeof window!=="undefined")window.worldCurrency=worldCurrency;
