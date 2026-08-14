// WorldProject - verbindet die sichtbaren Betriebsausbaustufen mit dem bereits aktiven operativen Lager-/Produktionssystem.
// Kein zweites Lager oder Produktionssystem: wir erweitern die vorhandenen Klassen und synchronisieren sie je aktivem Betrieb.
import { WarehouseSystem, ProductionPlanner, SupplyOrderSystem } from "./OperationalSupplyChainSystem.js";
import { OperationalSupplyChainDialog } from "./OperationalSupplyChainDialog.js";
import { operationalModifiers } from "./BusinessExpansionSystem.js";

const positiveMultiplier=(value,fallback=1)=>{
 const n=Number(value);
 return Number.isFinite(n)&&n>0?n:fallback;
};

export function expansionOperationalEffects(company={}){
 const mods=operationalModifiers(company);
 return {
  productionMultiplier:positiveMultiplier(mods.productionMultiplier),
  storageMultiplier:positiveMultiplier(mods.storageMultiplier),
  operatingCostMultiplier:positiveMultiplier(mods.operatingCostMultiplier),
  qualityBonus:Math.max(0,Number(mods.qualityBonus)||0),
  logisticsMultiplier:positiveMultiplier(mods.logisticsMultiplier),
  administrationMultiplier:positiveMultiplier(mods.administrationMultiplier)
 };
}

export function syncExpansionOperationalEffects(dialog,company={}){
 const effects=expansionOperationalEffects(company);
 if(dialog?.warehouse)dialog.warehouse.businessExpansionStorageMultiplier=effects.storageMultiplier;
 if(dialog?.planner){
  dialog.planner.businessExpansionProductionMultiplier=effects.productionMultiplier;
  dialog.planner.businessExpansionOperatingCostMultiplier=effects.operatingCostMultiplier;
  dialog.planner.businessExpansionQualityBonus=effects.qualityBonus;
 }
 if(dialog?.orders)dialog.orders.businessExpansionLogisticsMultiplier=effects.logisticsMultiplier;
 if(company)company.operationalExpansionEffects={...effects,updatedAt:Date.now()};
 return effects;
}

if(!WarehouseSystem.prototype.__worldExpansionCapacityPatched){
 const baseCapacity=WarehouseSystem.prototype.capacity;
 WarehouseSystem.prototype.capacity=function(zone){
  const capacity=Number(baseCapacity.call(this,zone)||0);
  return capacity*positiveMultiplier(this.businessExpansionStorageMultiplier);
 };
 Object.defineProperty(WarehouseSystem.prototype,"__worldExpansionCapacityPatched",{value:true});
}

if(!ProductionPlanner.prototype.__worldExpansionProductionPatched){
 const basePlan=ProductionPlanner.prototype.plan;
 ProductionPlanner.prototype.plan=function(recipe,batches=1){
  const plan=basePlan.call(this,recipe,batches);
  const productionMultiplier=positiveMultiplier(this.businessExpansionProductionMultiplier);
  const costMultiplier=positiveMultiplier(this.businessExpansionOperatingCostMultiplier);
  const qualityBonus=Math.max(0,Number(this.businessExpansionQualityBonus)||0);
  const beforeDuration=Math.max(0,Number(plan.durationMinutes)||0);
  const beforeCost=Math.max(0,Number(plan.estimatedCost)||0);
  plan.baseDurationMinutes=beforeDuration;
  plan.productionExpansionMultiplier=productionMultiplier;
  plan.durationMinutes=beforeDuration/productionMultiplier;
  plan.baseEstimatedCost=beforeCost;
  plan.operatingCostExpansionMultiplier=costMultiplier;
  plan.estimatedCost=beforeCost*costMultiplier;
  plan.qualityExpansionBonus=qualityBonus;
  return plan;
 };
 Object.defineProperty(ProductionPlanner.prototype,"__worldExpansionProductionPatched",{value:true});
}

if(!SupplyOrderSystem.prototype.__worldExpansionLogisticsPatched){
 const baseCreateOrder=SupplyOrderSystem.prototype.createOrder;
 SupplyOrderSystem.prototype.createOrder=function(args={}){
  const order=baseCreateOrder.call(this,args);
  const multiplier=positiveMultiplier(this.businessExpansionLogisticsMultiplier);
  if(multiplier<=1)return order;
  const created=Number(order.createdAt||args.now||Date.now());
  const plannedSpan=Math.max(0,Number(order.plannedEta||created)-created);
  const actualSpan=Math.max(0,Number(order.eta||order.plannedEta||created)-created);
  order.basePlannedEta=order.plannedEta;
  order.baseEta=order.eta;
  order.logisticsExpansionMultiplier=multiplier;
  order.plannedEta=created+plannedSpan/multiplier;
  order.eta=created+actualSpan/multiplier;
  return order;
 };
 Object.defineProperty(SupplyOrderSystem.prototype,"__worldExpansionLogisticsPatched",{value:true});
}

if(!OperationalSupplyChainDialog.prototype.__worldExpansionSyncPatched){
 const baseLoadState=OperationalSupplyChainDialog.prototype.loadState;
 OperationalSupplyChainDialog.prototype.loadState=function(company){
  const result=baseLoadState.call(this,company);
  syncExpansionOperationalEffects(this,company);
  return result;
 };
 const baseRender=OperationalSupplyChainDialog.prototype.render;
 OperationalSupplyChainDialog.prototype.render=function(panel){
  const company=this.companyProvider?.();
  if(company)syncExpansionOperationalEffects(this,company);
  return baseRender.call(this,panel);
 };
 Object.defineProperty(OperationalSupplyChainDialog.prototype,"__worldExpansionSyncPatched",{value:true});
}

export function runBusinessExpansionOperationalEffectsTest(){
 const warehouse=new WarehouseSystem({raw:100,packaging:100,finished:100,cold:0});
 warehouse.businessExpansionStorageMultiplier=1.25;
 if(Math.abs(warehouse.capacity("finished")-125)>1e-9)throw new Error("Lagerausbau wirkt nicht auf operative Kapazität");
 const effects=expansionOperationalEffects({upgrades:{production:2,storage:3,efficiency:2,logistics:2}});
 if(!(effects.productionMultiplier>1)||!(effects.storageMultiplier>1)||!(effects.operatingCostMultiplier<1)||!(effects.logisticsMultiplier>1))throw new Error("Ausbaumultiplikatoren werden nicht korrekt berechnet");
 return true;
}

if(typeof window!=="undefined")window.worldBusinessExpansionOperationalEffects={expansionOperationalEffects,syncExpansionOperationalEffects,runBusinessExpansionOperationalEffectsTest};
