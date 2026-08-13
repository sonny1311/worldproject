// WorldProject – zeigt Stück-/Einheitspreis und Gesamtauftragswert direkt bei Kundenaufträgen.
import { EconomyDashboard } from './EconomyDashboard.js';

const proto=EconomyDashboard.prototype;
if(!proto.__worldCustomerOrderPricingIntegrated){
  proto.__worldCustomerOrderPricingIntegrated=true;
  const originalRender=proto.render;
  proto.render=function(panel){
    const result=originalRender.call(this,panel);
    queueMicrotask(()=>{
      const card=panel?.querySelector?.('#dashboard-customer-orders');
      if(!card)return;
      card.querySelectorAll('.world-customer-order-price').forEach(x=>x.remove());
      const orders=this.operationsOverview?.openCustomerOrders?.()||[];
      const headings=[...card.querySelectorAll('strong')];
      orders.forEach((o,index)=>{
        const qty=Number(o.quantity??o.amount??0)||0;
        const unitPrice=Number(o.unitPrice??o.pricePerUnit??o.price??0)||0;
        const total=Number(o.totalValue??o.orderValue??(qty*unitPrice))||0;
        const unit=String(o.unit||'Einheit');
        const anchor=headings[index];
        if(!anchor)return;
        const line=this.small(`💶 Preis: ${this.money(unitPrice)} € / ${unit} · Auftragswert: ${this.money(total)} €`);
        line.classList.add('world-customer-order-price');
        Object.assign(line.style,{opacity:'1',fontWeight:'700',color:'#c9f7cc'});
        const status=anchor.nextElementSibling;
        (status||anchor).insertAdjacentElement('afterend',line);
      });
    });
    return result;
  };
}
