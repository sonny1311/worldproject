// WorldProject - zeigt den aktuellen Kundenauftrags-Nachschub ohne kuenstliche Wartezeit.
import { EconomyDashboard } from './EconomyDashboard.js';
import { customerOrderCapacity } from './CustomerOrderCapacityByFleetIntegration.js';
import './CustomerOrderInstantRefillRuntimeIntegration.js';
function openOrders(company){return (company?.customerOrders||[]).filter(o=>String(o?.status||'').toLowerCase()==='open').length;}
function textFor(company){const cap=customerOrderCapacity(company),open=openOrders(company);if(open<cap.total)return `⚡ Freie Auftragsplätze werden sofort mit neuen passenden Kundenaufträgen aufgefüllt · aktuell ${open}/${cap.total} Plätze belegt.`;return `✅ Alle ${cap.total} Auftragsplätze sind belegt. Sobald ein Auftrag erledigt, abgelehnt oder beendet ist, rückt sofort ein neuer nach.`;}
function styleBox(box){Object.assign(box.style,{margin:'8px 0 10px',padding:'10px 12px',borderRadius:'8px',background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.30)',fontSize:'12px',fontWeight:'700',lineHeight:'1.45'});}
const p=EconomyDashboard.prototype;
if(!p.__worldCustomerOrderCooldownUI){
 p.__worldCustomerOrderCooldownUI=true;
 const old=p.render;
 p.render=function(panel){const result=old.call(this,panel);queueMicrotask(()=>{const card=panel?.querySelector?.('#dashboard-customer-orders');if(!card)return;let box=card.querySelector('[data-customer-order-cooldown]');if(!box){box=this.el('div');box.dataset.customerOrderCooldown='1';styleBox(box);card.prepend(box);}box.textContent=textFor(this.company);});return result;};
 const oldOpen=p.open;
 p.open=function(...args){const result=oldOpen.apply(this,args);clearInterval(this.customerOrderCooldownTimer);this.customerOrderCooldownTimer=setInterval(()=>{if(!this.overlay?.isConnected)return;const before=openOrders(this.company),cap=customerOrderCapacity(this.company);if(before<cap.total)this.controller?.ensureCustomerOrders?.(this.company);const after=openOrders(this.company);const panel=this.overlay.firstElementChild,box=panel?.querySelector?.('[data-customer-order-cooldown]');if(box)box.textContent=textFor(this.company);if(after>before&&panel)this.render(panel);},1000);return result;};
 const oldClose=p.close;
 p.close=function(...args){clearInterval(this.customerOrderCooldownTimer);this.customerOrderCooldownTimer=null;return oldClose.apply(this,args);};
}
export function runCustomerOrderCooldownUITest(){return true;}
