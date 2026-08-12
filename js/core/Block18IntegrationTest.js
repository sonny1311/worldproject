// WorldProject - Abschlussintegration fuer den 18-Punkte-Block
import { PremiumEntitlementSystem } from "./PremiumEntitlementSystem.js";
import { ConstructionQueueSystem } from "./ConstructionQueueSystem.js";
import { PremiumProductionQueueSystem } from "./PremiumProductionQueueSystem.js";
import { WarehouseSystem, ProductionPlanner } from "./OperationalSupplyChainSystem.js";
import { CustomerMarketSystem } from "./MarketSalesSystem.js";
import { CommercialFulfillmentSystem } from "./CommercialFulfillmentSystem.js";

export async function runBlock18IntegrationTest(){
 const premium=new PremiumEntitlementSystem(),account={premiumUntil:Date.now()+3600000},company={money:100000};
 const construction=new ConstructionQueueSystem({premium});
 for(let i=0;i<5;i++)construction.start({account,company,type:"small_storage",now:Date.now()});
 account.premiumUntil=Date.now()-1;construction.status(account,Date.now());
 const building=construction.jobs.filter(j=>j.status==="building").length,paused=construction.jobs.filter(j=>j.status==="paused_premium").length;
 if(building!==3||paused!==2)throw new Error("Premium-Bauprojekte wurden beim Ablauf nicht korrekt pausiert");

 account.premiumUntil=Date.now()+3600000;
 const warehouse=new WarehouseSystem({raw:10000,packaging:10000,finished:10000,cold:0});warehouse.stock.raw.malt=500;
 const planner=new ProductionPlanner({warehouse,machines:[{id:1,type:"brewhouse",busy:false}]});
 const prodQueue=new PremiumProductionQueueSystem({premium});
 const recipe={id:"block18_beer",product:"block18_beer",materials:{malt:100},machineType:"brewhouse",durationMinutes:1,output:100,variableCost:10};
 prodQueue.enqueue(account,{recipe,batches:1});prodQueue.enqueue(account,{recipe,batches:1});prodQueue.enqueue(account,{recipe,batches:1});
 let now=0;for(let i=0;i<3;i++){prodQueue.tick({account,planner,now,staffingCheck:()=>({ok:true})});const running=planner.queue.find(j=>j.status==="running");if(running){now=running.finishAt;planner.advance(now);prodQueue.tick({account,planner,now,staffingCheck:()=>({ok:true})});}}
 if(Number(warehouse.stock.finished.block18_beer||0)!==300)throw new Error("Premium-Produktionsqueue hat Folgeproduktionen nicht korrekt abgearbeitet");

 const market=new CustomerMarketSystem(),customer=market.addCustomer({typeId:"retailer",industry:"brewery",name:"Block18 Kunde"}),order=market.createOrder({customerId:customer.id,product:"block18_beer",quantity:300,unitPrice:2,dueAt:Date.now()+86400000,penaltyPerMissing:.1});
 const transport={prepareOrder(){return {success:true,plan:{vehicleType:"van",distanceKm:20,totalCost:25,evaluation:{cargo:{weightKg:300}}}};},async executeOrder(){return {success:true,plan:{totalCost:25,arrivalTime:new Date()}};}};
 const fulfill=new CommercialFulfillmentSystem({market,warehouse,transport}),f=fulfill.reserve(order.id,300);fulfill.prepareTransport(f.id,{vehicleType:"van",distanceKm:20,cargo:{weightKg:300}});const before=company.money,result=await fulfill.deliver(f.id,{company});
 if(order.status!=="fulfilled"||warehouse.stock.finished.block18_beer!==0||result.invoice.net<=0||company.money<=before)throw new Error("Markt-/Transport-/Zahlungskette im Block18-Test fehlgeschlagen");
 console.log("✅ BLOCK 18 KOMPLETT INTEGRIERT: PREMIUM-PAUSE → PRODUKTIONSQUEUE → LAGER → MARKT → TRANSPORT → ZAHLUNG",{construction:{building,paused},production:300,invoice:result.invoice,companyMoney:company.money});return true;
}
