// WorldProject - zeigt die voraussichtlichen Transportkosten direkt am Kundenauftrag.
// Ohne eigenen freien Lkw wird die Fremdspedition sichtbar; mit eigenem Lkw werden dessen Betriebskosten angezeigt.
import { customerDeliveryEconomics } from './CustomerFreightEconomySystem.js';

const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const company=()=>window.worldPlayerCompany||window.worldActiveServerCompany||window.worldEngine?.company||null;
const remaining=o=>Math.max(0,n(o?.quantity??o?.amount)-n(o?.delivered??o?.deliveredQuantity??o?.fulfilledQuantity));
const money=v=>`${n(v).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} €`;

function openOrders(c){return(c?.customerOrders||[]).filter(o=>remaining(o)>0&&!['completed','cancelled','delivered','closed'].includes(String(o.status||'').toLowerCase()));}
function customerCards(){
 const root=document.getElementById('world-home-dashboard');if(!root)return[];
 return[...root.querySelectorAll('div')].filter(el=>{
  const first=el.firstElementChild;
  const text=first?.textContent||'';
  return /Kundenauftrag|Eilauftrag/.test(text)&&/Ware:/.test(el.textContent||'');
 });
}
function renderPreview(card,order,c){
 let box=card.querySelector(':scope > [data-world-customer-freight-preview]');
 if(!box){
  box=document.createElement('div');box.dataset.worldCustomerFreightPreview='1';
  Object.assign(box.style,{marginTop:'9px',padding:'9px 10px',border:'1px solid #334155',borderRadius:'8px',background:'#0b1220',color:'#dbeafe',lineHeight:'1.45'});
  const actions=[...card.children].find(x=>x.querySelector?.('button'));
  if(actions)card.insertBefore(box,actions);else card.append(box);
 }
 const qty=remaining(order),urgent=Boolean(order?.urgent||order?.isUrgent||String(order?.kind||'').includes('urgent'));
 const e=customerDeliveryEconomics(c,order,{quantity:qty,urgent}),own=e.own,quote=own||e.external,mode=own?'Eigener Lkw':'Fremdspedition';
 const net=Math.max(0,e.revenue-n(quote?.cost));
 const ownHint=own
  ? `<br><span style="color:#86efac">Ersparnis gegenüber Fremdspedition: <b>${money(e.savingWithOwnFleet)}</b></span>`
  : '<br><span style="color:#fbbf24">Kein eigener freier Lkw – Fremdspedition wird bei Lieferung automatisch berechnet.</span>';
 const html=`🚚 Transportart: <b>${mode}</b><br>Entfernung: <b>${n(e.distanceKm).toLocaleString('de-DE',{maximumFractionDigits:1})} km</b><br>Transportkosten: <b>${money(quote?.cost)}</b><br>Auftragswert: <b>${money(e.revenue)}</b><br>Nach Transport: <b>${money(net)}</b>${ownHint}`;
 if(box.innerHTML!==html)box.innerHTML=html;
}
function apply(){
 const c=company();if(!c)return false;
 const orders=openOrders(c),cards=customerCards();
 cards.slice(0,orders.length).forEach((card,i)=>renderPreview(card,orders[i],c));
 return cards.length>0;
}
function install(){
 if(typeof document==='undefined')return;
 const run=()=>setTimeout(apply,0);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
 for(const ev of ['worldproject:company-loaded','worldproject:company-switched','worldproject:company-activated','world:game-state-dirty','world:customer-order-updated'])window.addEventListener(ev,run);
 setTimeout(apply,300);setTimeout(apply,900);setTimeout(apply,1800);
 // Bewusst kein MutationObserver: der hatte zuvor eine DOM-Endlosschleife verursacht.
 setInterval(apply,1500);
}
install();
if(typeof window!=='undefined')window.worldCustomerOrderFreightPreview={apply};
