// ORVUNO - vereinheitlicht Kundenauftrags-Produktfelder mit dem operativen Fertigwarenlager.
import { canonicalMaterialId } from './OperationalInventoryBridge.js';
import { operationalAmount, normalizeOperationalFinishedStock } from './UnifiedOperationalStockBridge.js';
const currentCompany=()=>window.worldPlayerCompany||window.worldActiveServerCompany||window.worldEngine?.company||null;
function resolveCanonical(company,order){const raw=order?.productId||order?.product||order?.itemId||order?.outputId;if(!raw)return'';const canonical=canonicalMaterialId(raw);normalizeOperationalFinishedStock(company);if(operationalAmount(company,canonical,{finished:true})>0)return canonical;return canonical;}
function normalize(company=currentCompany()){if(!company)return 0;normalizeOperationalFinishedStock(company);let changed=0;for(const o of company.customerOrders||[]){const canonical=resolveCanonical(company,o);if(!canonical)continue;if(o.productId!==canonical){o.productId=canonical;changed++;}if(o.product!==canonical){o.product=canonical;changed++;}}return changed;}
function run(){const changed=normalize();if(changed){console.log('🔁 KUNDENAUFTRAGS-PRODUKT-ID MIGRIERT',{changed});window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'customer-order-product-id-normalized',changed}}));window.worldHomeOperationsDashboard?.render?.();}}
for(const ev of ['worldproject:company-loaded','worldproject:company-switched','worldproject:company-activated','world:customer-order-updated','world:game-state-dirty'])window.addEventListener(ev,()=>setTimeout(run,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,1200),{once:true});else setTimeout(run,1200);
if(typeof window!=='undefined')window.worldCustomerOrderProductIdCompatibility={normalize,resolveCanonical};
