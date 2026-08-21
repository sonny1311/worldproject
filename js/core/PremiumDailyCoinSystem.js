// ORVUNO - Premium vergibt keine taeglichen Coins mehr.
// Echtgeld-/Coin-Guthaben darf niemals clientseitig erzeugt werden. Diese Kompatibilitaetsdatei
// bleibt bestehen, damit alte Imports nicht brechen, liefert aber ausschliesslich 0 Coins.
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';
const premium=new PremiumEntitlementSystem();
const dayKey=now=>{const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function grantPremiumDailyCoins(account={},company={},now=Date.now()){
 const state=premium.state(account,now),key=dayKey(now);
 return{granted:0,reason:'feature_disabled',day:key,planId:state.planId,balance:Math.max(0,Number(company?.coins)||0)};
}
export function runPremiumDailyCoinTest(){
 const now=new Date(2026,7,14,10).getTime(),account={premiumUntil:now+86400000,premiumPlan:'premium_basic'},company={coins:5};
 const before=company.coins,result=grantPremiumDailyCoins(account,company,now);
 if(result.granted!==0||company.coins!==before||premium.state(account,now).dailyCoins!==0)throw new Error('Deaktivierte Premium-Tagescoins duerfen kein Guthaben erzeugen');
 return true;
}
if(typeof window!=='undefined')window.worldPremiumDailyCoins={grant:grantPremiumDailyCoins,test:runPremiumDailyCoinTest};