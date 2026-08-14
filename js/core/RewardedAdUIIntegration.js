// WorldProject - kompakte Rewarded-Ad-Oberflaeche.
// Startseite: nur der 10er-Tagesblock.
// Zeitwerbung: erscheint nur, wenn mindestens ein geeigneter Vorgang wirklich laeuft.
// Jede laufende Produktion, Lieferung/LKW-Fahrt oder Ausbau-/Bauarbeit hat ein eigenes 0/5-Limit.
import { RewardedAdSystem } from './RewardedAdSystem.js';
import { activeOperationsSummary } from './ActiveOperationsOverview.js';

const ads=new RewardedAdSystem();
const eligibleKinds=new Set(['production','delivery','construction','land','warehouse_expansion','machine_upgrade','business_upgrade']);
const company=()=>window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null;
const mins=ms=>{let m=Math.max(0,Math.ceil(Number(ms||0)/60000));return m>=1440?`${Math.floor(m/1440)} T ${Math.ceil((m%1440)/60)} Std.`:m>=60?`${Math.floor(m/60)} Std. ${m%60} Min.`:`${m} Min.`;};

async function showProviderAd({placement,kind=null,job=null}={}){
 const provider=window.worldAdProvider||window.worldRewardedAdProvider;
 if(!provider?.showRewardedAd)throw new Error('Werbeanbieter ist noch nicht verbunden');
 const receipt=await provider.showRewardedAd({placement,kind,jobId:job?.id||null});
 if(!receipt?.completed)throw new Error('Werbung wurde nicht vollständig angesehen');
 return receipt;
}
function dirty(reason,detail={}){window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason,...detail}}));window.dispatchEvent(new CustomEvent('world:rewarded-ad-updated',{detail:{reason,...detail}}));}

export async function watchGeneralRewardedAd(){
 const c=company();if(!c)throw new Error('Betrieb fehlt');const receipt=await showProviderAd({placement:'home'}),result=ads.confirmGeneralAd(c,{providerReceipt:receipt,now:Date.now()});dirty('rewarded-ad-home',{state:result.state});refreshRewardedAdWidgets();return result;
}
export async function watchTimeRewardedAd(row){
 const c=company(),job=row?.raw;if(!c||!job)throw new Error('Vorgang fehlt');if(!eligibleKinds.has(row.kind))throw new Error('Für diesen Vorgang gibt es keine Zeitwerbung');const receipt=await showProviderAd({placement:`time:${row.kind}`,kind:row.kind,job}),before=ads.resolveTimer(job)?.value||0,result=ads.confirmTimeAd(c,job,{kind:row.kind,providerReceipt:receipt,now:Date.now()});
 // Lieferungen besitzen teilweise mehrere ETA-Felder. Die gekuerzte reale Ankunft muss konsistent bleiben.
 if(row.kind==='delivery'){
  const timer=ads.resolveTimer(job),after=timer?.value||0,cut=Math.max(0,before-after);if(cut>0){for(const key of ['eta','arrivalAt','trafficEta']){const v=job[key] instanceof Date?job[key].getTime():Number(job[key]);if(Number.isFinite(v)&&v>0&&key!==timer?.key)job[key]=job[key] instanceof Date?new Date(Math.max(Date.now(),v-cut)):Math.max(Date.now(),v-cut);}}
 }
 dirty('rewarded-ad-time',{kind:row.kind,jobId:job.id,reductionMs:result.reductionMs});refreshRewardedAdWidgets();window.worldActiveOperationsUI?.open?.();return result;
}

function homeWidget(){
 let el=document.querySelector('[data-world-home-ad-widget]');if(!el){el=document.createElement('button');el.dataset.worldHomeAdWidget='1';Object.assign(el.style,{position:'fixed',right:'16px',top:'86px',zIndex:'43000',padding:'7px 10px',borderRadius:'10px',border:'1px solid #475569',background:'#111827',color:'#fff',fontWeight:'800',fontSize:'12px',cursor:'pointer',boxShadow:'0 5px 14px rgba(0,0,0,.25)',maxWidth:'190px'});document.body.append(el);el.onclick=async()=>{try{await watchGeneralRewardedAd();}catch(error){alert(error.message);}};}return el;
}
function timeWidget(){
 let el=document.querySelector('[data-world-time-ad-widget]');if(!el){el=document.createElement('button');el.dataset.worldTimeAdWidget='1';Object.assign(el.style,{position:'fixed',right:'16px',top:'128px',zIndex:'43000',padding:'7px 10px',borderRadius:'10px',border:'1px solid #475569',background:'#0f172a',color:'#fff',fontWeight:'800',fontSize:'12px',cursor:'pointer',boxShadow:'0 5px 14px rgba(0,0,0,.25)',maxWidth:'210px'});document.body.append(el);el.onclick=()=>window.worldActiveOperationsUI?.open?.();}return el;
}

export function appendTimeAdControl(rowElement,row){
 if(!rowElement||!row?.raw||!eligibleKinds.has(row.kind))return null;const timer=ads.resolveTimer(row.raw),remaining=timer?Math.max(0,timer.value-Date.now()):0;if(!timer||remaining<=0)return null;const state=ads.timeAdState(row.raw),wrap=document.createElement('div');Object.assign(wrap.style,{display:'flex',alignItems:'center',gap:'7px',marginTop:'7px',fontSize:'11px'});const info=document.createElement('span');info.textContent=`🎬 ${state.watched}/5 · je −0,5 % Restzeit`;Object.assign(info.style,{opacity:'.78'});const b=document.createElement('button');b.type='button';b.textContent=state.complete?'5/5 genutzt':'Werbung ansehen';b.disabled=state.complete;Object.assign(b.style,{border:'1px solid #94a3b8',borderRadius:'7px',padding:'4px 7px',fontSize:'11px',fontWeight:'700',cursor:b.disabled?'default':'pointer',background:b.disabled?'#e5e7eb':'#f8fafc',color:'#111827'});b.onclick=async e=>{e.stopPropagation();try{const result=await watchTimeRewardedAd(row);alert(`Zeitverkürzung: ${mins(result.reductionMs)}`);}catch(error){alert(error.message);}};wrap.append(info,b);rowElement.append(wrap);return wrap;
}

export function refreshRewardedAdWidgets(){
 if(typeof document==='undefined')return;const c=company();if(!c)return;const general=ads.generalState(c),home=homeWidget();home.textContent=general.complete?'🎬 Werbung heute 10/10':`🎬 Werbung ${general.watched}/10`;home.disabled=general.complete;home.style.opacity=general.complete?'.65':'1';
 const summary=activeOperationsSummary(c),eligible=summary.rows.filter(r=>eligibleKinds.has(r.kind)&&ads.resolveTimer(r.raw)&&!ads.timeAdState(r.raw).complete);const tw=timeWidget();tw.style.display=eligible.length?'block':'none';if(eligible.length)tw.textContent=`🎬 Zeit sparen · ${eligible.length} Vorgang${eligible.length===1?'':'e'}`;
}

export function runRewardedAdUIIntegrationTest(){const c={productionJobs:[{id:'p',status:'running',startedAt:1,finishAt:999999}]};const s=activeOperationsSummary(c,10);return s.rows.some(r=>r.kind==='production'&&eligibleKinds.has(r.kind));}

if(typeof window!=='undefined'){
 window.worldRewardedAdUI={refresh:refreshRewardedAdWidgets,appendTimeControl:appendTimeAdControl,watchGeneral:watchGeneralRewardedAd,watchTime:watchTimeRewardedAd,runTest:runRewardedAdUIIntegrationTest};
 const boot=()=>{refreshRewardedAdWidgets();setInterval(refreshRewardedAdWidgets,15000);};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
 for(const event of ['world:game-state-dirty','worldproject:company-switched','world:business-upgrade-started','world:business-upgrade-completed'])window.addEventListener(event,refreshRewardedAdWidgets);
}
