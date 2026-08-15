// ORVUNO – verfügbarer Fertigwarenbestand direkt in der oberen Kennzahlenleiste.
import { EconomyDashboard } from './EconomyDashboard.js';
import { worldContentRegistry } from './ContentRegistry.js';
import { canonicalMaterialId } from './OperationalInventoryBridge.js';
import { normalizeOperationalFinishedStock, normalizeFinishedQuantity } from './UnifiedOperationalStockBridge.js';

export function finishedGoodsSummary(company={}){
  normalizeOperationalFinishedStock(company);
  const finished=company?.operationalSupplyState?.warehouseStock?.finished||{};
  const grouped=new Map();
  for(const [product,raw] of Object.entries(finished)){
    const canonical=canonicalMaterialId(product),amount=normalizeFinishedQuantity(canonical,raw);
    if(amount<=0)continue;
    grouped.set(canonical,Math.max(grouped.get(canonical)||0,amount));
  }
  const rows=[...grouped].map(([product,amount])=>({product,amount}));
  const total=rows.reduce((sum,row)=>sum+row.amount,0);
  return {total,rows};
}

function productLabel(id){const record=worldContentRegistry.get('products',id)||worldContentRegistry.get('materials',id);return record?.label||record?.name||String(id||'Produkt').replace(/_/g,' ');}
function addFinishedGoodsCard(dashboard,panel){if(!panel?.querySelectorAll)return false;const existing=[...panel.querySelectorAll('div')].find(el=>el.firstElementChild?.textContent?.trim()==='📦 Fertigwaren');if(existing)return true;const summary=[...panel.querySelectorAll('div')].find(el=>{const titles=[...el.children].map(child=>child.firstElementChild?.textContent?.trim());return titles.includes('🪙 Coins')&&titles.includes('🏬 Lager')&&titles.includes('📈 Wochengewinn');});if(!summary)return false;const stock=finishedGoodsSummary(dashboard.company),card=dashboard.card('📦 Fertigwaren');card.append(dashboard.el('div',`${stock.total.toLocaleString('de-DE',{maximumFractionDigits:0})} verfügbar`));card.title=stock.rows.length?stock.rows.map(row=>`${productLabel(row.product)}: ${row.amount.toLocaleString('de-DE',{maximumFractionDigits:0})}`).join('\n'):'Noch keine fertiggestellten Produkte im Lager';summary.append(card);return true;}
const proto=EconomyDashboard.prototype;
if(!proto.__worldFinishedGoodsSummaryIntegrated){Object.defineProperty(proto,'__worldFinishedGoodsSummaryIntegrated',{value:true});const originalRender=proto.render;proto.render=function(panel,...args){const result=originalRender.call(this,panel,...args);addFinishedGoodsCard(this,panel);return result;};}
export function runDashboardFinishedGoodsSummaryTest(){const company={operationalSupplyState:{warehouseStock:{finished:{lager033_bottle:99.84,beer_lager_033:99.84,beer_pils_033:30.7}}},finishedGoods:{}};const result=finishedGoodsSummary(company);if(result.total!==129||result.rows.length!==2||result.rows.find(x=>x.product==='beer_lager_033')?.amount!==99)throw new Error('Fertigwaren-Zusammenfassung muss kanonische ganze Stückzahlen verwenden');return true;}
if(typeof window!=='undefined')window.runDashboardFinishedGoodsSummaryTest=runDashboardFinishedGoodsSummaryTest;
