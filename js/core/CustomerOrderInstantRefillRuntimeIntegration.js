// ORVUNO – Kundenaufträge gehören zum laufenden Spielbetrieb und müssen
// unabhängig davon nachgefüllt werden, ob der Spieler den Wirtschaftsdialog öffnet.
import { renderHomeOperationsDashboard } from './HomeOperationsDashboardIntegration.js';

const activeCompany=()=>window.worldPlayerCompany||window.worldActiveServerCompany||window.worldEngine?.company||window.worldEconomyGameplay?.company||null;
const openCount=c=>(c?.customerOrders||[]).filter(o=>!['completed','fulfilled','delivered','cancelled','rejected','closed'].includes(String(o?.status||'').toLowerCase())).length;

let refreshing=false;
function refillCustomerOrders(){
  if(refreshing)return;
  const company=activeCompany(),game=window.worldEconomyGameplay?.game;
  if(!company||!game?.ensureCustomerOrders)return;
  const before=openCount(company);
  try{
    game.ensureCustomerOrders(company);
  }catch(error){
    console.error('❌ Kundenaufträge konnten nicht nachgefüllt werden',error);
    return;
  }
  const after=openCount(company);
  if(after>before){
    refreshing=true;
    try{
      window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'instant-customer-order-refill',before,after}}));
      renderHomeOperationsDashboard();
      console.log('✅ Kundenaufträge sofort nachgefüllt',{before,after});
    }finally{
      refreshing=false;
    }
  }
}

// Nach dem Start kurz mehrfach prüfen, weil Server-Spielstand und Gameplay-Controller
// asynchron zusammengeführt werden können. Danach dauerhaft ohne Cooldown nachfüllen.
for(const delay of [0,250,750,1500,3000])setTimeout(refillCustomerOrders,delay);
setInterval(refillCustomerOrders,2000);
window.addEventListener('world:game-state-dirty',()=>setTimeout(refillCustomerOrders,0));
window.addEventListener('worldproject:state-changed',()=>setTimeout(refillCustomerOrders,0));
window.addEventListener('world:company-switched',()=>setTimeout(refillCustomerOrders,0));

if(typeof window!=='undefined')window.worldRefillCustomerOrdersNow=refillCustomerOrders;
