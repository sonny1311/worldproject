// WorldProject - vereinheitlicht Kundenauftrags-Produktfelder mit dem operativen Fertigwarenlager.
// Alte/erweiterte Auftraege koennen sowohl product als auch productId enthalten. Fuer Lieferung ist productId kanonisch.
const currentCompany=()=>window.worldPlayerCompany||window.worldActiveServerCompany||window.worldEngine?.company||null;
function normalize(company=currentCompany()){
 if(!company)return 0;let changed=0;
 for(const o of company.customerOrders||[]){
  const canonical=o?.productId||o?.product||o?.itemId||o?.outputId;
  if(!canonical)continue;
  if(o.productId!==canonical){o.productId=canonical;changed++;}
 }
 return changed;
}
function run(){const changed=normalize();if(changed){window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'customer-order-product-id-normalized',changed}}));window.worldHomeOperationsDashboard?.render?.();}}
for(const ev of ['worldproject:company-loaded','worldproject:company-switched','worldproject:company-activated'])window.addEventListener(ev,()=>setTimeout(run,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,800),{once:true});else setTimeout(run,800);
if(typeof window!=='undefined')window.worldCustomerOrderProductIdCompatibility={normalize};
