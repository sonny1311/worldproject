// WorldProject – gezielte Prüfung für Reload/F5-relevante Betriebsdaten.
import { SupabaseGameStateSync } from './SupabaseGameStateSync.js';
import { BusinessPortfolioSystem } from './BusinessPortfolioSystem.js';
const clone=v=>JSON.parse(JSON.stringify(v));
const equal=(a,b)=>JSON.stringify(clone(a))===JSON.stringify(clone(b));
export function persistenceReloadHealth(company){
 const sync=Object.create(SupabaseGameStateSync.prototype),previous=window.worldPlayerCompany;window.worldPlayerCompany=company;
 try{
  const snapshot=sync.snapshot()||{},checks=[];
  const serverCompany={id:company.serverCompanyId||'reload-test-company',slot_no:company.slotNo||1,name:company.name||'Reload Test',industry:company.industry||'brewery',company_type:company.type||'brewery',money:snapshot.money,game_state:clone(snapshot),building_state:clone(company.buildingState||{}),setup_phase:company.setupPhase||'operational'};
  const restored={};new BusinessPortfolioSystem().hydrateCompany(restored,serverCompany,{balance:Number(company.coins||0)});
  const want=[
   ['money',Number(snapshot.money||0),Number(restored.money||0)],['inventory',snapshot.inventory||{},restored.inventory||{}],['finishedGoods',snapshot.finishedGoods||{},restored.finishedGoods||{}],['operationalSupplyState',snapshot.operationalSupplyState||{},restored.operationalSupplyState||{}],['workforceState',snapshot.workforceState||{},restored.workforceState||{}],
   ['productionJobs',snapshot.productionJobs||[],restored.productionJobs||[]],['productionQueue',snapshot.productionQueue||[],restored.productionQueue||[]],['vehicles',snapshot.vehicles||[],restored.vehicles||[]],['customerOrders',snapshot.customerOrders||[],restored.customerOrders||[]],['completedCustomerOrders',snapshot.completedCustomerOrders||[],restored.completedCustomerOrders||[]],['supplierOrders',snapshot.supplierOrders||[],restored.supplierOrders||[]],['marketDeliveries',snapshot.marketDeliveries||[],restored.marketDeliveries||[]],
   ['coinLedger',snapshot.coinLedger||[],restored.coinLedger||[]],['accountEntitlementState',snapshot.accountEntitlementState||{},restored.accountEntitlementState||{}],['buildingState',serverCompany.building_state||{},restored.buildingState||{}],['land',snapshot.land||{},restored.land||{}],['constructionSite',snapshot.constructionSite||{},restored.constructionSite||{}],['machineUpgradeJobs',snapshot.machineUpgradeJobs||[],restored.machineUpgradeJobs||[]],['warehouseExpansion',snapshot.warehouseExpansion||{},restored.warehouseExpansion||{}],['warehouseCapacity',Number(snapshot.warehouseCapacity||0),Number(restored.warehouseCapacity||0)]
  ];
  for(const [name,a,b] of want)checks.push({name,success:equal(a,b)});
  const sharedOrders=company.operationalSupplyState?.orders;if(Array.isArray(sharedOrders)&&company.operationsState?.supplyOrders===sharedOrders)checks.push({name:'sharedSupplyOrdersSerialized',success:equal(snapshot.operationalSupplyState?.orders||[],snapshot.operationsState?.supplyOrders||[])});
  const timedMarket=(snapshot.marketDeliveries||[]).find(x=>['in_transit','transporting'].includes(String(x?.status||'')));if(timedMarket)checks.push({name:'marketDeliveryArrivalPreserved',success:!!restored.marketDeliveries?.find(x=>String(x.id)===String(timedMarket.id)&&String(x.arrivalTime??x.arrivalAt)===String(timedMarket.arrivalTime??timedMarket.arrivalAt))});
  const reduced=(snapshot.marketDeliveries||snapshot.supplierOrders||[]).find?.(x=>Number(x?.coinTimeReductionSpent)>0);if(reduced)checks.push({name:'transportCoinReductionPreserved',success:Number((restored.marketDeliveries||restored.supplierOrders||[]).find(x=>String(x.id)===String(reduced.id))?.coinTimeReductionSpent||0)===Number(reduced.coinTimeReductionSpent)});
  const failed=checks.filter(x=>!x.success);return{success:failed.length===0,checks,failed,snapshot,restored};
 }finally{window.worldPlayerCompany=previous;}
}
if(typeof window!=='undefined')window.persistenceReloadHealth=persistenceReloadHealth;
