// ORVUNO – bereinigt Produktions-/Abfuelloberflaeche im dunklen UI.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';
import './ProductionActionLabelIntegration.js';

const proto=OperationalSupplyChainDialog.prototype;

function important(el,prop,value){el?.style?.setProperty?.(prop,value,'important');}
function text(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim();}

function styleBottlingSelector(panel){
 const selector=panel?.querySelector?.('.world-bottling-size-selector');
 if(!selector)return false;
 important(selector,'background','#0f172a');important(selector,'color','#f8fafc');important(selector,'border-color','#334155');important(selector,'box-shadow','none');
 for(const b of selector.querySelectorAll('button')){
  important(b,'background','#1e293b');important(b,'color','#f8fafc');important(b,'border-color','#475569');
  if(b.getAttribute('aria-pressed')==='true'){important(b,'background','#1d4ed8');important(b,'border-color','#60a5fa');important(b,'color','#fff');}
 }
 const hint=selector.querySelector('.world-bottling-size-hint');if(hint){important(hint,'color','#cbd5e1');important(hint,'opacity','1');}
 return true;
}

function cleanQueue(dialog,panel){
 const queue=[...panel.querySelectorAll('section')].find(s=>text(s.querySelector(':scope > h3')).startsWith('Produktionswarteschlange'));
 if(!queue)return false;
 const hiddenStatuses=new Set(['finished','completed','cancelled','delivered','closed']);
 const active=(dialog.planner?.queue||[]).filter(j=>!hiddenStatuses.has(String(j?.status||'').toLowerCase()));
 const heading=queue.querySelector(':scope > h3');if(heading)heading.textContent=`Produktionswarteschlange (${active.length})`;
 for(const row of [...queue.children]){
  if(row.tagName!=='DIV')continue;
  const match=text(row).match(/^#([^\s·]+)/);if(!match)continue;
  const job=(dialog.planner?.queue||[]).find(j=>String(j?.id)===match[1]);
  if(job&&hiddenStatuses.has(String(job.status||'').toLowerCase()))row.remove();
 }
 if(!active.length&&!queue.querySelector('p'))queue.append(dialog.el('p','Keine Produktion eingeplant.'));
 for(const progress of queue.querySelectorAll('progress')){
  important(progress,'background','#172033');important(progress,'color','#3b82f6');important(progress,'accent-color','#3b82f6');
 }
 return true;
}

function styleQueueBars(panel){
 const id='orvuno-operational-production-cleanup-style';if(document.getElementById(id))return;
 const style=document.createElement('style');style.id=id;style.textContent=`
 .world-bottling-size-selector{background:#0f172a!important;color:#f8fafc!important;border-color:#334155!important}
 .world-bottling-size-selector button{background:#1e293b!important;color:#f8fafc!important;border-color:#475569!important}
 .world-bottling-size-selector button[aria-pressed="true"]{background:#1d4ed8!important;border-color:#60a5fa!important;color:#fff!important}
 .world-bottling-size-selector .world-bottling-size-hint{color:#cbd5e1!important}
 progress{accent-color:#3b82f6}
 progress::-webkit-progress-bar{background:#172033;border-radius:999px}
 progress::-webkit-progress-value{background:#3b82f6;border-radius:999px}
 `;document.head.append(style);
}

if(!proto.__orvunoOperationalProductionVisualCleanup){
 proto.__orvunoOperationalProductionVisualCleanup=true;
 const oldProduction=proto.renderProduction;
 proto.renderProduction=function(panel,company,recipes){const result=oldProduction.call(this,panel,company,recipes);styleBottlingSelector(panel);styleQueueBars(panel);return result;};
 const oldQueue=proto.renderQueue;
 proto.renderQueue=function(panel,company,recipes){const result=oldQueue.call(this,panel,company,recipes);cleanQueue(this,panel);styleQueueBars(panel);return result;};
}

export function runOperationalProductionVisualCleanupTest(){return proto.__orvunoOperationalProductionVisualCleanup===true;}
