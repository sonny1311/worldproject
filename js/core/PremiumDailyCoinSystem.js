// WorldProject - Premium Plus: 10 Coins je aktivem Kalendertag, maximal einmal pro Tag.
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';
const premium=new PremiumEntitlementSystem();
const dayKey=now=>{const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function grantPremiumDailyCoins(account={},company={},now=Date.now()){
 const state=premium.state(account,now),amount=Number(state.dailyCoins)||0,key=dayKey(now);
 if(!state.active||amount<=0)return{granted:0,reason:'not_eligible',day:key,planId:state.planId};
 account.premiumDailyCoinClaims??={};
 if(account.premiumDailyCoinClaims[key])return{granted:0,reason:'already_claimed',day:key,planId:state.planId};
 company.coins=Math.max(0,Number(company.coins)||0)+amount;
 account.premiumDailyCoinClaims[key]={at:now,amount,planId:state.planId};
 company.coinLedger??=[];company.coinLedger.push({at:now,type:'premium_daily',amount,balance:company.coins,planId:state.planId});
 return{granted:amount,reason:'granted',day:key,planId:state.planId,balance:company.coins};
}
export function runPremiumDailyCoinTest(){const now=new Date(2026,7,14,10).getTime(),account={premiumUntil:now+86400000,premiumPlan:'premium_plus'},company={coins:5};const a=grantPremiumDailyCoins(account,company,now),b=grantPremiumDailyCoins(account,company,now+1000);if(a.granted!==10||company.coins!==15||b.granted!==0)throw new Error('Premium-Plus-Tagescoins fehlerhaft');const next=grantPremiumDailyCoins(account,company,now+86400000);if(next.granted!==0)throw new Error('Abgelaufenes Premium darf keine Coins geben');return true;}
if(typeof window!=='undefined')window.worldPremiumDailyCoins={grant:grantPremiumDailyCoins,test:runPremiumDailyCoinTest};
