// WorldProject – verfügbarer Fertigwarenbestand direkt in der oberen Kennzahlenleiste.
// Quelle ist ausschließlich das operative Fertigwarenlager, aus dem auch Kundenaufträge beliefert werden.
import { EconomyDashboard } from './EconomyDashboard.js';
import { worldContentRegistry } from './ContentRegistry.js';

export function finishedGoodsSummary(company={}){
  const finished=company?.operationalSupplyState?.warehouseStock?.finished||{};
  const rows=Object.entries(finished)
    .map(([product,amount])=>({product,amount:Number(amount||0)}))
    .filter(row=>Number.isFinite(row.amount)&&row.amount>0);
  const total=rows.reduce((sum,row)=>sum+row.amount,0);
  return {total,rows};
}

function productLabel(id){
  const record=worldContentRegistry.get('products',id)||worldContentRegistry.get('materials',id);
  return record?.label||record?.name||String(id||'Produkt').replace(/_/g,' ');
}

function addFinishedGoodsCard(dashboard,panel){
  if(!panel?.querySelectorAll)return false;
  const existing=[...panel.querySelectorAll('div')].find(el=>el.firstElementChild?.textContent?.trim()==='📦 Fertigwaren');
  if(existing)return true;
  const summary=[...panel.querySelectorAll('div')].find(el=>{
    const titles=[...el.children].map(child=>child.firstElementChild?.textContent?.trim());
    return titles.includes('🪙 Coins')&&titles.includes('🏬 Lager')&&titles.includes('📈 Wochengewinn');
  });
  if(!summary)return false;
  const stock=finishedGoodsSummary(dashboard.company);
  const card=dashboard.card('📦 Fertigwaren');
  card.append(dashboard.el('div',`${dashboard.amount(stock.total)} verfügbar`));
  card.title=stock.rows.length
    ? stock.rows.map(row=>`${productLabel(row.product)}: ${dashboard.amount(row.amount)}`).join('\n')
    : 'Noch keine fertiggestellten Produkte im Lager';
  summary.append(card);
  return true;
}

const proto=EconomyDashboard.prototype;
if(!proto.__worldFinishedGoodsSummaryIntegrated){
  Object.defineProperty(proto,'__worldFinishedGoodsSummaryIntegrated',{value:true});
  const originalRender=proto.render;
  proto.render=function(panel,...args){
    const result=originalRender.call(this,panel,...args);
    addFinishedGoodsCard(this,panel);
    return result;
  };
}

export function runDashboardFinishedGoodsSummaryTest(){
  const result=finishedGoodsSummary({operationalSupplyState:{warehouseStock:{finished:{a:120,b:30,empty:0}}}});
  if(result.total!==150||result.rows.length!==2)throw new Error('Fertigwaren-Zusammenfassung fehlerhaft');
  return true;
}

if(typeof window!=='undefined')window.runDashboardFinishedGoodsSummaryTest=runDashboardFinishedGoodsSummaryTest;
