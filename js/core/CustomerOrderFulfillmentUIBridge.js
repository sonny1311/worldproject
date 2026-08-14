// WorldProject - UI-Brücke für bestehende Kundenauftragserfüllung.
// Nutzt ausschließlich EconomyDashboard + ConnectedEconomyGameplay.deliverCustomerOrder().
import { EconomyDashboard } from "./EconomyDashboard.js";
import { i18n } from "./InternationalizationSystem.js";
import { PremiumEntitlementSystem } from "./PremiumEntitlementSystem.js";

const premium=new PremiumEntitlementSystem();
const accountFor=()=>window.worldCurrentUser||window.worldAccount||{};

i18n.addDictionary("de",{
 "customer.deliverable_title":"Auslieferbare Fertigware",
 "customer.deliver_available":"{customer}: {quantity} {product} ausliefern",
 "customer.delivery_action":"Teil- oder Gesamtlieferung",
 "customer.delivery_dialog_title":"Teil- oder Gesamtlieferung",
 "customer.delivery_dialog_hint":"Gib die Menge ein, die jetzt tatsächlich ausgeliefert werden soll. Es wird niemals automatisch der gesamte Lagerbestand verwendet.",
 "customer.delivery_open":"Offene Auftragsmenge: {quantity}",
 "customer.delivery_stock":"Im Fertigwarenlager verfügbar: {quantity}",
 "customer.delivery_max":"Maximal jetzt lieferbar: {quantity}",
 "customer.delivery_quantity":"Liefermenge",
 "customer.delivery_total_fill":"Gesamten Restauftrag einsetzen",
 "customer.delivery_premium_fill":"⭐ Maximal mögliche Teillieferung vorschlagen",
 "customer.delivery_submit":"Lieferung starten",
 "customer.delivery_cancel":"Abbrechen",
 "customer.delivery_no_stock":"Für diesen Auftrag ist aktuell keine passende Fertigware im Lager verfügbar.",
 "customer.delivery_invalid":"Bitte eine Liefermenge größer als 0 und höchstens {quantity} eingeben.",
 "customer.delivery_total_unavailable":"Eine Gesamtlieferung ist noch nicht möglich, weil nicht genug Fertigware verfügbar ist.",
 "customer.produce_missing":"Fehlmenge produzieren",
 "customer.delivery_success":"{quantity} erfolgreich ausgeliefert und abgerechnet.",
 "customer.delivery_failed":"Auslieferung nicht möglich: {reason}",
 "customer.deadline":"Lieferfrist: {date}",
 "customer.deadline_remaining":"Noch {time} bis zur Lieferfrist",
 "customer.deadline_late":"Verspätet seit {time}",
 "customer.late_penalty":"Verspätungsabzug: {amount} je fehlender Einheit",
 "customer.remaining":"Noch zu liefern: {remaining} von {total}",
 "customer.unit_price":"Preis je Einheit: {price}",
 "customer.order_value":"Auftragswert: {value}",
 "customer.remaining_value":"Noch offener Erlös: {value}"
});
i18n.addDictionary("en",{
 "customer.deliverable_title":"Finished goods ready for delivery",
 "customer.deliver_available":"Deliver {quantity} {product} to {customer}",
 "customer.delivery_action":"Partial or full delivery",
 "customer.delivery_dialog_title":"Partial or full delivery",
 "customer.delivery_dialog_hint":"Enter the quantity you actually want to deliver now. The complete warehouse stock is never used automatically.",
 "customer.delivery_open":"Open order quantity: {quantity}",
 "customer.delivery_stock":"Available finished goods: {quantity}",
 "customer.delivery_max":"Maximum deliverable now: {quantity}",
 "customer.delivery_quantity":"Delivery quantity",
 "customer.delivery_total_fill":"Use complete remaining order",
 "customer.delivery_premium_fill":"⭐ Suggest maximum partial delivery",
 "customer.delivery_submit":"Start delivery",
 "customer.delivery_cancel":"Cancel",
 "customer.delivery_no_stock":"No matching finished goods are currently available for this order.",
 "customer.delivery_invalid":"Enter a delivery quantity above 0 and no more than {quantity}.",
 "customer.delivery_total_unavailable":"Full delivery is not possible yet because there are not enough finished goods available.",
 "customer.produce_missing":"Produce missing quantity",
 "customer.delivery_success":"{quantity} delivered and settled successfully.",
 "customer.delivery_failed":"Delivery failed: {reason}",
 "customer.deadline":"Delivery deadline: {date}",
 "customer.deadline_remaining":"{time} remaining until deadline",
 "customer.deadline_late":"Overdue by {time}",
 "customer.late_penalty":"Late deduction: {amount} per missing unit",
 "customer.remaining":"Still to deliver: {remaining} of {total}",
 "customer.unit_price":"Unit price: {price}",
 "customer.order_value":"Order value: {value}",
 "customer.remaining_value":"Outstanding revenue: {value}"
});
i18n.addDictionary("es",{
 "customer.deliverable_title":"Productos terminados listos para entregar",
 "customer.deliver_available":"Entregar {quantity} {product} a {customer}",
 "customer.delivery_action":"Entrega parcial o total",
 "customer.delivery_dialog_title":"Entrega parcial o total",
 "customer.delivery_dialog_hint":"Introduce la cantidad que realmente quieres entregar ahora. Nunca se utilizará automáticamente todo el inventario.",
 "customer.delivery_open":"Cantidad pendiente del pedido: {quantity}",
 "customer.delivery_stock":"Productos terminados disponibles: {quantity}",
 "customer.delivery_max":"Máximo entregable ahora: {quantity}",
 "customer.delivery_quantity":"Cantidad a entregar",
 "customer.delivery_total_fill":"Usar todo el pedido restante",
 "customer.delivery_premium_fill":"⭐ Sugerir la entrega parcial máxima",
 "customer.delivery_submit":"Iniciar entrega",
 "customer.delivery_cancel":"Cancelar",
 "customer.delivery_no_stock":"Actualmente no hay productos terminados adecuados para este pedido.",
 "customer.delivery_invalid":"Introduce una cantidad superior a 0 y como máximo {quantity}.",
 "customer.delivery_total_unavailable":"La entrega total aún no es posible porque no hay suficientes productos terminados.",
 "customer.produce_missing":"Producir cantidad faltante",
 "customer.delivery_success":"{quantity} entregados y liquidados correctamente.",
 "customer.delivery_failed":"No se pudo realizar la entrega: {reason}",
 "customer.deadline":"Fecha límite de entrega: {date}",
 "customer.deadline_remaining":"Quedan {time} hasta la fecha límite",
 "customer.deadline_late":"Retraso de {time}",
 "customer.late_penalty":"Deducción por retraso: {amount} por unidad faltante",
 "customer.remaining":"Pendiente de entrega: {remaining} de {total}",
 "customer.unit_price":"Precio por unidad: {price}",
 "customer.order_value":"Valor del pedido: {value}",
 "customer.remaining_value":"Ingresos pendientes: {value}"
});
i18n.addDictionary("zh",{
 "customer.deliverable_title":"可交付成品",
 "customer.deliver_available":"向 {customer} 交付 {quantity} {product}",
 "customer.delivery_action":"部分或全部交付",
 "customer.delivery_dialog_title":"部分或全部交付",
 "customer.delivery_dialog_hint":"请输入现在实际要交付的数量。系统不会自动使用全部库存。",
 "customer.delivery_open":"订单剩余数量：{quantity}",
 "customer.delivery_stock":"成品库存可用：{quantity}",
 "customer.delivery_max":"当前最多可交付：{quantity}",
 "customer.delivery_quantity":"交付数量",
 "customer.delivery_total_fill":"填入全部剩余订单量",
 "customer.delivery_premium_fill":"⭐ 建议最大部分交付量",
 "customer.delivery_submit":"开始交付",
 "customer.delivery_cancel":"取消",
 "customer.delivery_no_stock":"当前没有适用于此订单的成品库存。",
 "customer.delivery_invalid":"请输入大于 0 且不超过 {quantity} 的交付数量。",
 "customer.delivery_total_unavailable":"当前成品不足，暂时无法全部交付。",
 "customer.produce_missing":"生产缺少数量",
 "customer.delivery_success":"已成功交付并结算 {quantity}。",
 "customer.delivery_failed":"无法交付：{reason}",
 "customer.deadline":"交付期限：{date}",
 "customer.deadline_remaining":"距离交付期限还有 {time}",
 "customer.deadline_late":"已逾期 {time}",
 "customer.late_penalty":"逾期扣款：每缺少一单位 {amount}",
 "customer.remaining":"待交付：{remaining} / {total}",
 "customer.unit_price":"单价：{price}",
 "customer.order_value":"订单金额：{value}",
 "customer.remaining_value":"待收收入：{value}"
});

function finishedAvailable(dashboard,order){const state=dashboard.operationsOverview.state(),product=order?.product||order?.productId||order?.itemId;return Math.max(0,Number(state.company?.operationalSupplyState?.warehouseStock?.finished?.[product]||0));}
function validTime(value){if(value instanceof Date)return Number.isFinite(value.getTime())?value.getTime():null;const numeric=Number(value);if(Number.isFinite(numeric)&&numeric>0)return numeric;const parsed=Date.parse(value);return Number.isFinite(parsed)&&parsed>0?parsed:null;}
function duration(ms){const mins=Math.max(1,Math.ceil(Math.abs(ms)/60000)),days=Math.floor(mins/1440),hours=Math.floor((mins%1440)/60),rest=mins%60;if(days)return `${days} d ${hours} h`;if(hours)return `${hours} h ${rest} min`;return `${rest} min`;}
function deadline(order){const due=validTime(order?.dueAt??order?.deliveryDeadline??order?.deadline);if(!due)return null;const delta=due-Date.now();return{due,delta,late:delta<0,penalty:Number(order?.penaltyPerMissing??order?.latePenaltyPerUnit??0)||0};}
export function customerOrderPresentation(order={}){const total=Math.max(0,Number(order.quantity??order.amount??0)||0),delivered=Math.max(0,Number(order.delivered??order.deliveredQuantity??order.fulfilledQuantity??order.deliveredAmount??0)||0),reserved=Math.max(0,Number(order.reserved||0)||0),remaining=Math.max(0,total-delivered-reserved),unitPrice=Math.max(0,Number(order.unitPrice??order.pricePerUnit??order.price??0)||0);return{total,delivered,reserved,remaining,unitPrice,totalValue:total*unitPrice,remainingValue:remaining*unitPrice};}
export function deliveryQuantityLimits(order={},available=0){const summary=customerOrderPresentation(order),stock=Math.max(0,Number(available)||0),maximum=Math.min(summary.remaining,stock);return{...summary,available:stock,maximum};}

async function deliverChosenAmount(dashboard,order,amount){const state=dashboard.operationsOverview.state(),company=state.company;if(!company||!order?.id||!(amount>0))return false;const result=await dashboard.controller.deliverCustomerOrder(company,order.id,amount);if(!result?.success){alert(i18n.t("customer.delivery_failed",{reason:result?.reason||i18n.t("time.unknown")}));return false;}alert(i18n.t("customer.delivery_success",{quantity:dashboard.amount(result.accepted??amount)}));const panel=dashboard.overlay?.firstElementChild;if(panel)dashboard.render(panel);return true;}

export function openCustomerDeliveryQuantityDialog(dashboard,order){
 const customer=order.customerName||order.customer?.name||order.customer||"Kunde",product=dashboard.label(order.product||order.productId||order.itemId),limits=deliveryQuantityLimits(order,finishedAvailable(dashboard,order));
 const ov=dashboard.el("div");Object.assign(ov.style,{position:"fixed",inset:0,zIndex:32000,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:"18px"});
 const panel=dashboard.el("div");Object.assign(panel.style,{width:"min(520px,95vw)",background:"#1d232b",color:"#fff",borderRadius:"14px",padding:"20px",boxShadow:"0 20px 70px rgba(0,0,0,.55)",fontFamily:"Arial,sans-serif"});ov.append(panel);
 const head=dashboard.el("div");Object.assign(head.style,{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px"});const title=dashboard.el("strong",i18n.t("customer.delivery_dialog_title"));title.style.fontSize="20px";head.append(title,dashboard.button("✕",()=>ov.remove()));panel.append(head, dashboard.small(`${customer} · ${product}`), dashboard.small(i18n.t("customer.delivery_dialog_hint")));
 const facts=dashboard.el("div");Object.assign(facts.style,{margin:"14px 0",padding:"12px",background:"rgba(255,255,255,.07)",borderRadius:"9px"});facts.append(dashboard.stockRow(i18n.t("customer.delivery_open",{quantity:""}).replace(/:\s*$/,""),dashboard.amount(limits.remaining)),dashboard.stockRow(i18n.t("customer.delivery_stock",{quantity:""}).replace(/:\s*$/,""),dashboard.amount(limits.available)),dashboard.stockRow(i18n.t("customer.delivery_max",{quantity:""}).replace(/:\s*$/,""),dashboard.amount(limits.maximum)));panel.append(facts);
 if(!(limits.maximum>0)){const warning=dashboard.el("div",i18n.t("customer.delivery_no_stock"));Object.assign(warning.style,{padding:"10px",borderRadius:"8px",background:"rgba(255,152,0,.16)",border:"1px solid rgba(255,193,7,.55)",marginBottom:"12px"});panel.append(warning);}
 const field=dashboard.el("label");Object.assign(field.style,{display:"grid",gap:"6px",fontWeight:"700",margin:"12px 0"});field.append(document.createTextNode(i18n.t("customer.delivery_quantity")));const input=dashboard.el("input");input.type="number";input.min="0.01";input.step="any";input.max=String(limits.maximum);input.placeholder=limits.maximum>0?`max. ${dashboard.amount(limits.maximum)}`:"0";Object.assign(input.style,{padding:"11px",borderRadius:"8px",border:"1px solid #6b7280",fontSize:"16px"});field.append(input);panel.append(field);
 const actions=dashboard.el("div");Object.assign(actions.style,{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"12px"});
 const full=dashboard.button(i18n.t("customer.delivery_total_fill"),()=>{if(limits.available<limits.remaining){alert(i18n.t("customer.delivery_total_unavailable"));return;}input.value=String(limits.remaining);input.focus();});if(limits.available<limits.remaining){full.style.opacity=".55";full.title=i18n.t("customer.delivery_total_unavailable");}
 actions.append(full);
 if(premium.canUseSmartDeliveryQuantity(accountFor())&&limits.maximum>0){const smart=dashboard.button(i18n.t("customer.delivery_premium_fill"),()=>{input.value=String(limits.maximum);input.focus();});smart.style.background="#ffe082";actions.append(smart);}
 const submit=dashboard.button(i18n.t("customer.delivery_submit"),async()=>{const amount=Number(input.value);if(!(amount>0)||amount>limits.maximum){alert(i18n.t("customer.delivery_invalid",{quantity:dashboard.amount(limits.maximum)}));return;}submit.disabled=true;submit.style.opacity=".6";const ok=await deliverChosenAmount(dashboard,order,amount);if(ok)ov.remove();else{submit.disabled=false;submit.style.opacity="1";}});if(!(limits.maximum>0)){submit.disabled=true;submit.style.opacity=".5";}
 actions.append(submit,dashboard.button(i18n.t("customer.delivery_cancel"),()=>ov.remove()));panel.append(actions);document.body.append(ov);input.focus();return ov;
}

function appendDeadline(dashboard,box,order){const info=deadline(order);if(!info)return;const date=new Intl.DateTimeFormat(i18n.locale,{dateStyle:"short",timeStyle:"short"}).format(new Date(info.due)),row=dashboard.small(i18n.t("customer.deadline",{date}));row.style.color=info.late?"#ff8a80":"#b9f6ca";box.append(row);const stateRow=dashboard.small(i18n.t(info.late?"customer.deadline_late":"customer.deadline_remaining",{time:duration(info.delta)}));stateRow.style.color=row.style.color;box.append(stateRow);if(info.late&&info.penalty>0)box.append(dashboard.small(i18n.t("customer.late_penalty",{amount:`${dashboard.money(info.penalty)} €`})));}

const originalRender=EconomyDashboard.prototype.render;
EconomyDashboard.prototype.render=function(panel){
 originalRender.call(this,panel);
 if(this.company?.setupPhase&&this.company.setupPhase!=="operating")return;
 const card=this.overlay?.querySelector?.("#dashboard-customer-orders");if(!card)return;
 const orders=this.operationsOverview.openCustomerOrders();card.innerHTML="";const heading=this.el("div","📋 Kundenaufträge");Object.assign(heading.style,{fontWeight:700,marginBottom:"10px",fontSize:"17px"});card.append(heading);
 if(!orders.length){card.append(this.small("Keine offenen Kundenaufträge."));return;}
 for(const order of orders){const summary=customerOrderPresentation(order),available=finishedAvailable(this,order),product=this.label(order.product||order.productId||order.itemId),customer=order.customerName||order.customer?.name||order.customer||"Kunde",box=this.el("div");Object.assign(box.style,{padding:"10px",margin:"8px 0",border:"1px solid rgba(255,255,255,.14)",borderRadius:"9px",background:"rgba(0,0,0,.10)"});box.append(this.el("strong",`${customer} · ${product}`),this.small(`${this.amount(summary.delivered)} / ${this.amount(summary.total)} erfüllt · ${this.orderStatus(order.status)}`));const price=this.small(`💶 ${i18n.t("customer.unit_price",{price:`${this.money(summary.unitPrice)} €`})} · ${i18n.t("customer.order_value",{value:`${this.money(summary.totalValue)} €`})}`);price.style.color="#b9f6ca";box.append(price,this.small(`${i18n.t("customer.remaining",{remaining:this.amount(summary.remaining),total:this.amount(summary.total)})} · ${i18n.t("customer.remaining_value",{value:`${this.money(summary.remainingValue)} €`})}`));appendDeadline(this,box,order);if(summary.remaining>0){const actionRow=this.el("div");Object.assign(actionRow.style,{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"8px"});actionRow.append(this.button(i18n.t("customer.delivery_action"),()=>openCustomerDeliveryQuantityDialog(this,order)));if(available<summary.remaining)actionRow.append(this.button(i18n.t("customer.produce_missing"),()=>this.produceCustomerShortfall(order)));box.append(actionRow);}card.append(box);}
};

export function runCustomerOrderPresentationTest(){const row=customerOrderPresentation({amount:100,delivered:35,reserved:5,unitPrice:1.25});const success=row.total===100&&row.remaining===60&&row.totalValue===125&&row.remainingValue===75;if(!success)throw new Error("Kundenauftrags-Anzeige berechnet Restmenge oder Erlös falsch");const limits=deliveryQuantityLimits({amount:100,delivered:35,reserved:5,unitPrice:1.25},40);if(limits.maximum!==40||limits.remaining!==60)throw new Error("Liefermengenbegrenzung erlaubt eine unzulässige Lager-/Auftragsmenge");const capped=deliveryQuantityLimits({amount:100,delivered:90,unitPrice:1},500);if(capped.maximum!==10)throw new Error("Liefermenge wird nicht auf die offene Auftragsmenge begrenzt");return true;}
if(typeof window!=="undefined")window.runCustomerOrderPresentationTest=runCustomerOrderPresentationTest;
