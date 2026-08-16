// ORVUNO – übersichtliche Lieferungsanzeige mit Fortschritt und automatischer Einlagerung
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';

const proto=OperationalSupplyChainDialog.prototype;
if(!proto.__deliveryOverviewIntegrated){
 proto.__deliveryOverviewIntegrated=true;
 proto.renderDeliveries=function(panel,company,suppliers){
  const orders=this.orders.orders||[];
  const openOrders=orders.filter(o=>!["stored","cancelled"].includes(o.status));
  const storedToday=orders.filter(o=>o.status==="stored"&&o.storedAt&&new Date(o.storedAt).toDateString()===new Date().toDateString()).length;
  const section=this.el('section');
  const head=this.el('div');Object.assign(head.style,{display:'flex',justifyContent:'space-between',gap:'12px',alignItems:'center',flexWrap:'wrap',marginBottom:'12px'});
  const title=this.el('div');title.append(this.el('h3',`🚚 Laufende Lieferungen (${openOrders.length})`));const note=this.el('div','Angekommene Ware wird automatisch in das passende Lager eingelagert.');Object.assign(note.style,{color:'#94a3b8',fontSize:'14px'});title.append(note);
  const summary=this.el('div',`Heute automatisch eingelagert: ${storedToday}`);Object.assign(summary.style,{padding:'8px 12px',borderRadius:'999px',background:'#0f5132',color:'#d1fae5',fontWeight:'700'});head.append(title,summary);section.append(head);
  if(!openOrders.length){const empty=this.el('div','Keine offenen Lieferungen.');Object.assign(empty.style,{padding:'18px',border:'1px solid #334155',borderRadius:'10px',background:'#111827',color:'#cbd5e1'});section.append(empty);panel.append(section);return;}
  const statusIndex={ordered:0,in_transit:1,delayed:1,arrived:2,stored:3};
  for(const o of openOrders){Object.assign(o,this.normalizeOrder(o));const meta=this.materialMeta(o.material),supplier=suppliers.find(s=>s.id===o.supplierId);const current=statusIndex[o.status]??0;
   const card=this.el('div');Object.assign(card.style,{border:'1px solid #334155',borderRadius:'12px',padding:'14px',margin:'10px 0',background:'#111827',color:'#f8fafc',boxShadow:'0 6px 18px rgba(0,0,0,.18)'});
   const top=this.el('div');Object.assign(top.style,{display:'grid',gridTemplateColumns:'minmax(220px,1fr) auto',gap:'12px',alignItems:'start'});
   const left=this.el('div');const supplierName=supplier?.label||o.supplierName||o.supplierId;const strong=this.el('strong',supplierName);Object.assign(strong.style,{display:'block',fontSize:'18px',marginBottom:'3px'});left.append(strong,this.el('div',`${meta.label} · ${this.number(o.quantity)} ${meta.unit}`));
   const etaBox=this.el('div');Object.assign(etaBox.style,{padding:'8px 10px',borderRadius:'8px',background:o.status==='arrived'?'#064e3b':'#172033',minWidth:'190px'});etaBox.append(this.el('div',o.status==='arrived'?'Angekommen':'Voraussichtliche Ankunft'),this.el('strong',this.arrivalLabel(o.eta)));top.append(left,etaBox);card.append(top);
   const steps=this.el('div');Object.assign(steps.style,{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',margin:'16px 0 10px'});const labels=['Bestellt','Unterwegs','Angekommen','Eingelagert'];labels.forEach((label,i)=>{const step=this.el('div');Object.assign(step.style,{textAlign:'center',padding:'9px 5px',borderRadius:'8px',background:i<current?'#14532d':i===current?'#1d4ed8':'#1e293b',color:i<=current?'#fff':'#94a3b8',fontWeight:'700'});step.textContent=`${i<current?'✓ ':i===current?'● ':''}${label}`;steps.append(step);});card.append(steps);
   const status=this.el('div');Object.assign(status.style,{padding:'10px 12px',borderRadius:'8px',background:o.status==='arrived'?'#052e16':'#172033',color:o.status==='arrived'?'#86efac':'#cbd5e1'});
   if(o.status==='arrived')status.textContent='✓ Lieferung ist angekommen. Automatische Einlagerung läuft – kein Klick nötig.';
   else if(o.status==='delayed')status.textContent=`⚠ Lieferung verspätet · Restzeit ${this.remaining(o.eta)}`;
   else status.textContent=`Restzeit ${this.remaining(o.eta)} · Die Ware wird bei Ankunft automatisch eingelagert.`;
   card.append(status);section.append(card);
  }
  panel.append(section);
 };
}

export function runDeliveryOverviewUITest(){if(typeof OperationalSupplyChainDialog.prototype.renderDeliveries!=='function')throw new Error('Lieferübersicht fehlt');return true;}
