// WorldProject – verständlicher Produktionsstatus ohne neue Produktionslogik.
// Dekoriert ausschließlich die bestehende OperationalSupplyChainDialog-Warteschlange.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

function timestamp(value){
  if(value instanceof Date)return Number.isFinite(value.getTime())?value.getTime():null;
  const n=Number(value);if(Number.isFinite(n)&&n>0)return n;
  const p=Date.parse(value);return Number.isFinite(p)&&p>0?p:null;
}
function duration(ms){
  const total=Math.max(0,Math.ceil(Number(ms||0)/1000));
  if(total<=0)return 'weniger als 1 Min.';
  const d=Math.floor(total/86400),h=Math.floor((total%86400)/3600),m=Math.floor((total%3600)/60),s=total%60;
  if(d)return `${d} T ${h} Std`;
  if(h)return `${h} Std ${m} Min`;
  if(m)return `${m} Min ${s} Sek`;
  return `${s} Sek`;
}
function percent(job,now=Date.now()){
  if(job?.storageBlocked)return 100;
  const status=String(job?.status||'').toLowerCase();
  if(status==='finished'||status==='completed')return 100;
  if(!['running','paused'].includes(status))return 0;
  const start=timestamp(job.startedAt||job.startAt),finish=timestamp(job.finishAt||job.completeAt);
  if(!start||!finish||finish<=start)return 0;
  return Math.max(0,Math.min(100,Math.floor((now-start)/(finish-start)*100)));
}
function currentPlan(dialog,job){
  try{return dialog?.planner?.plan?.(job.recipe,job.plan?.batches||1)||null;}catch{return null;}
}
function missingLabels(dialog,plan){
  return Object.entries(plan?.missing||{}).filter(([,q])=>Number(q)>1e-9).map(([id,q])=>{
    const meta=dialog.materialMeta?.(id)||{label:id,unit:'Einheit'};
    return `${meta.label}: ${dialog.number?.(q)??q} ${meta.unit||''}`.trim();
  });
}
function describe(dialog,company,job,now=Date.now()){
  const status=String(job?.status||'').toLowerCase();
  if(job?.storageBlocked){
    return {tone:'blocked',title:'🔴 Produktion fertig – Lagerplatz fehlt',detail:job.storageError||'Die fertige Ware kann noch nicht eingelagert werden. Schaffe Lagerplatz; danach wird die Einlagerung automatisch erneut versucht.',progress:100};
  }
  if(status==='running'){
    const finish=timestamp(job.finishAt),left=finish?Math.max(0,finish-now):0,p=percent(job,now);
    return {tone:'running',title:`🟢 Produktion läuft · ${p} %`,detail:`Voraussichtlich fertig in ${duration(left)}. Danach wird die Ware automatisch eingelagert.`,progress:p};
  }
  if(status==='paused')return {tone:'paused',title:`🟠 Produktion pausiert · ${percent(job,now)} %`,detail:'Die Charge ist angehalten. Mit „Fortsetzen“ läuft sie weiter.',progress:percent(job,now)};
  if(status==='queued'){
    const plan=currentPlan(dialog,job),reasons=[];
    const missing=missingLabels(dialog,plan);if(missing.length)reasons.push(`Material fehlt: ${missing.join(', ')}`);
    if(plan?.machineConditionBlocked)reasons.push(`Maschinenzustand kritisch (${Math.round(Number(plan.machineCondition||0))} %) – Wartung erforderlich`);else if(plan&&!plan.machineAvailable)reasons.push('benötigte Maschine ist nicht frei oder nicht betriebsbereit');
    if(dialog.staffingAllows&&!dialog.staffingAllows(company,job.recipe))reasons.push('benötigte Fachkraft fehlt');
    return reasons.length
      ?{tone:'waiting',title:'🟡 Eingeplant – wartet auf Voraussetzung',detail:reasons.join(' · '),progress:0}
      :{tone:'queued',title:'🟡 Eingeplant – startbereit',detail:'Die Charge startet automatisch, sobald keine andere Produktion den Start blockiert.',progress:0};
  }
  return {tone:'neutral',title:`Status: ${status||'unbekannt'}`,detail:'',progress:percent(job,now)};
}
function decorate(dialog,row,company,job,now=Date.now()){
  let box=row.querySelector('[data-production-clarity]');
  if(!box){
    box=document.createElement('div');box.dataset.productionClarity='1';box.dataset.productionClarityId=String(job.id);
    Object.assign(box.style,{marginTop:'9px',padding:'9px 10px',borderRadius:'8px',border:'1px solid #334155',background:'#0b1220',color:'#f8fafc'});
    const title=document.createElement('div');title.dataset.productionClarityTitle='1';title.style.fontWeight='800';
    const detail=document.createElement('div');detail.dataset.productionClarityDetail='1';Object.assign(detail.style,{marginTop:'4px',fontSize:'13px',color:'#cbd5e1'});
    const track=document.createElement('div');Object.assign(track.style,{height:'8px',marginTop:'7px',background:'#1e293b',borderRadius:'999px',overflow:'hidden'});
    const fill=document.createElement('div');fill.dataset.productionClarityProgress='1';Object.assign(fill.style,{height:'100%',width:'0%',background:'currentColor',opacity:'.65',transition:'width .25s linear'});track.append(fill);box.append(title,detail,track);row.append(box);
  }
  const info=describe(dialog,company,job,now),title=box.querySelector('[data-production-clarity-title]'),detail=box.querySelector('[data-production-clarity-detail]'),fill=box.querySelector('[data-production-clarity-progress]');
  if(title)title.textContent=info.title;if(detail)detail.textContent=info.detail;if(fill)fill.style.width=`${Math.max(0,Math.min(100,info.progress||0))}%`;
  box.dataset.productionTone=info.tone;return box;
}
function refresh(dialog){
  if(!dialog?.overlay?.isConnected)return;
  const company=dialog.companyProvider?.(),jobs=dialog.planner?.queue||[];
  for(const box of dialog.overlay.querySelectorAll('[data-production-clarity-id]')){
    const job=jobs.find(j=>String(j.id)===box.dataset.productionClarityId);if(!job)continue;
    const row=box.parentElement;if(row)decorate(dialog,row,company,job,Date.now());
  }
}

const p=OperationalSupplyChainDialog.prototype;
if(!p.__worldProductionQueueClarityIntegrated){
  p.__worldProductionQueueClarityIntegrated=true;
  const oldQueue=p.renderQueue;
  p.renderQueue=function(panel,company,recipes){
    const result=oldQueue.call(this,panel,company,recipes),queue=[...panel.querySelectorAll('section')].find(s=>s.querySelector('h3')?.textContent?.startsWith('Produktionswarteschlange'));
    if(queue){const rows=[...queue.children].filter(el=>el.tagName==='DIV');for(const job of this.planner?.queue||[]){if(['finished','cancelled'].includes(String(job.status||'').toLowerCase()))continue;const row=rows.find(el=>el.textContent?.startsWith(`#${job.id} ·`));if(row)decorate(this,row,company,job);}}
    return result;
  };
  const oldOpen=p.open;
  p.open=async function(...args){const result=await oldOpen.apply(this,args);clearInterval(this.productionClarityTimer);this.productionClarityTimer=setInterval(()=>refresh(this),1000);refresh(this);return result;};
  const oldClose=p.close;
  p.close=function(...args){clearInterval(this.productionClarityTimer);this.productionClarityTimer=null;return oldClose.apply(this,args);};
}

export { describe as describeProductionQueueJob, percent as productionQueuePercent };
