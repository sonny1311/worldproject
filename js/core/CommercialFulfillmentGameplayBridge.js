// WorldProject - bindet den sichtbaren Economy-Controller an die vorhandene
// Lager -> Reservierung -> Transport -> Rechnung -> Zahlung-Kette.
import { ConnectedEconomyGameplay } from "./ConnectedEconomyGameplay.js";
import { CommercialFulfillmentSystem } from "./CommercialFulfillmentSystem.js";
import "./CustomerOrderFulfillmentUIBridge.js";

function finishedStock(company){
  company.operationalSupplyState??={};
  company.operationalSupplyState.warehouseStock??={};
  company.operationalSupplyState.warehouseStock.finished??=company.finishedGoods??{};
  return company.operationalSupplyState.warehouseStock.finished;
}

function toTimestamp(value){
  if(value instanceof Date)return value.getTime();
  const numeric=Number(value);
  if(Number.isFinite(numeric)&&numeric>0)return numeric;
  const parsed=Date.parse(value);
  return Number.isFinite(parsed)?parsed:0;
}

export function assessLatePenalty(order,{deliveredAt=Date.now(),deliveredBefore=null}={}){
  const due=toTimestamp(order?.dueAt??order?.deliveryDeadline??order?.deadline);
  const arrival=toTimestamp(deliveredAt)||Date.now();
  const late=due>0&&arrival>due;
  const rate=Math.max(0,Number(order?.penaltyPerMissing??order?.latePenaltyPerUnit??0));
  if(!late||rate<=0)return {late,penalty:0,newlyAssessedUnits:0,assessedUnits:Number(order?.latePenaltyUnitsAssessed||0)};

  const quantity=Math.max(0,Number(order?.quantity??order?.amount??0));
  const alreadyDelivered=Math.max(0,Number(deliveredBefore??order?.delivered??order?.deliveredQuantity??order?.fulfilledQuantity??order?.deliveredAmount??0));
  const outstandingAtFirstLateAssessment=Math.max(0,quantity-alreadyDelivered);
  const previouslyAssessedUnits=Math.max(0,Number(order?.latePenaltyUnitsAssessed||0));
  const newlyAssessedUnits=Math.max(0,outstandingAtFirstLateAssessment-previouslyAssessedUnits);
  const penalty=newlyAssessedUnits*rate;

  if(newlyAssessedUnits>0){
    order.latePenaltyUnitsAssessed=previouslyAssessedUnits+newlyAssessedUnits;
    order.latePenaltyAssessed=Number(order.latePenaltyAssessed||0)+penalty;
    order.latePenaltyFirstAssessedAt??=arrival;
  }
  return {late,penalty,newlyAssessedUnits,assessedUnits:Number(order.latePenaltyUnitsAssessed||0)};
}

function marketFacade(game,company){
  return {
    orders:company.customerOrders??[],
    deliver(orderId,{quantity,quality=1,deliveredAt=Date.now(),transportCost=0}={}){
      const order=this.orders.find(o=>o.id===orderId);
      if(!order)throw new Error("Kundenauftrag fehlt");
      order.product??=order.productId;
      order.quantity??=Number(order.amount||0);
      order.delivered=Number(order.delivered??order.deliveredQuantity??order.fulfilledQuantity??order.deliveredAmount??0);
      order.unitPrice=Number(order.unitPrice??order.pricePerUnit??order.price??0);
      const remaining=Math.max(0,Number(order.quantity||0)-order.delivered);
      const accepted=Math.min(Math.max(Number(quantity)||0,0),remaining);
      if(accepted<=0)throw new Error("Keine lieferbare Auftragsmenge");
      const deliveredBefore=order.delivered;
      const lateAssessment=assessLatePenalty(order,{deliveredAt,deliveredBefore});
      order.delivered+=accepted;
      order.deliveredQuantity=order.delivered;
      const penalty=lateAssessment.penalty;
      const revenue=accepted*order.unitPrice;
      const net=revenue-Number(transportCost||0)-penalty;
      if(order.delivered>=Number(order.quantity||0)){
        order.status="completed";
        order.completedAt=new Date(Number(deliveredAt)||Date.now());
        company.completedCustomerOrders??=[];
        if(!company.completedCustomerOrders.some(x=>x.id===order.id))company.completedCustomerOrders.push(order);
      }else order.status="open";
      game.advanced.record(company,"customer_sale",net,{orderId:order.id,qty:accepted,revenue,transportCost:Number(transportCost||0),penalty,latePenaltyUnits:lateAssessment.newlyAssessedUnits,quality});
      return {status:"paid",accepted,revenue,transportCost:Number(transportCost||0),penalty,net,late:lateAssessment.late};
    }
  };
}

ConnectedEconomyGameplay.prototype.deliverCustomerOrder=async function(company,orderId,amount,{distanceKm=10,quality=1,vehicleType=null}={}){
  this.ensureCompany(company);
  const vehicle=(company.vehicles||[]).find(v=>["available","idle"].includes(v.status)&&(!vehicleType||v.type===vehicleType));
  if(!vehicle)return {success:false,reason:"Kein freies Lieferfahrzeug verfügbar"};
  const finished=finishedStock(company),warehouse={stock:{finished}},market=marketFacade(this,company);
  const system=new CommercialFulfillmentSystem({market,warehouse});
  try{
    const fulfillment=system.reserve(orderId,amount);
    vehicle.status="reserved";
    const type=vehicleType||vehicle.type||vehicle.definition?.id;
    if(!type)throw new Error("Fahrzeugtyp fehlt");
    const cargo={weightKg:Math.max(Number(fulfillment.quantity)||0,0)};
    system.prepareTransport(fulfillment.id,{vehicleType:type,distanceKm:Math.max(Number(distanceKm)||0,0),cargo});
    vehicle.status="driving";
    const result=await system.deliver(fulfillment.id,{company,quality,timeScaleMsPerGameMinute:0});
    vehicle.status="available";
    vehicle.odometerKm=Number(vehicle.odometerKm||0)+Math.max(Number(distanceKm)||0,0);
    window.dispatchEvent?.(new CustomEvent("world:game-state-dirty",{detail:{reason:"customer-order-delivered",orderId}}));
    return {success:true,accepted:fulfillment.quantity,revenue:result.invoice?.revenue||0,net:result.invoice?.net||0,transportCost:result.invoice?.transportCost||0,completed:result.order?.status==="completed"||result.order?.status==="fulfilled",order:result.order,fulfillment:result.fulfillment,invoice:result.invoice};
  }catch(error){
    if(vehicle.status==="reserved"||vehicle.status==="driving")vehicle.status="available";
    return {success:false,reason:error?.message||String(error)};
  }
};

export function runLatePartialDeliveryPenaltyRegression(){
  const due=Date.now()-3600000;
  const partial={quantity:100,delivered:40,dueAt:due,penaltyPerMissing:2};
  const first=assessLatePenalty(partial,{deliveredAt:Date.now(),deliveredBefore:40});
  partial.delivered=70;
  const second=assessLatePenalty(partial,{deliveredAt:Date.now(),deliveredBefore:70});
  if(first.penalty!==120||first.newlyAssessedUnits!==60||second.penalty!==0||partial.latePenaltyUnitsAssessed!==60)throw new Error("Verspaetungsabzug wurde bei Teillieferungen mehrfach berechnet");

  const completeLate={quantity:50,delivered:0,dueAt:due,penaltyPerMissing:1.5};
  const complete=assessLatePenalty(completeLate,{deliveredAt:Date.now(),deliveredBefore:0});
  if(complete.penalty!==75||complete.newlyAssessedUnits!==50)throw new Error("Vollstaendig verspaetete Lieferung wurde nicht auf die ausstehende Menge belastet");

  const onTime={quantity:50,delivered:0,dueAt:Date.now()+3600000,penaltyPerMissing:3};
  const timely=assessLatePenalty(onTime,{deliveredAt:Date.now(),deliveredBefore:0});
  if(timely.penalty!==0||timely.late)throw new Error("Puenktliche Lieferung erhielt faelschlich Verspaetungsabzug");
  return true;
}
