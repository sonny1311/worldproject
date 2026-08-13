// WorldProject – gezielte Prüfung für Reload/F5-relevante Betriebsdaten.
import { SupabaseGameStateSync } from './SupabaseGameStateSync.js';
const clone=v=>JSON.parse(JSON.stringify(v));
export function persistenceReloadHealth(company){
 const sync=Object.create(SupabaseGameStateSync.prototype),previous=window.worldPlayerCompany;window.worldPlayerCompany=company;
 try{
  const snapshot=sync.snapshot()||{},checks=[];
  const want=[
   ['money',Number(company.money||0),Number(snapshot.money||0)],
   ['inventory',company.inventory||{},snapshot.inventory||{}],
   ['finishedGoods',company.finishedGoods||{},snapshot.finishedGoods||{}],
   ['operationalSupplyState',company.operationalSupplyState||{},snapshot.operationalSupplyState||{}],
   ['workforceState',company.workforceState||{},snapshot.workforceState||{}],
   ['productionJobs',company.productionJobs||[],snapshot.productionJobs||[]],
   ['vehicles',company.vehicles||[],snapshot.vehicles||[]],
   ['customerOrders',company.customerOrders||[],snapshot.customerOrders||[]]
  ];
  for(const [name,a,b] of want)checks.push({name,success:JSON.stringify(clone(a))===JSON.stringify(clone(b))});
  const failed=checks.filter(x=>!x.success);return{success:failed.length===0,checks,failed,snapshot};
 }finally{window.worldPlayerCompany=previous;}
}
if(typeof window!=='undefined')window.persistenceReloadHealth=persistenceReloadHealth;
