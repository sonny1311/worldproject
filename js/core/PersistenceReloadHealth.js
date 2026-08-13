// WorldProject – gezielte Prüfung für Reload/F5-relevante Betriebsdaten.
import { SupabaseGameStateSync } from './SupabaseGameStateSync.js';
import { BusinessPortfolioSystem } from './BusinessPortfolioSystem.js';

const clone=v=>JSON.parse(JSON.stringify(v));
const equal=(a,b)=>JSON.stringify(clone(a))===JSON.stringify(clone(b));

export function persistenceReloadHealth(company){
 const sync=Object.create(SupabaseGameStateSync.prototype),previous=window.worldPlayerCompany;window.worldPlayerCompany=company;
 try{
  const snapshot=sync.snapshot()||{},checks=[];
  const serverCompany={
   id:company.serverCompanyId||'reload-test-company',
   slot_no:company.slotNo||1,
   name:company.name||'Reload Test',
   industry:company.industry||'brewery',
   company_type:company.type||'brewery',
   money:snapshot.money,
   game_state:clone(snapshot),
   building_state:clone(company.buildingState||{}),
   setup_phase:company.setupPhase||'operational'
  };
  const restored={};
  new BusinessPortfolioSystem().hydrateCompany(restored,serverCompany,{balance:Number(company.coins||0)});
  const want=[
   ['money',Number(snapshot.money||0),Number(restored.money||0)],
   ['inventory',snapshot.inventory||{},restored.inventory||{}],
   ['finishedGoods',snapshot.finishedGoods||{},restored.finishedGoods||{}],
   ['operationalSupplyState',snapshot.operationalSupplyState||{},restored.operationalSupplyState||{}],
   ['workforceState',snapshot.workforceState||{},restored.workforceState||{}],
   ['productionJobs',snapshot.productionJobs||[],restored.productionJobs||[]],
   ['vehicles',snapshot.vehicles||[],restored.vehicles||[]],
   ['customerOrders',snapshot.customerOrders||[],restored.customerOrders||[]],
   ['supplierOrders',snapshot.supplierOrders||[],restored.supplierOrders||[]],
   ['buildingState',serverCompany.building_state||{},restored.buildingState||{}]
  ];
  for(const [name,a,b] of want)checks.push({name,success:equal(a,b)});
  const sharedOrders=company.operationalSupplyState?.orders;
  if(Array.isArray(sharedOrders)&&company.operationsState?.supplyOrders===sharedOrders){
   checks.push({name:'sharedSupplyOrdersSerialized',success:equal(snapshot.operationalSupplyState?.orders||[],snapshot.operationsState?.supplyOrders||[])});
  }
  const failed=checks.filter(x=>!x.success);return{success:failed.length===0,checks,failed,snapshot,restored};
 }finally{window.worldPlayerCompany=previous;}
}
if(typeof window!=='undefined')window.persistenceReloadHealth=persistenceReloadHealth;
