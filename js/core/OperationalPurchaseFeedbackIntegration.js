// WorldProject – sichtbare, automatisch verschwindende Bestellbestätigung im vorhandenen Einkaufsdialog.
// Ändert keine Einkaufslogik; meldet nur tatsächlich neu angelegte Bestellungen zurück.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const proto=OperationalSupplyChainDialog.prototype;

if(!proto.__worldPurchaseFeedbackIntegrated){
  proto.__worldPurchaseFeedbackIntegrated=true;

  proto.showPurchaseToast=function(message='✅ Bestellung ausgelöst'){
    if(!this.overlay)return;
    this.overlay.querySelector('.world-purchase-toast')?.remove();
    const toast=this.el('div',message);
    toast.className='world-purchase-toast';
    Object.assign(toast.style,{
      position:'fixed',
      top:'28px',
      right:'28px',
      zIndex:'26000',
      maxWidth:'420px',
      padding:'13px 18px',
      borderRadius:'10px',
      background:'#167c3a',
      color:'#fff',
      fontWeight:'700',
      fontSize:'15px',
      boxShadow:'0 8px 28px rgba(0,0,0,.28)',
      opacity:'0',
      transform:'translateY(-8px)',
      transition:'opacity .18s ease, transform .18s ease',
      pointerEvents:'none'
    });
    this.overlay.append(toast);
    requestAnimationFrame(()=>{toast.style.opacity='1';toast.style.transform='translateY(0)';});
    clearTimeout(this.purchaseToastTimer);
    this.purchaseToastTimer=setTimeout(()=>{
      toast.style.opacity='0';
      toast.style.transform='translateY(-8px)';
      setTimeout(()=>toast.remove(),220);
    },2600);
  };

  const originalOpen=proto.open;
  proto.open=async function(...args){
    const result=await originalOpen.apply(this,args);
    if(!this.overlay||this.overlay.__worldPurchaseFeedbackBound)return result;
    this.overlay.__worldPurchaseFeedbackBound=true;

    this.overlay.addEventListener('click',event=>{
      const button=event.target?.closest?.('button');
      if(!button||button.textContent?.trim()!=='Kaufen')return;
      const before=this.orders?.orders?.length||0;

      // Die vorhandene onclick-Logik darf zuerst vollständig laufen.
      setTimeout(()=>{
        const after=this.orders?.orders?.length||0;
        if(after<=before)return;
        const order=this.orders.orders[after-1];
        const meta=this.materialMeta?.(order?.material)||{};
        const label=meta.label||order?.material||'Artikel';
        const unit=meta.unit||'';
        const quantity=this.number?.(order?.quantity)??String(order?.quantity??'');
        this.showPurchaseToast(`✅ ${quantity}${unit?' '+unit:''} ${label} bestellt`);
      },0);
    },true);
    return result;
  };

  const originalClose=proto.close;
  proto.close=function(...args){
    clearTimeout(this.purchaseToastTimer);
    this.purchaseToastTimer=null;
    return originalClose.apply(this,args);
  };
}
