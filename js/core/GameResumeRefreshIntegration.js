// WorldProject - aktualisiert zeitbasierte Systeme sofort, wenn der Spieler zum Spiel zurueckkehrt.
// Browser-/App-Timer koennen im Hintergrund gedrosselt werden; beim Fokus wird deshalb aktiv nachgezogen.
import { runOperationalConsistency } from './OperationalConsistencyGuard.js';
import { processMachineMaintenance } from './MachineMaintenanceSystem.js';
import { processUrgentOrders } from './UrgentCustomerOrderSystem.js';
import { processArrivedMarketGoods } from './PlayerMarketGoodsDelivery.js';

let lastRun=0;
export function refreshTimedSystemsOnResume({force=false,now=Date.now()}={}){
 if(typeof window==='undefined')return false;if(!force&&now-lastRun<1000)return false;lastRun=now;
 try{window.worldTimedBusinessUpgrades?.process?.();}catch(error){console.warn('Ausbau-Refresh nach Rueckkehr fehlgeschlagen',error);}
 try{window.worldRewardedAdUI?.refresh?.();}catch(error){console.warn('Werbe-Refresh nach Rueckkehr fehlgeschlagen',error);}
 try{window.worldLiveTraffic?.refresh?.();}catch(error){console.warn('Verkehrs-Refresh nach Rueckkehr fehlgeschlagen',error);}
 try{const company=window.worldPlayerCompany;if(company){processMachineMaintenance(company,now);processUrgentOrders(company,now);processArrivedMarketGoods(company,now);runOperationalConsistency(company,now);}}catch(error){console.warn('Betriebs-Konsistenz nach Rueckkehr fehlgeschlagen',error);}
 window.dispatchEvent(new CustomEvent('world:runtime-resumed',{detail:{at:now}}));
 return true;
}
export function installGameResumeRefresh(){if(typeof window==='undefined'||window.__worldResumeRefreshInstalled)return false;window.__worldResumeRefreshInstalled=true;window.addEventListener('focus',()=>refreshTimedSystemsOnResume({force:true}));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshTimedSystemsOnResume({force:true});});window.addEventListener('pageshow',()=>refreshTimedSystemsOnResume({force:true}));return true;}
export function runGameResumeRefreshTest(){const before=lastRun;const result=refreshTimedSystemsOnResume({force:true,now:before+2000||2000});return result===true;}
if(typeof window!=='undefined'){window.worldGameResumeRefresh={refresh:refreshTimedSystemsOnResume,install:installGameResumeRefresh,runTest:runGameResumeRefreshTest};installGameResumeRefresh();}
