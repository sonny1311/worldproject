// WorldProject - aktive Warentransporte mit Coins beschleunigen.
// Einheitliche Regel: 1-10 Stunden, 5 Coins je Stunde, max. 50 Coins pro Einzelkauf.
import { COIN_TIME_REDUCTION } from './ConstructionPremiumCoinSystem.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
function arrivalMs(transport={}){const v=transport.arrivalTime??transport.arrivalAt??transport.finishAt;return v instanceof Date?v.getTime():n(v);}
function setArrival(transport,ms){if(transport.arrivalTime instanceof Date)transport.arrivalTime=new Date(ms);else if('arrivalAt' in transport)transport.arrivalAt=ms;else if('finishAt' in transport)transport.finishAt=ms;else transport.arrivalTime=new Date(ms);}
export function transportTimeReductionQuote(company={},transport,hours=1,{now=Date.now()}={}){
 if(!transport)throw new Error('Transport fehlt');
 const end=arrivalMs(transport);if(end<=now)throw new Error('Transport ist bereits angekommen');
 const requested=Math.max(COIN_TIME_REDUCTION.minHours,Math.min(COIN_TIME_REDUCTION.maxHours,Math.floor(n(hours,1))));
 const remainingMs=end-now,reductionMs=Math.min(remainingMs,requested*3600000),cost=requested*COIN_TIME_REDUCTION.coinsPerHour;
 if(cost>COIN_TIME_REDUCTION.maxCoinsPerPurchase)throw new Error('Maximal 50 Coins pro Einzelkauf');
 return{hours:requested,cost,remainingMs,reductionMs,newArrivalMs:Math.max(now,end-reductionMs),coins:n(company.coins)};
}
export function reduceTransportTimeWithCoins(company={},transport,hours=1,{now=Date.now()}={}){
 const q=transportTimeReductionQuote(company,transport,hours,{now});if(n(company.coins)<q.cost)throw new Error(`Nicht genug Coins. Benötigt: ${q.cost}, vorhanden: ${n(company.coins)}`);
 company.coins=n(company.coins)-q.cost;setArrival(transport,q.newArrivalMs);transport.coinTimeReductionHours=n(transport.coinTimeReductionHours)+q.hours;transport.coinTimeReductionSpent=n(transport.coinTimeReductionSpent)+q.cost;transport.lastCoinTimeReductionAt=now;
 if(Number.isFinite(Number(transport.totalHours)))transport.totalHours=Math.max(0,n(transport.totalHours)-q.reductionMs/3600000);
 company.coinLedger??=[];company.coinLedger.push({at:now,type:'transport_time_reduction',amount:-q.cost,balance:company.coins,transportId:transport.id||null,hours:q.hours});
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'transport-coin-time-reduction'}}));
 return{...q,arrivalTime:new Date(q.newArrivalMs),coinsAfter:company.coins};
}
export function runTransportCoinTimeReductionTest(){const now=1000000,c={coins:100},t={id:'t1',arrivalTime:new Date(now+20*3600000),totalHours:20};const r=reduceTransportTimeWithCoins(c,t,10,{now});if(r.cost!==50||c.coins!==50||t.arrivalTime.getTime()!==now+10*3600000||t.totalHours!==10)throw new Error('Transport-Coin-Verkürzung fehlerhaft');return true;}
if(typeof window!=='undefined')window.worldTransportCoinTimeReduction={quote:transportTimeReductionQuote,reduce:reduceTransportTimeWithCoins,test:runTransportCoinTimeReductionTest};
