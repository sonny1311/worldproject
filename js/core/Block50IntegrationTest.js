// WorldProject - Abschlusspruefung Block 26-50
import { BusinessUpgradeSystem } from "./BusinessUpgradeSystem.js";
import { QualityEconomySystem } from "./QualityEconomySystem.js";
import { SupplierComparisonSystem } from "./SupplierComparisonSystem.js";
import { MachineOperationsSystem } from "./MachineOperationsSystem.js";
import { ProductionQualitySystem } from "./ProductionQualitySystem.js";
import { QualitySalesSystem } from "./QualitySalesSystem.js";
import { BusinessReputationSystem } from "./BusinessReputationSystem.js";
import { DemandAndOrderSystem } from "./DemandAndOrderSystem.js";
import { GoodsCirculationSystem } from "./GoodsCirculationSystem.js";
import { DailyBusinessCashflowSystem } from "./DailyBusinessCashflowSystem.js";
import { CapacityPressureSystem } from "./CapacityPressureSystem.js";

export function runBlock50IntegrationTest(){
 const company={id:1,money:250000,machineSlots:4};
 const upgrades=new BusinessUpgradeSystem();upgrades.upgrade(company,"production");
 const quality=new QualityEconomySystem(),compare=new SupplierComparisonSystem();
 const suppliers=[{id:"cheap",label:"Billigmalz",materials:["malt"],prices:{malt:1},quality:.9,distanceKm:80,deliveryBase:20,deliveryPerKm:.2,deliveryHours:18,reliability:.95},{id:"best",label:"Qualitaetsmalz",materials:["malt"],prices:{malt:1.25},quality:1.08,distanceKm:35,deliveryBase:20,deliveryPerKm:.2,deliveryHours:7,reliability:.99}];
 const options=compare.compare({suppliers,material:"malt",quantity:1000,qualityGrade:"premium",qualitySystem:quality}),selected=compare.select(options,"best");if(!selected.selectedByPlayer||selected.quality<=1)throw new Error("Block50 Lieferant/Qualitaet");
 const machines=new MachineOperationsSystem({catalog:{brewhouse:{label:"Sudhaus",price:50000,slots:2,capacity:1000,reliability:.99,serviceIntervalHours:500}}}),machine=machines.buy(company,"brewhouse");
 const production=new ProductionQualitySystem(),run=production.produce({companyId:1,product:"beer",plannedQuantity:1000,rawQuality:selected.quality,machineCondition:machine.condition,machineLevel:machine.level,employeeSkill:1.05,processQuality:1.03});if(run.goodQuantity<=0)throw new Error("Block50 Produktion");
 const sales=new QualitySalesSystem(),rep=new BusinessReputationSystem();rep.delivery(1,{onTime:true,quality:run.quality});const unitPrice=sales.price({basePrice:2,quality:run.quality,reputation:rep.publicProfile(1).reputation});
 const circulation=new GoodsCirculationSystem();circulation.add({companyId:1,product:"beer",quality:"premium",quantity:run.goodQuantity});const demand=new DemandAndOrderSystem();demand.registerProduct("beer",{baseDailyDemand:300,volatility:0});const wanted=demand.demand({product:"beer",quality:run.quality,reputation:rep.publicProfile(1).reputation,random:()=>.5}),out=circulation.fulfillDemand({companyId:1,product:"beer",quality:"premium",demand:wanted});if(out.fulfilled<=0)throw new Error("Block50 Nachfrage/Warenumlauf");
 const cash=new DailyBusinessCashflowSystem(),day=Date.UTC(2026,7,12),sale=cash.recordDailySales({companyId:1,businessType:"manufacturing",grossSales:out.fulfilled*unitPrice,date:day});cash.processPayments({now:day+15*86400000});const summary=cash.dailySummary(1,day,day+20*86400000);if(summary.revenue<=0||summary.cashIn<=0)throw new Error("Block50 Cashflow");
 const pressure=new CapacityPressureSystem(),p=pressure.analyze({demand:1000,stock:0,dailyProduction:500,rawMaterialCapacity:900,staffCapacity:650,machineCapacity:500,storageFree:2000});if(!p.underPressure)throw new Error("Block50 Kapazitaetsdruck");
 console.log("🏁 BLOCK 26-50 INTEGRATIONSTEST ERFOLGREICH",{selected,quality:run.quality,unitPrice,revenue:summary.revenue,cashIn:summary.cashIn,bottlenecks:p.bottlenecks});return true;
}
