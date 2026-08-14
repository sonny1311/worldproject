// WorldProject - aktive Warentransporte mit Coins beschleunigen.
// Einheitliche Regel: bis zu 10 Stunden pro Kauf, 5 Coins je tatsächlich verkürzter angefangener Stunde.
import { COIN_TIME_REDUCTION } from './ConstructionPremiumCoinSystem.js';
import { timeMs,writeTimeValue } from './TimeValueUtils.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
function arrivalKey(transport={}){for(const k of ['arrivalTime','arrivalAt','finishAt'])if(timeMs(transport[k])>0)return k;return'arrivalTime';}
function arrivalMs(transport={}){return timeMs(transport[arrivalKey(transport)]);}
function setArrival(transport,ms){const key=arrivalKey(transport);if(!(key in transport)){transport[key]=new Date(ms);return;}writeTimeValue(transport,key,ms);}
export function transportTimeReductionQuote(company={},transport,hours=1,{now=Date.now()}={}){
 if(!transport)throw new Error('Transport fehlt');
 const end=arrivalMs(transport);if(end<=now)throw new Error('Transport ist bereits angekommen');
 const requested=Math.max(COIN_TIME_REDUCTION.minHours,Math.min(COIN_TIME_REDUCTION.maxHours,Math.floor(n(hours,1))));
 const remainingMs=end-now,reductionMs=Math.min(remainingMs,requested*3600000),billableHours=Math.max(1,Math.ceil(reductionMs/3600000)),cost=billableHours*COIN_TIME_REDUCTION.coinsPerHour;
 if(cost>COIN_TIME_REDUCTION.maxCoinsPerPurchase)throw new Error('Maximal 50 Coins pro Einzelkauf');
 return{hours:billableHours,requestedHours:requested,cost,remainingMs,reductionMs,newArrivalMs:Math.max(now,end-reductionMs),coins:n(company.coins)};
}
export function reduceTransportTimeWithCoins(company={},transport,hours=1,{now=Date.now()}={}){
 const q=transportTimeReductionQuote(company,transport,hours,{now});if(n(company.coins)<q.cost)throw new Error(`Nicht genug Coins. Benötigt: ${q.cost}, vorhanden: ${n(company.coins)}`);
 company.coins=n(company.coins)-q.cost;setArrival(transport,q.newArrivalMs);transport.coinTimeReductionHours=n(transport.coinTimeReductionHours)+q.reductionMs/3600000;transport.coinTimeReductionSpent=n(transport.coinTimeReductionSpent)+q.cost;transport.lastCoinTimeReductionAt=now;
 if(Number.isFinite(Number(transport.totalHours)))transport.totalHours=Math.max(0,n(transport.totalHours)-q.reductionMs/3600000);
 company.coinLedger??=[];company.coinLedger.push({at:now,type:'transport_time_reduction',amount:-q.cost,balance:company.coins,transportId:transport.id||null,hours:q.hours,reductionMs:q.reductionMs});
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'transport-coin-time-reduction'}}));
 return{...q,arrivalTime:new Date(q.newArrivalMs),coinsAfter:company.coins};
}
export function runTransportCoinTimeReductionTest(){const now=1000000,c={coins:150},t={id:'t1',arrivalTime:new Date(now+20*3600000),totalHours:20};const r=reduceTransportTimeWithCoins(c,t,10,{now});if(r.cost!==50||c.coins!==100||t.arrivalTime.getTime()!==now+10*3600000||t.totalHours!==10)throw new Error('Transport-Coin-Verkürzung fehlerhaft');const short={id:'short',arrivalTime:new Date(now+30*60000),totalHours:.5},q=transportTimeReductionQuote(c,short,10,{now});if(q.cost!==5||q.hours!==1||q.reductionMs!==30*60000)throw new Error('Kurzer Resttransport wird mit zu vielen Coins berechnet');const iso=new Date(now+5*3600000).toISOString(),p={id:'persisted',arrivalTime:iso,totalHours:5};reduceTransportTimeWithCoins(c,p,1,{now});if(typeof p.arrivalTime!=='string'||Date.parse(p.arrivalTime)!==now+4*3600000)throw new Error('Persistierte Marktlieferung wird beim Beschleunigen beschädigt');return true;}
if(typeof window!=='undefined')window.worldTransportCoinTimeReduction={quote:transportTimeReductionQuote,reduce:reduceTransportTimeWithCoins,test:runTransportCoinTimeReductionTest};
