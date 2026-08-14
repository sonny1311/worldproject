// WorldProject - stellt gespeicherte Kundenauftraege im aktiven Runtime-Betrieb wieder her.
// Greift auch beim normalen Erststart auf den Account-Overview-Datensatz des aktiven Betriebs zu.
function clone(value){try{return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}catch{return value;}}
function findServerCompany(runtime){
 const direct=window.worldActiveServerCompany;
 if(direct?.game_state)return direct;
 const overview=window.worldServerAccountOverview;
 const companies=overview?.companies||[];
 const id=runtime?.serverCompanyId;
 if(id!==undefined&&id!==null){const match=companies.find(c=>String(c?.id)===String(id));if(match)return match;}
 if(companies.length===1)return companies[0];
 return overview?.company||null;
}
function hydrate(){
 const runtime=window.worldPlayerCompany;
 if(!runtime)return false;
 if(Array.isArray(runtime.customerOrders)&&runtime.customerOrders.length>0)return false;
 const server=findServerCompany(runtime),stored=server?.game_state?.customerOrders;
 if(!Array.isArray(stored)||stored.length===0)return false;
 runtime.customerOrders=clone(stored);
 console.warn('♻️ KUNDENAUFTRAEGE AUS SERVER-SPIELSTAND WIEDERHERGESTELLT',{count:runtime.customerOrders.length,companyId:runtime.serverCompanyId??server?.id});
 window.worldHomeOperationsDashboard?.render?.();
 window.dispatchEvent(new CustomEvent('world:customer-order-updated',{detail:{reason:'runtime-hydration',count:runtime.customerOrders.length}}));
 return true;
}
function schedule(){setTimeout(hydrate,0);setTimeout(hydrate,300);setTimeout(hydrate,1200);setTimeout(hydrate,3000);}
for(const ev of ['worldproject:company-loaded','worldproject:company-switched','worldproject:company-activated','world:access-granted','world:user-login'])window.addEventListener(ev,schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
if(typeof window!=='undefined')window.worldCustomerOrderRuntimeHydration={hydrate,findServerCompany};
