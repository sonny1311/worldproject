// ORVUNO – klare Aktionsbezeichnungen: Brauen/Produzieren und Abfüllen werden sprachlich getrennt.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const proto=OperationalSupplyChainDialog.prototype;
const normalize=(value='')=>String(value).replace(/\s+/g,' ').trim();

function applyActionLabels(row,recipe){
 if(!row||!recipe)return;
 const isBottling=recipe.productionStage==='bottling'&&Number(recipe.bottleSizeLiters||0)>0;
 const buttons=[...row.querySelectorAll('button')];
 const start=buttons.find(b=>b.classList.contains('world-start-now')||/Jetzt produzieren|Jetzt abfüllen/.test(normalize(b.textContent)));
 if(start)start.textContent=isBottling?'▶ Jetzt abfüllen':'▶ Jetzt produzieren';
 const plan=buttons.find(b=>/Abfüllung einplanen|Abfüllung planen|Produktion einplanen|^Einplanen$|Produktion planen/.test(normalize(b.textContent)));
 if(plan)plan.textContent=isBottling?'Abfüllung planen':'Produktion planen';
}

if(!proto.__orvunoProductionActionLabels){
 proto.__orvunoProductionActionLabels=true;
 const originalCard=proto.renderProductionCard;
 proto.renderProductionCard=function(parent,recipe,company,recipes,panel){
  const result=originalCard.call(this,parent,recipe,company,recipes,panel);
  applyActionLabels(parent?.lastElementChild,recipe);
  return result;
 };
 const originalQueue=proto.renderQueue;
 proto.renderQueue=function(panel,company,recipes){
  const result=originalQueue.call(this,panel,company,recipes);
  const jobs=this.planner?.queue||[];
  const queue=[...panel.querySelectorAll('section')].find(s=>s.querySelector(':scope > h3')?.textContent?.startsWith('Produktionswarteschlange'));
  if(queue){
   const rows=[...queue.children].filter(x=>x.tagName==='DIV');
   for(const job of jobs){
    if(String(job?.status||'').toLowerCase()!=='queued')continue;
    const row=rows.find(x=>normalize(x.textContent).startsWith(`#${job.id} ·`));if(!row)continue;
    const first=[...row.querySelectorAll('button')][0];
    if(first)first.textContent=job.recipe?.productionStage==='bottling'?'Jetzt abfüllen':'Jetzt produzieren';
   }
  }
  return result;
 };
}

export function runProductionActionLabelTest(){return proto.__orvunoProductionActionLabels===true;}
