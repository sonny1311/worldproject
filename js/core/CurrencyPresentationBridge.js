import { worldCurrency,currencyForCountry } from './WorldCurrencySystem.js';

export function playerMoneyContext(account=null){const a=account||globalThis.worldAccount||globalThis.worldPlayerAccount||{};const country=String(a.country||a.countryCode||a.country_code||worldCurrency.country||'DE').toUpperCase();const currency=a.currency||a.currencyCode||a.currency_code||currencyForCountry(country);return{country,currency};}
export function applyPlayerMoneyContext(account=null){const c=playerMoneyContext(account);worldCurrency.setCountry(c.country);worldCurrency.setCurrency(c.currency);return c;}
export function formatMoney(value,{currency=null,from='EUR',locale=null,showCode=false}={}){return worldCurrency.format(value,{from,currency:currency||worldCurrency.currency,locale:locale||worldCurrency.locale,showCode});}
export function moneyValue(value,{currency=null,from='EUR'}={}){return worldCurrency.convert(value,{from,to:currency||worldCurrency.currency});}

if(typeof window!=='undefined'){
 window.worldMoney={format:formatMoney,convert:moneyValue,context:playerMoneyContext,apply:applyPlayerMoneyContext,currency:worldCurrency};
 window.addEventListener('world:locale-changed',e=>worldCurrency.setLocale(e?.detail?.locale||'en'));
 for(const eventName of ['worldproject:account-loaded','worldproject:profile-loaded','worldproject:company-activated'])window.addEventListener(eventName,e=>applyPlayerMoneyContext(e?.detail?.account||e?.detail?.profile||null));
}
