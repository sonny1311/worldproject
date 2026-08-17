import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';

export const COIN_TIME_REDUCTION=Object.freeze({minHours:1,maxHours:10,coinsPerHour:1,maxCoinsPerPurchase:10,minimumRealTimeRatio:0});
const premium=new PremiumEntitlementSystem();
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const account=()=>typeof window!=='undefined'?(window.worldCurrentUser||window.worldAccount||{}):{};

export function activeConstructionJobs(company={}){return(company?.constructionSite?.jobs||[]).filter(j=>j&&j.status==='building');}
export function constructionSlotState(company={},a=account(),now=Date.now()){const running=activeConstructionJobs(company).length,limit=premium.constructionLimit(a,now);return{running,limit,free:Math.max(0,limit-running),premium:premium.state(a,now).active,allowed:running<limit};}
export function assertCanStartConstruction(company={},a=account(),now=Date.now()){const s=constructionSlotState(company,a,now);if(!s.allowed)throw new Error(`Maximal ${s.limit} parallele Bauauftraege erlaubt.${s.premium?'':' Premium erweitert das Limit auf 5.'}`);return s;}
export function constructionMinimumFinishAt(job={}){return n(job?.startedAt||job?.startTime||job?.createdAt);}

export function timeReductionQuote(company={},job,hours=1,{now=Date.now()}={}){
 if(!job||!['building','upgrading'].includes(job.status))throw new Error('Dieser Vorgang kann nicht mehr verkuerzt werden');
 const end=n(job.finishAt),remainingMs=Math.max(0,end-now);if(!remainingMs)throw new Error('Der Vorgang ist bereits fertig');
 const requested=Math.max(1,Math.min(10,Math.floor(n(hours,1)))),reductionMs=Math.min(remainingMs,requested*3600000),cost=Math.max(1,Math.ceil(reductionMs/3600000));
 return{hours:requested,cost,remainingMs,reductionMs,newRemainingMs:remainingMs-reductionMs,coins:n(company.coins),minimumFinishAt:now,minimumRealTimeMs:0,locked:false};
}
export function reduceJobTimeWithCoins(company={},job,hours=1,{now=Date.now()}={}){
 const q=timeReductionQuote(company,job,hours,{now});if(n(company.coins)<q.cost)throw new Error(`Nicht genug Coins. Benoetigt: ${q.cost}, vorhanden: ${n(company.coins)}`);
 company.coins=n(company.coins)-q.cost;job.finishAt=Math.max(now,n(job.finishAt)-q.reductionMs);job.coinTimeReductionMs=n(job.coinTimeReductionMs)+q.reductionMs;job.coinTimeReductionHours=n(job.coinTimeReductionHours)+q.reductionMs/3600000;job.coinTimeReductionSpent=n(job.coinTimeReductionSpent)+q.cost;job.lastCoinTimeReductionAt=now;job.coinAccelerationPolicy='one-coin-per-started-hour';
 if(job.kind==='building'&&job.buildingInstanceId){const room=company?.buildingState?.rooms?.find(r=>r.instanceId===job.buildingInstanceId);if(room)room.finishAt=job.finishAt;}if(job.kind==='machine_upgrade'&&job.machineInstanceId){const m=company?.buildingState?.equipment?.find(x=>x.instanceId===job.machineInstanceId);if(m)m.busyUntil=job.finishAt;}
 return{...q,finishAt:job.finishAt,coinsAfter:company.coins};
}
const fmt=ms=>{let m=Math.max(0,Math.ceil(n(ms)/60000)),h=Math.floor(m/60);return h?`${h} Std. ${m%60} Min.`:`${m} Min.`;};
export function openCoinTimeReductionDialog({company,job,onDone=()=>{},parent=document.body}={}){
 if(typeof document==='undefined')return null;timeReductionQuote(company,job,1);const ov=document.createElement('div'),p=document.createElement('div'),s=document.createElement('select'),cancel=document.createElement('button'),buy=document.createElement('button');Object.assign(ov.style,{position:'fixed',inset:0,zIndex:30000,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center'});Object.assign(p.style,{width:'min(520px,94vw)',background:'#111827',color:'#fff',padding:'18px',borderRadius:'14px'});p.innerHTML=`<h2>🪙 Zeit verkuerzen</h2><b>${job.label||'Vorgang'}</b><div style="margin:10px 0;color:#fde68a">1 Coin je angefangener Stunde · maximal 10 Stunden pro Kauf.</div><div data-info></div>`;for(let h=1;h<=10;h++){const o=document.createElement('option');o.value=h;o.textContent=`bis zu ${h} Std. · max. ${h} Coins`;s.append(o);}Object.assign(s.style,{width:'100%',padding:'9px',margin:'10px 0'});cancel.textContent='Abbrechen';cancel.onclick=()=>ov.remove();const refresh=()=>{const q=timeReductionQuote(company,job,Number(s.value));p.querySelector('[data-info]').innerHTML=`Restzeit: <b>${fmt(q.remainingMs)}</b><br>Verkuerzung: <b>${fmt(q.reductionMs)}</b><br>Danach: <b>${fmt(q.newRemainingMs)}</b><br>Kosten: <b>${q.cost} Coins</b>`;buy.textContent=`${q.cost} Coin${q.cost===1?'':'s'} einsetzen`;buy.disabled=q.coins<q.cost;};s.onchange=refresh;buy.onclick=()=>{try{const r=reduceJobTimeWithCoins(company,job,Number(s.value));ov.remove();window.dispatchEvent(new CustomEvent('world:game-state-dirty'));onDone(r);}catch(e){alert(e.message);}};p.append(s,cancel,buy);ov.append(p);parent.append(ov);refresh();return ov;
}
export function runConstructionPremiumCoinTest(){const now=1000000,c={coins:10},j={status:'building',finishAt:now+2*3600000+15*60000};const q=timeReductionQuote(c,j,10,{now});if(q.cost!==3)throw new Error('Teil-Stunde muss einen Coin kosten');reduceJobTimeWithCoins(c,j,10,{now});if(j.finishAt!==now||c.coins!==7)throw new Error('Bau-Coin-Verkuerzung fehlerhaft');return true;}
if(typeof window!=='undefined')window.worldConstructionPremiumCoin={config:COIN_TIME_REDUCTION,slotState:constructionSlotState,assertCanStart:assertCanStartConstruction,quote:timeReductionQuote,reduce:reduceJobTimeWithCoins,minimumFinishAt:constructionMinimumFinishAt,openDialog:openCoinTimeReductionDialog,runTest:runConstructionPremiumCoinTest};
