// WorldProject - UI-Brücke für bestehende Kundenauftragserfüllung.
// Nutzt ausschließlich EconomyDashboard + ConnectedEconomyGameplay.deliverCustomerOrder().
import { EconomyDashboard } from "./EconomyDashboard.js";
import { i18n } from "./InternationalizationSystem.js";

i18n.addDictionary("de",{"customer.deliverable_title":"Auslieferbare Fertigware","customer.deliver_available":"{customer}: {quantity} {product} ausliefern","customer.delivery_success":"{quantity} erfolgreich ausgeliefert und abgerechnet.","customer.delivery_failed":"Auslieferung nicht möglich: {reason}","customer.deadline":"Lieferfrist: {date}","customer.deadline_remaining":"Noch {time} bis zur Lieferfrist","customer.deadline_late":"Verspätet seit {time}","customer.late_penalty":"Verspätungsabzug: {amount} je fehlender Einheit"});
i18n.addDictionary("en",{"customer.deliverable_title":"Finished goods ready for delivery","customer.deliver_available":"Deliver {quantity} {product} to {customer}","customer.delivery_success":"{quantity} delivered and settled successfully.","customer.delivery_failed":"Delivery failed: {reason}","customer.deadline":"Delivery deadline: {date}","customer.deadline_remaining":"{time} remaining until deadline","customer.deadline_late":"Overdue by {time}","customer.late_penalty":"Late deduction: {amount} per missing unit"});
i18n.addDictionary("es",{"customer.deliverable_title":"Productos terminados listos para entregar","customer.deliver_available":"Entregar {quantity} {product} a {customer}","customer.delivery_success":"{quantity} entregados y liquidados correctamente.","customer.delivery_failed":"No se pudo realizar la entrega: {reason}","customer.deadline":"Fecha límite de entrega: {date}","customer.deadline_remaining":"Quedan {time} hasta la fecha límite","customer.deadline_late":"Retraso de {time}","customer.late_penalty":"Deducción por retraso: {amount} por unidad faltante"});
i18n.addDictionary("zh",{"customer.deliverable_title":"可交付成品","customer.deliver_available":"向 {customer} 交付 {quantity} {product}","customer.delivery_success":"已成功交付并结算 {quantity}。","customer.delivery_failed":"无法交付：{reason}","customer.deadline":"交付期限：{date}","customer.deadline_remaining":"距离交付期限还有 {time}","customer.deadline_late":"已逾期 {time}","customer.late_penalty":"逾期扣款：每缺少一单位 {amount}"});

function finishedAvailable(dashboard,order){const state=dashboard.operationsOverview.state(),product=order?.product||order?.productId||order?.itemId;return Math.max(0,Number(state.company?.operationalSupplyState?.warehouseStock?.finished?.[product]||0));}
function validTime(value){if(value instanceof Date)return Number.isFinite(value.getTime())?value.getTime():null;const numeric=Number(value);if(Number.isFinite(numeric)&&numeric>0)return numeric;const parsed=Date.parse(value);return Number.isFinite(parsed)&&parsed>0?parsed:null;}
function duration(ms){const mins=Math.max(1,Math.ceil(Math.abs(ms)/60000)),days=Math.floor(mins/1440),hours=Math.floor((mins%1440)/60),rest=mins%60;if(days)return `${days} d ${hours} h`;if(hours)return `${hours} h ${rest} min`;return `${rest} min`;}
function deadline(order){const due=validTime(order?.dueAt??order?.deliveryDeadline??order?.deadline);if(!due)return null;const delta=due-Date.now();return{due,delta,late:delta<0,penalty:Number(order?.penaltyPerMissing??order?.latePenaltyPerUnit??0)||0};}
async function deliverAvailable(dashboard,order,amount){const state=dashboard.operationsOverview.state(),company=state.company;if(!company||!order?.id||!(amount>0))return;const result=await dashboard.controller.deliverCustomerOrder(company,order.id,amount);if(!result?.success){alert(i18n.t("customer.delivery_failed",{reason:result?.reason||i18n.t("time.unknown")}));return;}alert(i18n.t("customer.delivery_success",{quantity:dashboard.amount(result.accepted??amount)}));const panel=dashboard.overlay?.firstElementChild;if(panel)dashboard.render(panel);}

const originalRender=EconomyDashboard.prototype.render;
EconomyDashboard.prototype.render=function(panel){
  originalRender.call(this,panel);
  if(this.company?.setupPhase&&this.company.setupPhase!=="operating")return;
  const card=this.overlay?.querySelector?.("#dashboard-customer-orders");if(!card)return;
  const orders=this.operationsOverview.openCustomerOrders(),deliverable=[];
  for(const order of orders){
    const quantity=Number(order.quantity??order.amount??0),delivered=Number(order.delivered??order.deliveredQuantity??order.fulfilledQuantity??order.deliveredAmount??0),reserved=Number(order.reserved||0),remaining=Math.max(0,quantity-delivered-reserved),available=Math.min(remaining,finishedAvailable(this,order)),info=deadline(order);
    if(info){const customer=order.customerName||order.customer?.name||"Kunde",product=this.label(order.product||order.productId||order.itemId),date=new Intl.DateTimeFormat(i18n.locale,{dateStyle:"short",timeStyle:"short"}).format(new Date(info.due)),row=this.small(`${customer} · ${product} · ${i18n.t("customer.deadline",{date})}`);row.style.color=info.late?"#ff8a80":"#b9f6ca";card.append(row);const stateRow=this.small(i18n.t(info.late?"customer.deadline_late":"customer.deadline_remaining",{time:duration(info.delta)}));stateRow.style.color=row.style.color;card.append(stateRow);if(info.late&&info.penalty>0)card.append(this.small(i18n.t("customer.late_penalty",{amount:`${this.money(info.penalty)} €`})));
    }
    if(available>0)deliverable.push({order,available});
  }
  if(!deliverable.length)return;
  const title=this.el("div",i18n.t("customer.deliverable_title"));Object.assign(title.style,{fontWeight:700,marginTop:"12px"});card.append(title);
  for(const {order,available} of deliverable){const product=this.label(order.product||order.productId||order.itemId),customer=order.customerName||order.customer?.name||"Kunde";card.append(this.button(i18n.t("customer.deliver_available",{customer,quantity:this.amount(available),product}),()=>deliverAvailable(this,order,available)));}
};
