// WorldProject – zeigt die zentrale Produktions-Checkliste im bestehenden Wirtschaftsdashboard.
import { EconomyDashboard } from './EconomyDashboard.js';
import { productionReadinessChecklist } from './ProductionReadinessChecklist.js';

const icon = state => state === 'ok' ? '✅' : state === 'waiting' ? '⏳' : '❌';

function addChecklist(dashboard, card) {
  card.querySelector('.world-production-readiness-checklist')?.remove();
  let rows;
  try { rows = productionReadinessChecklist(dashboard.company); }
  catch (error) { console.warn('Produktions-Checkliste nicht verfügbar', error); return; }
  if (!rows.length) return;

  const box = dashboard.el('div');
  box.className = 'world-production-readiness-checklist';
  Object.assign(box.style,{marginTop:'12px',padding:'11px',borderRadius:'9px',background:'rgba(0,0,0,.18)',border:'1px solid rgba(255,255,255,.12)'});
  box.append(dashboard.el('strong','🧭 Was brauche ich noch?'),dashboard.small('Reihenfolge: zuerst Anlage, danach Personal, danach Rohstoffe und Verpackung.'));
  for (const row of rows.slice(0,8)) {
    const item = dashboard.el('div');
    Object.assign(item.style,{marginTop:'9px',paddingTop:'8px',borderTop:'1px solid rgba(255,255,255,.08)'});
    const title=dashboard.el('div',`${row.ready?'✅':'🔧'} ${String(row.product).replace(/_/g,' ')}`);
    title.style.fontWeight='700';
    item.append(title);
    for (const stage of row.stages) item.append(dashboard.small(`${icon(stage.state)} ${stage.label}`));
    if (row.ready) item.append(dashboard.small('Startklar – diese Produktion kann geplant werden.'));
    else if (row.nextFix) item.append(dashboard.small(`Nächster Schritt: ${row.nextFix.label}`));
    box.append(item);
  }
  if (rows.length>8) box.append(dashboard.small(`${rows.length-8} weitere Produktionswege werden in der Produktionsplanung geprüft.`));
  card.append(box);
}

const proto=EconomyDashboard.prototype;
if(!proto.__productionReadinessChecklistView){
  proto.__productionReadinessChecklistView=true;
  const originalRender=proto.render;
  proto.render=function(panel){
    const result=originalRender.call(this,panel);
    const card=panel.querySelector('#dashboard-production');
    if(card)addChecklist(this,card);
    return result;
  };
}
