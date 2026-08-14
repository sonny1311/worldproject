// WorldProject - stellt gespeicherte Kundenauftraege im aktiven Runtime-Betrieb wieder her.
// Nur wenn die Runtime-Liste leer ist und der aktive Serverbetrieb im game_state Auftraege besitzt.
function clone(value){try{return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}catch{return value;}}
function hydrate(){
 const runtime=window.worldPlayerCompany;
 const server=window.worldActiveServerCompany;
 const stored=server?.game_state?.customerOrders;
 if(!runtime||!Array.isArray(stored)||stored.length===0)return false;
 if(Array.isArray(runtime.customerOrders)&&runtime.customerOrders.length>0)return false;
 runtime.customerOrders=clone(stored);
 console.warn('♻️ KUNDENAUFTRAEGE AUS SERVER-SPIELSTAND WIEDERHERGESTELLT',{count:runtime.customerOrders.length});
 window.worldHomeOperationsDashboard?.render?.();
 window.dispatchEvent(new CustomEvent('world:customer-order-updated',{detail:{reason:'runtime-hydration',count:runtime.customerOrders.length}}));
 return true;
}
function schedule(){setTimeout(hydrate,0);setTimeout(hydrate,300);setTimeout(hydrate,1200);}
for(const ev of ['worldproject:company-loaded','worldproject:company-switched','worldproject:company-activated','world:access-granted'])window.addEventListener(ev,schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
if(typeof window!=='undefined')window.worldCustomerOrderRuntimeHydration={hydrate};
