// WorldProject - zeigt sichtbar, wann nach einem abgeschlossenen Kundenauftrag der naechste nachrueckt.
import { EconomyDashboard } from './EconomyDashboard.js';
import { customerOrderCooldown, customerOrderCapacity } from './CustomerOrderCapacityByFleetIntegration.js';
function format(ms){const sec=Math.max(0,Math.ceil(Number(ms||0)/1000)),m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')} Min.`;}
function openOrders(company){return (company?.customerOrders||[]).filter(o=>String(o?.status||'').toLowerCase()==='open').length;}
function textFor(company){const cd=customerOrderCooldown(company),cap=customerOrderCapacity(company),open=openOrders(company);if(cd.active)return `⏳ Neue Kundenaufträge in ${format(cd.remainingMs)} · Nach einem erledigten Auftrag beträgt die Standard-Wartezeit 30 Minuten.`;if(cd.premiumBypass)return `⚡ Premium aktiv: Neue Kundenaufträge rücken ohne Wartezeit nach · aktuell ${open}/${cap.total} Auftragsplätze belegt.`;if(open<cap.total)return `✅ Neue Kundenaufträge sind jetzt verfügbar und werden automatisch nachgeladen · aktuell ${open}/${cap.total} Auftragsplätze belegt.`;return `✅ Alle ${cap.total} Auftragsplätze sind derzeit belegt. Nach einem erledigten Auftrag erscheint der Nachschub nach 30 Minuten.`;}
function styleBox(box){Object.assign(box.style,{margin:'8px 0 10px',padding:'10px 12px',borderRadius:'8px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.32)',fontSize:'12px',fontWeight:'700',lineHeight:'1.45'});}
const p=EconomyDashboard.prototype;
if(!p.__worldCustomerOrderCooldownUI){
 p.__worldCustomerOrderCooldownUI=true;
 const old=p.render;
 p.render=function(panel){const result=old.call(this,panel);queueMicrotask(()=>{const card=panel?.querySelector?.('#dashboard-customer-orders');if(!card)return;let box=card.querySelector('[data-customer-order-cooldown]');if(!box){box=this.el('div');box.dataset.customerOrderCooldown='1';styleBox(box);card.prepend(box);}box.textContent=textFor(this.company);});return result;};
 const oldOpen=p.open;
 p.open=function(...args){const result=oldOpen.apply(this,args);clearInterval(this.customerOrderCooldownTimer);this.customerOrderCooldownTimer=setInterval(()=>{if(!this.overlay?.isConnected)return;const panel=this.overlay.firstElementChild,box=panel?.querySelector?.('[data-customer-order-cooldown]');if(box)box.textContent=textFor(this.company);const cd=customerOrderCooldown(this.company);if(!cd.active&&openOrders(this.company)<customerOrderCapacity(this.company).total){const before=openOrders(this.company);this.controller?.ensureCustomerOrders?.(this.company);const after=openOrders(this.company);if(after>before&&panel)this.render(panel);}},1000);return result;};
 const oldClose=p.close;
 p.close=function(...args){clearInterval(this.customerOrderCooldownTimer);this.customerOrderCooldownTimer=null;return oldClose.apply(this,args);};
}
export function runCustomerOrderCooldownUITest(){const c={completedCustomerOrders:[]};return !customerOrderCooldown(c,{premiumUntil:0},Date.now()).active;}
