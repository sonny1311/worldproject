// WorldProject - Premium Plus: 10 Coins je aktivem Kalendertag, maximal einmal pro Tag.
// Claim-Marker werden sowohl am Account als auch im persistierten Firmenzustand gespiegelt.
// Spaeter wird dieselbe Idempotenz serverseitig auf dem Wallet erzwungen.
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';
const premium=new PremiumEntitlementSystem();
const dayKey=now=>{const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function persistentClaims(company={}){company.accountEntitlementState??={};company.accountEntitlementState.premiumDailyCoinClaims??={};return company.accountEntitlementState.premiumDailyCoinClaims;}
function localClaimKey(account,key){const id=account?.id||account?.userId||account?.email||'local';return `worldproject:premium-daily:${id}:${key}`;}
function hasLocalClaim(account,key){try{return typeof localStorage!=='undefined'&&localStorage.getItem(localClaimKey(account,key))==='1';}catch{return false;}}
function setLocalClaim(account,key){try{if(typeof localStorage!=='undefined')localStorage.setItem(localClaimKey(account,key),'1');}catch{}}
export function grantPremiumDailyCoins(account={},company={},now=Date.now()){
 const state=premium.state(account,now),amount=Number(state.dailyCoins)||0,key=dayKey(now);
 if(!state.active||amount<=0)return{granted:0,reason:'not_eligible',day:key,planId:state.planId};
 account.premiumDailyCoinClaims??={};const stored=persistentClaims(company);
 if(account.premiumDailyCoinClaims[key]||stored[key]||hasLocalClaim(account,key))return{granted:0,reason:'already_claimed',day:key,planId:state.planId};
 company.coins=Math.max(0,Number(company.coins)||0)+amount;const claim={at:now,amount,planId:state.planId};account.premiumDailyCoinClaims[key]=claim;stored[key]=claim;setLocalClaim(account,key);
 company.coinLedger??=[];company.coinLedger.push({at:now,type:'premium_daily',amount,balance:company.coins,planId:state.planId,day:key});
 return{granted:amount,reason:'granted',day:key,planId:state.planId,balance:company.coins};
}
export function runPremiumDailyCoinTest(){const now=new Date(2026,7,14,10).getTime(),testId=`premium-daily-regression-${now}`,account={id:testId,premiumUntil:now+86400000,premiumPlan:'premium_plus'},company={coins:5},key=dayKey(now),storageKey=localClaimKey(account,key);try{if(typeof localStorage!=='undefined')localStorage.removeItem(storageKey);}catch{}const a=grantPremiumDailyCoins(account,company,now),b=grantPremiumDailyCoins(account,company,now+1000);if(a.granted!==10||company.coins!==15||b.granted!==0||!company.accountEntitlementState?.premiumDailyCoinClaims?.[key])throw new Error('Premium-Plus-Tagescoins fehlerhaft');const restoredAccount={id:testId,premiumUntil:now+86400000,premiumPlan:'premium_plus'},restoredCompany=JSON.parse(JSON.stringify(company)),c=grantPremiumDailyCoins(restoredAccount,restoredCompany,now+2000);if(c.granted!==0)throw new Error('Premium-Plus-Tagescoins nach Reload doppelt gutgeschrieben');try{if(typeof localStorage!=='undefined')localStorage.removeItem(storageKey);}catch{}return true;}
if(typeof window!=='undefined')window.worldPremiumDailyCoins={grant:grantPremiumDailyCoins,test:runPremiumDailyCoinTest};
