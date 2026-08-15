import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';
import { CONSTRUCTION_COIN_POLICY } from './ConstructionCoinAccelerationPolicy.js';

export const COIN_TIME_REDUCTION=Object.freeze({minHours:1,maxHours:10,coinsPerHour:5,maxCoinsPerPurchase:50,minimumRealTimeRatio:CONSTRUCTION_COIN_POLICY.minimumRealTimeRatio});
const premium=new PremiumEntitlementSystem();
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const currentAccount=()=>typeof window!=='undefined'?(window.worldCurrentUser||window.worldAccount||{}):{};

function timing(job){
 const startedAt=n(job?.startedAt||job?.startTime||job?.createdAt);
 let originalDurationMs=n(job?.originalDurationMs);
 if(originalDurationMs<=0&&n(job?.durationMinutes)>0)originalDurationMs=n(job.durationMinutes)*60000;
 if(originalDurationMs<=0&&startedAt>0)originalDurationMs=Math.max(0,n(job.finishAt)-startedAt+n(job.coinTimeReductionMs));
 job.originalDurationMs=originalDurationMs;
 return{startedAt,originalDurationMs,minimumFinishAt:startedAt+originalDurationMs*COIN_TIME_REDUCTION.minimumRealTimeRatio};
}

export function activeConstructionJobs(company={}){return(company?.constructionSite?.jobs||[]).filter(j=>j&&j.status==='building');}
export function constructionSlotState(company={},account=currentAccount(),now=Date.now()){const running=activeConstructionJobs(company).length,limit=premium.constructionLimit(account,now);return{running,limit,free:Math.max(0,limit-running),premium:premium.state(account,now).active,allowed:running<limit};}
export function assertCanStartConstruction(company={},account=currentAccount(),now=Date.now()){const s=constructionSlotState(company,account,now);if(!s.allowed)throw new Error(`Maximal ${s.limit} parallele Bauauftraege erlaubt.${s.premium?'':' Premium erweitert das Limit auf 5.'}`);return s;}
export function constructionMinimumFinishAt(job={}){return timing(job).minimumFinishAt;}

export function timeReductionQuote(company={},job,hours=1,{now=Date.now()}={}){
 if(!job||!['building','upgrading'].includes(job.status))throw new Error('Dieser Vorgang kann nicht mehr verkuerzt werden');
 const t=timing(job),requested=Math.max(1,Math.min(10,Math.floor(n(hours,1)))),remainingMs=Math.max(0,n(job.finishAt)-n(now));
 if(remainingMs<=0)throw new Error('Der Vorgang ist bereits fertig');
 const earliest=Math.max(n(now),t.minimumFinishAt),reductionMs=Math.min(requested*3600000,Math.max(0,n(job.finishAt)-earliest));
 const billableHours=reductionMs>0?Math.max(1,Math.ceil(reductionMs/3600000)):0,cost=Math.min(50,billableHours*5);
 return{hours:requested,cost,remainingMs,reductionMs,newRemainingMs:remainingMs-reductionMs,coins:n(company.coins),minimumFinishAt:t.minimumFinishAt,minimumRealTimeMs:t.originalDurationMs*.25,locked:reductionMs<=0};
}

export function reduceJobTimeWithCoins(company={},job,hours=1,{now=Date.now()}={}){
 const q=timeReductionQuote(company,job,hours,{now});
 if(q.locked)throw new Error('Die letzten 25 % der urspruenglichen Bau- oder Montagezeit muessen normal ablaufen.');
 if(n(company.coins)<q.cost)throw new Error(`Nicht genug Coins. Benoetigt: ${q.cost}, vorhanden: ${n(company.coins)}`);
 company.coins=n(company.coins)-q.cost;job.finishAt=Math.max(Math.max(now,q.minimumFinishAt),n(job.finishAt)-q.reductionMs);job.coinTimeReductionMs=n(job.coinTimeReductionMs)+q.reductionMs;job.coinTimeReductionHours=n(job.coinTimeReductionHours)+q.reductionMs/3600000;job.coinTimeReductionSpent=n(job.coinTimeReductionSpent)+q.cost;job.lastCoinTimeReductionAt=now;job.coinAccelerationPolicy='25-percent-real-time';
 if(job.kind==='building'&&job.buildingInstanceId){const room=company?.buildingState?.rooms?.find(r=>r.instanceId===job.buildingInstanceId);if(room)room.finishAt=job.finishAt;}
 if(job.kind==='machine_upgrade'&&job.machineInstanceId){const machine=company?.buildingState?.equipment?.find(m=>m.instanceId===job.machineInstanceId);if(machine)machine.busyUntil=job.finishAt;}
 return{...q,finishAt:job.finishAt,coinsAfter:company.coins};
}

const fmt=ms=>{let m=Math.max(0,Math.ceil(n(ms)/60000));const d=Math.floor(m/1440);m-=d*1440;const h=Math.floor(m/60),r=m%60;return[d?`${d} T`:null,h?`${h} Std.`:null,`${r} Min.`].filter(Boolean).join(' ');};
export function openCoinTimeReductionDialog({company,job,onDone=()=>{},parent=document.body}={}){
 if(typeof document==='undefined')return null;const first=timeReductionQuote(company,job,1,{now:Date.now()});if(first.locked)throw new Error('Die letzten 25 % muessen normal ablaufen.');
 const ov=document.createElement('div'),p=document.createElement('div');Object.assign(ov.style,{position:'fixed',inset:0,zIndex:30000,background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center'});Object.assign(p.style,{width:'min(520px,94vw)',background:'#111827',color:'#fff',padding:'18px',borderRadius:'14px'});p.innerHTML=`<h2>🪙 Zeit verkuerzen</h2><b>${job.label||'Vorgang'}</b><div style="margin:10px 0;color:#fde68a">Die letzten 25 % der urspruenglichen Projektzeit sind gesperrt.</div><div data-info></div>`;const s=document.createElement('select');for(let h=1;h<=10;h++){const o=document.createElement('option');o.value=h;o.textContent=`bis zu ${h} Stunde${h===1?'':'n'} - max. ${h*5} Coins`;s.append(o);}Object.assign(s.style,{width:'100%',padding:'9px',margin:'10px 0'});const cancel=document.createElement('button'),buy=document.createElement('button');cancel.textContent='Abbrechen';cancel.onclick=()=>ov.remove();const refresh=()=>{const q=timeReductionQuote(company,job,Number(s.value),{now:Date.now()});p.querySelector('[data-info]').innerHTML=`Restzeit: <b>${fmt(q.remainingMs)}</b><br>Verkuerzung: <b>${fmt(q.reductionMs)}</b><br>Danach: <b>${fmt(q.newRemainingMs)}</b><br>Mindestlaufzeit: <b>${fmt(q.minimumRealTimeMs)}</b><br>Kosten: <b>${q.cost} Coins</b>`;buy.textContent=q.locked?'25-%-Grenze erreicht':`${q.cost} Coins einsetzen`;buy.disabled=q.locked||q.coins<q.cost;};s.onchange=refresh;buy.onclick=()=>{try{const r=reduceJobTimeWithCoins(company,job,Number(s.value),{now:Date.now()});ov.remove();window.dispatchEvent(new CustomEvent('world:game-state-dirty'));onDone(r);}catch(e){alert(e.message);refresh();}};p.append(s,cancel,buy);ov.append(p);parent.append(ov);refresh();return ov;}

export function runConstructionPremiumCoinTest(){const now=1000000,c={coins:1000,constructionSite:{jobs:[{status:'building',kind:'building',startedAt:now,finishAt:now+20*3600000,durationMinutes:1200}]}};for(let i=0;i<10;i++){const q=timeReductionQuote(c,c.constructionSite.jobs[0],10,{now});if(q.locked)break;reduceJobTimeWithCoins(c,c.constructionSite.jobs[0],10,{now});}if(c.constructionSite.jobs[0].finishAt!==now+5*3600000)throw new Error('25-Prozent-Regel fehlerhaft');return true;}
if(typeof window!=='undefined')window.worldConstructionPremiumCoin={config:COIN_TIME_REDUCTION,slotState:constructionSlotState,assertCanStart:assertCanStartConstruction,quote:timeReductionQuote,reduce:reduceJobTimeWithCoins,minimumFinishAt:constructionMinimumFinishAt,openDialog:openCoinTimeReductionDialog,runTest:runConstructionPremiumCoinTest};
