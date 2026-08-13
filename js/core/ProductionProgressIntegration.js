// WorldProject – sichtbarer Live-Fortschritt fuer laufende Produktionen.
import { EconomyDashboard } from './EconomyDashboard.js';
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

function timestamp(value){
  if(value instanceof Date)return Number.isFinite(value.getTime())?value.getTime():null;
  const n=Number(value);if(Number.isFinite(n)&&n>0)return n;
  const p=Date.parse(value);return Number.isFinite(p)?p:null;
}
function progress(job,now=Date.now()){
  if(!job)return null;
  const status=String(job.status||'').toLowerCase();
  if(['finished','completed'].includes(status))return 100;
  if(!['running','paused'].includes(status))return null;
  const start=timestamp(job.startedAt||job.startAt),finish=timestamp(job.finishAt||job.completeAt||job.completedAt);
  if(!start||!finish||finish<=start)return 0;
  return Math.max(0,Math.min(100,Math.floor(((now-start)/(finish-start))*100)));
}
function label(job){const p=progress(job);return p===null?'':` · ${p} %`;}

const dashProto=EconomyDashboard.prototype;
if(!dashProto.__worldProductionProgressIntegrated){
  dashProto.__worldProductionProgressIntegrated=true;
  dashProto.productionProgress=progress;
  const originalOpen=dashProto.open;
  dashProto.open=function(...args){
    const result=originalOpen.apply(this,args);
    clearInterval(this.productionProgressTimer);
    this.productionProgressTimer=setInterval(()=>{
      if(!this.overlay?.isConnected)return;
      const jobs=this.operationsOverview?.activeProduction?.()||[];
      for(const el of this.overlay.querySelectorAll('[data-production-progress-id]')){
        const job=jobs.find(j=>String(j.id)===el.dataset.productionProgressId);
        if(job)el.textContent=label(job);
      }
    },2000);
    return result;
  };
  const originalClose=dashProto.close;
  dashProto.close=function(...args){clearInterval(this.productionProgressTimer);this.productionProgressTimer=null;return originalClose.apply(this,args);};

  const originalRender=dashProto.render;
  dashProto.render=function(panel){
    const result=originalRender.call(this,panel);
    const jobs=this.operationsOverview?.activeProduction?.()||[];
    const productionCard=panel.querySelector('#dashboard-production');
    if(productionCard){
      const rows=[...productionCard.querySelectorAll('div')].filter(el=>!el.children.length);
      for(const job of jobs){
        if(!['running','paused'].includes(String(job.status||'').toLowerCase()))continue;
        const product=job.recipe?.label||this.label(job.productId||job.product||job.recipeId);
        const row=rows.find(el=>el.textContent?.startsWith(`${product} ·`));
        if(!row||row.querySelector?.('[data-production-progress-id]'))continue;
        const span=document.createElement('strong');span.dataset.productionProgressId=String(job.id);span.textContent=label(job);span.style.marginLeft='3px';row.append(span);
      }
    }
    return result;
  };
}

const opProto=OperationalSupplyChainDialog.prototype;
if(!opProto.__worldProductionProgressIntegrated){
  opProto.__worldProductionProgressIntegrated=true;
  const originalRenderQueue=opProto.renderQueue;
  opProto.renderQueue=function(panel,company,recipes){
    const result=originalRenderQueue.call(this,panel,company,recipes);
    const sections=[...panel.querySelectorAll('section')],queue=sections.find(s=>s.querySelector('h3')?.textContent?.startsWith('Produktionswarteschlange'));
    if(queue){
      const rows=[...queue.children].filter(el=>el.tagName==='DIV');
      for(const job of this.planner.queue||[]){
        if(!['running','paused'].includes(String(job.status||'').toLowerCase()))continue;
        const row=rows.find(el=>el.textContent?.startsWith(`#${job.id} ·`));if(!row)continue;
        const p=progress(job),badge=this.el('strong',` · Fortschritt ${p??0} %`);badge.dataset.productionProgressId=String(job.id);badge.style.marginLeft='8px';row.append(badge);
      }
    }
    return result;
  };
  const originalOpen=opProto.open;
  opProto.open=async function(...args){
    const result=await originalOpen.apply(this,args);clearInterval(this.productionProgressUiTimer);
    this.productionProgressUiTimer=setInterval(()=>{
      if(!this.overlay?.isConnected)return;
      for(const el of this.overlay.querySelectorAll('[data-production-progress-id]')){
        const job=this.planner.queue.find(j=>String(j.id)===el.dataset.productionProgressId);if(!job)continue;
        const p=progress(job);el.textContent=el.textContent.includes('Fortschritt')?` · Fortschritt ${p??0} %`:label(job);
      }
    },2000);
    return result;
  };
  const originalClose=opProto.close;
  opProto.close=function(...args){clearInterval(this.productionProgressUiTimer);this.productionProgressUiTimer=null;return originalClose.apply(this,args);};
}

export { progress as productionProgressPercent };
