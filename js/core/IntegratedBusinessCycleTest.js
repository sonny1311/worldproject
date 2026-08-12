// WorldProject - integrierter Wirtschaftskreislauf-Test
import { worldContentRegistry } from "./ContentRegistry.js";
import { SupplyOrderSystem, WarehouseSystem, ProductionPlanner } from "./OperationalSupplyChainSystem.js";
import { CustomerMarketSystem } from "./MarketSalesSystem.js";
import { CommercialFulfillmentSystem } from "./CommercialFulfillmentSystem.js";

export async function runIntegratedBusinessCycleTest(){
 const company={id:99,industry:"brewery",money:5000};
 const supplier=worldContentRegistry.get("suppliers","brew_malt_regional")||{id:"test_supplier",industries:["brewery"],materials:["malt"],prices:{malt:1},distanceKm:10,deliveryBase:10,deliveryPerKm:.2,deliveryHours:1,quality:1,reliability:1};
 const orders=new SupplyOrderSystem(),warehouse=new WarehouseSystem({raw:20000,packaging:20000,finished:20000,cold:0});
 const purchase=orders.createOrder({company,supplier,material:"malt",quantity:500,transportMode:"supplier",now:0});
 company.money-=purchase.quote.totalCost;orders.advance(purchase.eta);warehouse.receive(purchase);
 const planner=new ProductionPlanner({warehouse,machines:[{id:1,type:"brewhouse",busy:false}]});
 const recipe={id:"cycle_beer",product:"cycle_beer",materials:{malt:100},machineType:"brewhouse",durationMinutes:60,output:1000,variableCost:80};
 const job=planner.start(recipe,1,0);planner.advance(job.finishAt);
 const market=new CustomerMarketSystem(),customer=market.addCustomer({typeId:"retailer",industry:"brewery",name:"Cycle Markt"}),saleOrder=market.createOrder({customerId:customer.id,product:"cycle_beer",quantity:1000,unitPrice:1.5,dueAt:Date.now()+86400000,penaltyPerMissing:.2});
 const transport={prepareOrder(){return {success:true,plan:{vehicleType:"truck",distanceKm:50,totalCost:60,evaluation:{cargo:{weightKg:5000}}}};},async executeOrder(){return {success:true,plan:{totalCost:60,arrivalTime:new Date()}};}};
 const fulfillment=new CommercialFulfillmentSystem({market,warehouse,transport}),reserved=fulfillment.reserve(saleOrder.id,1000);fulfillment.prepareTransport(reserved.id,{vehicleType:"truck",distanceKm:50,cargo:{weightKg:5000}});const delivered=await fulfillment.deliver(reserved.id,{company});
 const success=purchase.status==="stored"&&job.status==="finished"&&warehouse.stock.finished.cycle_beer===0&&saleOrder.status==="fulfilled"&&delivered.invoice.status==="paid"&&delivered.invoice.net>0&&company.money>0;
 if(!success)throw new Error("Integrierter Wirtschaftskreislauf-Test fehlgeschlagen");
 console.log("✅ KOMPLETTER WIRTSCHAFTSKREISLAUF ERFOLGREICH: EINKAUF → LAGER → PRODUKTION → VERKAUF → TRANSPORT → RECHNUNG → GELD",{company,purchase,job,saleOrder,invoice:delivered.invoice});return true;
}
