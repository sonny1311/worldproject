// WorldProject - durchgehende Verkaufskette: Lager -> Kundenauftrag -> Transport -> Rechnung -> Firmenkonto
import { TransportGameplaySystem } from "./TransportGameplaySystem.js";

export class CommercialFulfillmentSystem {
  constructor({market,warehouse,transport=null}={}){
    this.market=market;
    this.warehouse=warehouse;
    this.transport=transport||new TransportGameplaySystem();
    this.fulfillments=[];
    this.seq=1;
  }

  availableFinished(product){return Number(this.warehouse?.stock?.finished?.[product]||0);}

  reserve(orderId,quantity=null){
    const order=this.market?.orders?.find(o=>o.id===orderId);
    if(!order)throw new Error("Kundenauftrag nicht gefunden");
    const need=Math.max(0,order.quantity-order.delivered-Number(order.reserved||0));
    const qty=Math.min(quantity==null?need:Number(quantity),need,this.availableFinished(order.product));
    if(qty<=0)throw new Error("Nicht genug Fertigware fuer diesen Auftrag");
    this.warehouse.stock.finished[order.product]-=qty;
    order.reserved=Number(order.reserved||0)+qty;
    const f={id:this.seq++,orderId:order.id,product:order.product,quantity:qty,status:"reserved",reservedAt:Date.now(),transportPlan:null,invoice:null};
    this.fulfillments.push(f);return f;
  }

  release(fulfillmentId){
    const f=this.fulfillments.find(x=>x.id===fulfillmentId);if(!f||f.status!=="reserved")return false;
    const o=this.market.orders.find(x=>x.id===f.orderId);this.warehouse.stock.finished[f.product]=this.availableFinished(f.product)+f.quantity;o.reserved=Math.max(0,Number(o.reserved||0)-f.quantity);f.status="released";return true;
  }

  prepareTransport(fulfillmentId,{vehicleType=null,distanceKm=0,cargo={}}={}){
    const f=this.fulfillments.find(x=>x.id===fulfillmentId);if(!f||f.status!=="reserved")throw new Error("Reservierte Lieferung nicht gefunden");
    const transportOrder={id:`sale-${f.id}`,totalWeightKg:Number(cargo.weightKg||0),items:[{distanceKm:Number(distanceKm||0)}],status:"open"};
    const prepared=this.transport.prepareOrder(transportOrder,{vehicleType,distanceKm,cargo});
    if(!prepared.success)throw new Error(prepared.reason||"Transport konnte nicht geplant werden");
    f.transportPlan=prepared.plan;f.transportOrder=transportOrder;f.status="transport_planned";return prepared;
  }

  async deliver(fulfillmentId,{company,quality=1,deliveredAt=null,timeScaleMsPerGameMinute=0}={}){
    const f=this.fulfillments.find(x=>x.id===fulfillmentId);if(!f)throw new Error("Lieferung nicht gefunden");
    const o=this.market.orders.find(x=>x.id===f.orderId);if(!o)throw new Error("Kundenauftrag fehlt");
    let transportCost=0,arrival=deliveredAt||Date.now();
    if(f.transportOrder){const result=await this.transport.executeOrder(f.transportOrder,{vehicleType:f.transportPlan.vehicleType,distanceKm:f.transportPlan.distanceKm,cargo:f.transportPlan.evaluation?.cargo||{},timeScaleMsPerGameMinute});if(!result.success)throw new Error(result.reason||"Transport fehlgeschlagen");transportCost=Number(result.plan.totalCost||0);arrival=deliveredAt||result.plan.arrivalTime?.getTime?.()||Date.now();}
    const invoice=this.market.deliver(o.id,{quantity:f.quantity,quality,deliveredAt:Number(arrival),transportCost});
    o.reserved=Math.max(0,Number(o.reserved||0)-f.quantity);f.invoice=invoice;f.status="delivered";f.deliveredAt=Number(arrival);
    if(company){company.money=Number(company.money||0)+Number(invoice.net||0);company.lastSalesRevenue=Number(company.lastSalesRevenue||0)+Number(invoice.revenue||0);company.lastSalesNet=Number(company.lastSalesNet||0)+Number(invoice.net||0);}
    return {success:true,fulfillment:f,order:o,invoice,companyMoney:Number(company?.money||0)};
  }
}

export async function runCommercialFulfillmentTest(){
  const market={orders:[{id:1,product:"test_product",quantity:100,delivered:0,reserved:0,unitPrice:2,dueAt:Date.now()+86400000,qualityMin:0,penaltyPerMissing:0,status:"open"}],deliver(orderId,{quantity,transportCost=0}){const o=this.orders.find(x=>x.id===orderId);o.delivered+=quantity;o.status=o.delivered>=o.quantity?"fulfilled":"open";return {revenue:quantity*o.unitPrice,penalty:0,transportCost,net:quantity*o.unitPrice-transportCost,status:"paid"};}};
  const warehouse={stock:{finished:{test_product:100}}},company={money:1000};
  const transport={prepareOrder(){return {success:true,plan:{vehicleType:"van",distanceKm:0,totalCost:0,evaluation:{cargo:{}}}};},async executeOrder(){return {success:true,plan:{totalCost:0,arrivalTime:new Date()}};}};
  const system=new CommercialFulfillmentSystem({market,warehouse,transport}),f=system.reserve(1,100);system.prepareTransport(f.id,{vehicleType:"van",distanceKm:0});const result=await system.deliver(f.id,{company});
  if(warehouse.stock.finished.test_product!==0||market.orders[0].status!=="fulfilled"||company.money<=1000||result.invoice.net<=0)throw new Error("Durchgehender Verkaufs-/Liefer-/Zahlungstest fehlgeschlagen");
  console.log("✅ LAGER-/KUNDENAUFTRAG-/TRANSPORT-/RECHNUNGS-/ZAHLUNGSTEST ERFOLGREICH",result);return true;
}
