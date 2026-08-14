// WorldProject - vereinheitlicht Kundenauftrags-Produktfelder mit dem operativen Fertigwarenlager.
// Alte Auftraege verwenden teils Legacy-IDs wie lager033_bottle, waehrend das operative Lager beer_lager_033 nutzt.
const currentCompany=()=>window.worldPlayerCompany||window.worldActiveServerCompany||window.worldEngine?.company||null;
const LEGACY_TO_OPERATIONAL={
 lager033_bottle:'beer_lager_033',
 lager033:'beer_lager_033',
 'lager033 bottle':'beer_lager_033',
 pils033_bottle:'beer_pils_033',
 pils033:'beer_pils_033',
 'pils033 bottle':'beer_pils_033',
 lager050_bottle:'beer_lager_050',
 pils050_bottle:'beer_pils_050'
};
function resolveCanonical(company,order){
 const raw=order?.productId||order?.product||order?.itemId||order?.outputId;
 if(!raw)return'';
 const mapped=LEGACY_TO_OPERATIONAL[raw]||raw;
 const finished=company?.operationalSupplyState?.warehouseStock?.finished||{};
 if(Object.prototype.hasOwnProperty.call(finished,mapped))return mapped;
 if(Object.prototype.hasOwnProperty.call(finished,raw))return raw;
 return mapped;
}
function normalize(company=currentCompany()){
 if(!company)return 0;let changed=0;
 for(const o of company.customerOrders||[]){
  const canonical=resolveCanonical(company,o);if(!canonical)continue;
  if(o.productId!==canonical){o.productId=canonical;changed++;}
  if(o.product!==canonical){o.product=canonical;changed++;}
 }
 return changed;
}
function run(){const changed=normalize();if(changed){console.log('🔁 KUNDENAUFTRAGS-PRODUKT-ID MIGRIERT',{changed});window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'customer-order-product-id-normalized',changed}}));window.worldHomeOperationsDashboard?.render?.();}}
for(const ev of ['worldproject:company-loaded','worldproject:company-switched','worldproject:company-activated','world:customer-order-updated'])window.addEventListener(ev,()=>setTimeout(run,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,1200),{once:true});else setTimeout(run,1200);
if(typeof window!=='undefined')window.worldCustomerOrderProductIdCompatibility={normalize,resolveCanonical};
