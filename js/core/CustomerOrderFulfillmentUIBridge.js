// WorldProject - UI-Brücke für bestehende Kundenauftragserfüllung.
// Nutzt ausschließlich EconomyDashboard + ConnectedEconomyGameplay.deliverCustomerOrder().
import { EconomyDashboard } from "./EconomyDashboard.js";
import { i18n } from "./InternationalizationSystem.js";

i18n.addDictionary("de",{
  "customer.deliverable_title":"Auslieferbare Fertigware",
  "customer.deliver_available":"{customer}: {quantity} {product} ausliefern",
  "customer.delivery_success":"{quantity} erfolgreich ausgeliefert und abgerechnet.",
  "customer.delivery_failed":"Auslieferung nicht möglich: {reason}"
});
i18n.addDictionary("en",{
  "customer.deliverable_title":"Finished goods ready for delivery",
  "customer.deliver_available":"Deliver {quantity} {product} to {customer}",
  "customer.delivery_success":"{quantity} delivered and settled successfully.",
  "customer.delivery_failed":"Delivery failed: {reason}"
});
i18n.addDictionary("es",{
  "customer.deliverable_title":"Productos terminados listos para entregar",
  "customer.deliver_available":"Entregar {quantity} {product} a {customer}",
  "customer.delivery_success":"{quantity} entregados y liquidados correctamente.",
  "customer.delivery_failed":"No se pudo realizar la entrega: {reason}"
});
i18n.addDictionary("zh",{
  "customer.deliverable_title":"可交付成品",
  "customer.deliver_available":"向 {customer} 交付 {quantity} {product}",
  "customer.delivery_success":"已成功交付并结算 {quantity}。",
  "customer.delivery_failed":"无法交付：{reason}"
});

function finishedAvailable(dashboard,order){
  const state=dashboard.operationsOverview.state();
  const product=order?.product||order?.productId||order?.itemId;
  return Math.max(0,Number(state.company?.operationalSupplyState?.warehouseStock?.finished?.[product]||0));
}

async function deliverAvailable(dashboard,order,amount){
  const state=dashboard.operationsOverview.state(),company=state.company;
  if(!company||!order?.id||!(amount>0))return;
  const result=await dashboard.controller.deliverCustomerOrder(company,order.id,amount);
  if(!result?.success){
    alert(i18n.t("customer.delivery_failed",{reason:result?.reason||i18n.t("time.unknown")}));
    return;
  }
  alert(i18n.t("customer.delivery_success",{quantity:dashboard.amount(result.accepted??amount)}));
  const panel=dashboard.overlay?.firstElementChild;
  if(panel)dashboard.render(panel);
}

const originalRender=EconomyDashboard.prototype.render;
EconomyDashboard.prototype.render=function(panel){
  originalRender.call(this,panel);
  if(this.company?.setupPhase&&this.company.setupPhase!=="operating")return;
  const card=this.overlay?.querySelector?.("#dashboard-customer-orders");
  if(!card)return;
  const orders=this.operationsOverview.openCustomerOrders();
  const deliverable=[];
  for(const order of orders){
    const quantity=Number(order.quantity??order.amount??0);
    const delivered=Number(order.delivered??order.deliveredQuantity??order.fulfilledQuantity??order.deliveredAmount??0);
    const reserved=Number(order.reserved||0);
    const remaining=Math.max(0,quantity-delivered-reserved);
    const available=Math.min(remaining,finishedAvailable(this,order));
    if(available>0)deliverable.push({order,available});
  }
  if(!deliverable.length)return;
  const title=this.el("div",i18n.t("customer.deliverable_title"));
  Object.assign(title.style,{fontWeight:700,marginTop:"12px"});
  card.append(title);
  for(const {order,available} of deliverable){
    const product=this.label(order.product||order.productId||order.itemId);
    const customer=order.customerName||order.customer?.name||"Kunde";
    card.append(this.button(i18n.t("customer.deliver_available",{
      customer,
      quantity:this.amount(available),
      product
    }),()=>deliverAvailable(this,order,available)));
  }
};
