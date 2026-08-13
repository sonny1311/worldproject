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
      order.delivered+=accepted;
      order.deliveredQuantity=order.delivered;
      const dueRaw=order.dueAt??order.deliveryDeadline??order.deadline;
      const due=dueRaw instanceof Date?dueRaw.getTime():Number(dueRaw)||Date.parse(dueRaw)||0;
      const late=due>0&&Number(deliveredAt)>due;
      const penaltyPerMissing=Number(order.penaltyPerMissing??order.latePenaltyPerUnit??0);
      const missingAfter=Math.max(0,Number(order.quantity||0)-order.delivered);
      const penalty=late?missingAfter*penaltyPerMissing:0;
      const revenue=accepted*order.unitPrice;
      const net=revenue-Number(transportCost||0)-penalty;
      if(order.delivered>=Number(order.quantity||0)){
        order.status="completed";
        order.completedAt=new Date(Number(deliveredAt)||Date.now());
        company.completedCustomerOrders??=[];
        if(!company.completedCustomerOrders.some(x=>x.id===order.id))company.completedCustomerOrders.push(order);
      }else order.status="open";
      game.advanced.record(company,"customer_sale",net,{orderId:order.id,qty:accepted,revenue,transportCost:Number(transportCost||0),penalty,quality});
      return {status:"paid",accepted,revenue,transportCost:Number(transportCost||0),penalty,net,late};
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