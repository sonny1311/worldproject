// WorldProject – zentrale Premium-/Coin-Regeln fuer Bauzeiten.
// Standard: 3 parallele Bauauftraege, Premium: 5.
// Laufende Auftraege werden bei Premium-Ablauf niemals pausiert oder abgebrochen.
// Zeitverkuerzung: 1–10 Stunden, 5 Coins je Stunde, maximal 50 Coins pro Einzelkauf.
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';

export const COIN_TIME_REDUCTION = Object.freeze({
  minHours: 1,
  maxHours: 10,
  coinsPerHour: 5,
  maxCoinsPerPurchase: 50
});

const premium = new PremiumEntitlementSystem();
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const currentAccount=()=>typeof window!=='undefined'?(window.worldCurrentUser||window.worldAccount||{}):{};

export function activeConstructionJobs(company={}){
  const jobs=company?.constructionSite?.jobs||[];
  return jobs.filter(j=>j&&j.status==='building');
}

export function constructionSlotState(company={},account=currentAccount(),now=Date.now()){
  const running=activeConstructionJobs(company).length;
  const limit=premium.constructionLimit(account,now);
  return {running,limit,free:Math.max(0,limit-running),premium:premium.state(account,now).active,allowed:running<limit};
}

export function assertCanStartConstruction(company={},account=currentAccount(),now=Date.now()){
  const s=constructionSlotState(company,account,now);
  if(!s.allowed){
    const extra=s.premium?'':' Premium erweitert das Limit auf 5.';
    throw new Error(`Maximal ${s.limit} parallele Bauauftraege erlaubt.${extra}`);
  }
  return s;
}

export function timeReductionQuote(company={},job,hours=1,{now=Date.now()}={}){
  if(!job||!['building','upgrading'].includes(job.status))throw new Error('Dieser Vorgang kann nicht mehr verkuerzt werden');
  const requested=Math.max(COIN_TIME_REDUCTION.minHours,Math.min(COIN_TIME_REDUCTION.maxHours,Math.floor(n(hours,1))));
  const remainingMs=Math.max(0,n(job.finishAt)-n(now));
  if(remainingMs<=0)throw new Error('Der Vorgang ist bereits fertig');
  const reductionMs=Math.min(remainingMs,requested*3600000);
  const cost=requested*COIN_TIME_REDUCTION.coinsPerHour;
  if(cost>COIN_TIME_REDUCTION.maxCoinsPerPurchase)throw new Error('Maximal 50 Coins pro Einzelkauf');
  return {hours:requested,cost,remainingMs,reductionMs,newRemainingMs:Math.max(0,remainingMs-reductionMs),coins:n(company.coins)};
}

export function reduceJobTimeWithCoins(company={},job,hours=1,{now=Date.now()}={}){
  const q=timeReductionQuote(company,job,hours,{now});
  if(n(company.coins)<q.cost)throw new Error(`Nicht genug Coins. Benoetigt: ${q.cost}, vorhanden: ${n(company.coins)}`);
  company.coins=n(company.coins)-q.cost;
  job.finishAt=Math.max(n(now),n(job.finishAt)-q.reductionMs);
  job.coinTimeReductionHours=n(job.coinTimeReductionHours)+q.hours;
  job.coinTimeReductionSpent=n(job.coinTimeReductionSpent)+q.cost;
  job.lastCoinTimeReductionAt=n(now);
  if(job.kind==='building'&&job.buildingInstanceId){
    const room=company?.buildingState?.rooms?.find(r=>r.instanceId===job.buildingInstanceId);
    if(room)room.finishAt=job.finishAt;
  }
  if(job.kind==='machine_upgrade'&&job.machineInstanceId){
    const machine=company?.buildingState?.equipment?.find(m=>m.instanceId===job.machineInstanceId);
    if(machine)machine.busyUntil=job.finishAt;
  }
  return {...q,finishAt:job.finishAt,coinsAfter:company.coins};
}

const fmtMs=ms=>{
  let mins=Math.max(0,Math.ceil(n(ms)/60000));
  const days=Math.floor(mins/1440);mins-=days*1440;
  const hours=Math.floor(mins/60),minutes=mins%60;
  return [days?`${days} T`:null,hours?`${hours} Std.`:null,`${minutes} Min.`].filter(Boolean).join(' ');
};

export function openCoinTimeReductionDialog({company,job,onDone=()=>{},parent=document.body}={}){
  if(typeof document==='undefined')return null;
  if(!company||!job)throw new Error('Betrieb oder Vorgang fehlt');
  const remaining=Math.max(0,n(job.finishAt)-Date.now());
  if(remaining<=0)throw new Error('Der Vorgang ist bereits fertig');
  const maxSelectable=Math.max(1,Math.min(COIN_TIME_REDUCTION.maxHours,Math.ceil(remaining/3600000)));
  const overlay=document.createElement('div');
  const panel=document.createElement('div');
  Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'30000',background:'rgba(0,0,0,.72)',display:'flex',alignItems:'center',justifyContent:'center',padding:'18px'});
  Object.assign(panel.style,{width:'min(520px,94vw)',background:'#111827',color:'#f9fafb',border:'1px solid #4b5563',borderRadius:'14px',padding:'18px',fontFamily:'Arial,sans-serif',boxShadow:'0 18px 60px rgba(0,0,0,.45)'});
  panel.innerHTML=`<h2 style="margin-top:0">🪙 Zeit mit Coins verkuerzen</h2><div style="margin-bottom:10px"><b>${job.label||'Vorgang'}</b></div><div data-info style="line-height:1.6"></div>`;
  const select=document.createElement('select');
  Object.assign(select.style,{width:'100%',padding:'10px',margin:'12px 0',borderRadius:'8px',background:'#1f2937',color:'#fff',border:'1px solid #6b7280'});
  for(let h=1;h<=maxSelectable;h++){const o=document.createElement('option');o.value=String(h);o.textContent=`${h} Stunde${h===1?'':'n'} – ${h*COIN_TIME_REDUCTION.coinsPerHour} Coins`;select.append(o);}
  panel.append(select);
  const actions=document.createElement('div');Object.assign(actions.style,{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'8px'});
  const cancel=document.createElement('button');cancel.textContent='Abbrechen';
  const buy=document.createElement('button');
  for(const b of [cancel,buy])Object.assign(b.style,{padding:'9px 13px',border:'0',borderRadius:'8px',fontWeight:'700',cursor:'pointer'});
  cancel.onclick=()=>overlay.remove();
  const refresh=()=>{const q=timeReductionQuote(company,job,Number(select.value),{now:Date.now()});const info=panel.querySelector('[data-info]');info.innerHTML=`Restzeit vorher: <b>${fmtMs(q.remainingMs)}</b><br>Verkuerzung: <b>bis zu ${q.hours} Std.</b><br>Neue Restzeit: <b>${fmtMs(q.newRemainingMs)}</b><br>Kosten: <b>${q.cost} Coins</b><br>Coin-Guthaben: <b>${q.coins}</b>`;buy.textContent=`${q.cost} Coins einsetzen`;buy.disabled=q.coins<q.cost;buy.style.opacity=buy.disabled?'.55':'1';};
  select.onchange=refresh;
  buy.onclick=()=>{try{const q=timeReductionQuote(company,job,Number(select.value),{now:Date.now()});if(!confirm(`${q.cost} Coins einsetzen und die Restzeit um bis zu ${q.hours} Stunde${q.hours===1?'':'n'} verkuerzen?`))return;const result=reduceJobTimeWithCoins(company,job,q.hours,{now:Date.now()});overlay.remove();if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('world:game-state-dirty'));onDone(result);}catch(e){alert(e.message);refresh();}};
  actions.append(cancel,buy);panel.append(actions);overlay.append(panel);parent.append(overlay);refresh();return overlay;
}

export function runConstructionPremiumCoinTest(){
  const now=1000000,standard={premiumUntil:0},premiumAccount={premiumUntil:now+86400000};
  const company={coins:100,constructionSite:{jobs:[1,2,3].map(i=>({id:i,status:'building',finishAt:now+20*3600000}))}};
  if(constructionSlotState(company,standard,now).limit!==3||constructionSlotState(company,standard,now).allowed)throw new Error('Standard-Baulimit fehlerhaft');
  if(constructionSlotState(company,premiumAccount,now).limit!==5||!constructionSlotState(company,premiumAccount,now).allowed)throw new Error('Premium-Baulimit fehlerhaft');
  const job=company.constructionSite.jobs[0],before=job.finishAt,r=reduceJobTimeWithCoins(company,job,10,{now});
  if(r.cost!==50||company.coins!==50||job.finishAt!==before-10*3600000)throw new Error('Coin-Zeitverkuerzung fehlerhaft');
  return true;
}

if(typeof window!=='undefined')window.worldConstructionPremiumCoin={config:COIN_TIME_REDUCTION,slotState:constructionSlotState,assertCanStart:assertCanStartConstruction,quote:timeReductionQuote,reduce:reduceJobTimeWithCoins,openDialog:openCoinTimeReductionDialog,runTest:runConstructionPremiumCoinTest};
