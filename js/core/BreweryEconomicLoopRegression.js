// WorldProject - End-to-End-Regression fuer den spielbaren Brauerei-Wirtschaftskreislauf.
// Prueft echte Module: Einkauf/Lieferung -> operatives Lager -> Produktion ->
// kanonische Fertigware -> Teil-/Restlieferung -> Fremdspedition -> Geld -> JSON-Reload.
import { AdvancedEconomySystem } from './AdvancedEconomySystem.js';
import { operationalAmount } from './UnifiedOperationalStockBridge.js';
import './CustomerFreightDeliveryIntegration.js';

function assert(condition,message){if(!condition)throw new Error(message);}
const close=(a,b,eps=1e-6)=>Math.abs(Number(a)-Number(b))<=eps;
const clone=value=>JSON.parse(JSON.stringify(value));

function baseCompany(){
 return {
  id:'brewery-e2e',name:'Brauerei E2E',type:'Brauerei',branchKey:'brewery',setupPhase:'operating',money:20000,
  buildingState:{equipment:[{id:'filling_line'}]},
  operationalSupplyState:{warehouseStock:{raw:{},packaging:{},cold:{},finished:{}}},
  inventory:{},finishedGoods:{},supplierOrders:[],vehicles:[],productionQueue:[],productionHistory:[],
  productionMachines:[{id:'line1',status:'available',condition:100,speedMultiplier:1}],productionState:{slots:1},
  storageState:{capacityUnits:25000},storageAreas:{raw:{capacity:10000},packaging:{capacity:10000},finished:{capacity:10000}},
  customerOrders:[],completedCustomerOrders:[],financialLog:[],costAccounting:{productCosts:{lager033_bottle:{costPerUnit:.55}}},
  salesPrices:{},competitorHistory:{},coinLedger:[],coins:0
 };
}

export function runBreweryEconomicLoopRegression(){
 const system=new AdvancedEconomySystem(),company=baseCompany();system.ensureCompany(company);
 const checks=[],ok=(name,condition)=>{assert(condition,name);checks.push(name);};
 const startMoney=company.money;
 const supplies=[
  ['malt_kg',55,35],['hops_kg',.45,4],['yeast_kg',.25,2],['water_l',360,4],
  ['bottle_033',1000,170],['crown_cap',1000,25],['label_033',1000,90]
 ];
 let procurementCost=0;
 for(const[itemId,amount,totalCost]of supplies){
  const offer={id:`e2e-${itemId}`,supplierName:'E2E Lieferant',itemId,deliveryHours:.25};
  const created=system.createSupplierDelivery(company,offer,amount,totalCost);assert(created.success,`Bestellung fehlgeschlagen: ${itemId}`);
  procurementCost+=totalCost;
 }
 ok('Einkauf belastet Firmenkonto',close(company.money,startMoney-procurementCost));
 const arrival=new Date(Date.now()+3600000),delivered=system.processSupplierDeliveries(company,arrival);
 ok('Alle Rohstoffe werden geliefert',delivered.length===supplies.length);
 ok('Legacy-Rohstoff-ID sieht kanonischen Malzbestand',close(operationalAmount(company,'malt_kg'),55)&&close(operationalAmount(company,'malt'),55));
 ok('Verpackungsmaterial liegt im operativen Lager',close(operationalAmount(company,'bottle_033'),1000)&&close(operationalAmount(company,'bottles'),1000));

 const production=system.startProduction(company,'lager033',1);
 ok('Lagerbier-Produktion startet',production.success);
 ok('Produktionsstart verbraucht Malz',close(operationalAmount(company,'malt'),0));
 const completed=system.processProduction(company,new Date(Date.now()+24*3600000));
 ok('Produktion wird fertiggestellt',completed.length===1);
 ok('Fertigware ist unter alter und neuer ID identisch',operationalAmount(company,'lager033_bottle',{finished:true})===1000&&operationalAmount(company,'beer_lager_033',{finished:true})===1000);

 const orderCreated=system.createCustomerOrder(company,{productId:'lager033_bottle',amount:500,unitPrice:1,customer:'E2E Markt'});
 assert(orderCreated.success,'Kundenauftrag konnte nicht erstellt werden');const order=orderCreated.order;order.distanceKm=20;
 const beforeSales=company.money;
 const first=system.deliverCustomerOrder(company,order.id,200);
 ok('Erste Teillieferung liefert 200 Flaschen',first.success&&first.accepted===200&&order.delivered===200&&order.status==='open');
 ok('Erste Lieferung nutzt Fremdspedition',first.freight?.mode==='external'&&first.freight.cost>0);
 ok('Bestand sinkt nach Teillieferung alias-sicher',operationalAmount(company,'beer_lager_033',{finished:true})===800&&operationalAmount(company,'lager033_bottle',{finished:true})===800);
 const second=system.deliverCustomerOrder(company,order.id,999);
 ok('Restlieferung ist auf offene 300 begrenzt',second.success&&second.accepted===300&&order.delivered===500);
 ok('Auftrag wird nach Restlieferung abgeschlossen',order.status==='completed');
 ok('Zweite Lieferung hat eigene Transportkosten',second.freight?.mode==='external'&&second.freight.cost>0);
 ok('Endbestand nach Verkauf stimmt',operationalAmount(company,'beer_lager_033',{finished:true})===500);
 const expectedAfterSales=beforeSales+500-first.freight.cost-second.freight.cost;
 ok('Geld entspricht Umsatz minus beiden Transportkosten',close(company.money,expectedAfterSales));
 const freightBookings=company.financialLog.filter(x=>x.type==='customer_delivery_external_freight');
 ok('Transportkosten werden zweimal im Finanzlog gebucht',freightBookings.length===2&&close(-freightBookings.reduce((s,x)=>s+Number(x.amount||0),0),first.freight.cost+second.freight.cost));

 const restored=clone(company);
 ok('JSON-Reload behaelt Geld',close(restored.money,company.money));
 ok('JSON-Reload behaelt Fertigwarenbestand',operationalAmount(restored,'lager033_bottle',{finished:true})===500&&operationalAmount(restored,'beer_lager_033',{finished:true})===500);
 const restoredOrder=restored.customerOrders.find(x=>x.id===order.id);
 ok('JSON-Reload behaelt abgeschlossenen Kundenauftrag',restoredOrder?.status==='completed'&&restoredOrder.delivered===500);
 ok('JSON-Reload behaelt Produktionsabschluss',restored.productionQueue.some(x=>x.status==='completed')&&restored.productionHistory.length===1);

 const report={success:true,checks,procurementCost,firstFreight:first.freight.cost,secondFreight:second.freight.cost,endMoney:company.money,endFinished:operationalAmount(company,'beer_lager_033',{finished:true})};
 if(typeof window!=='undefined')window.worldBreweryEconomicLoopRegression=report;
 console.log(`WORLDPROJECT BRAUEREI E2E ${checks.length}/${checks.length}`,report);return report;
}
