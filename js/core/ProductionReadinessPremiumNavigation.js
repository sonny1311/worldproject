// WorldProject – Premium-Komfort: direkte Navigation aus der Produktions-Checkliste.
// Führt keine Käufe/Einstellungen selbst aus, sondern öffnet nur den passenden bestehenden Bereich.
import { EconomyDashboard } from './EconomyDashboard.js';
import { productionReadinessChecklist } from './ProductionReadinessChecklist.js';
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';

const premium = new PremiumEntitlementSystem();
const accountFor = dashboard => dashboard?.account || globalThis.window?.worldCurrentUser || globalThis.window?.worldAccount || {};

function findPersonnelArea(root){
  const nodes=[...root.querySelectorAll('div,section,article')];
  return nodes.filter(el=>/personal|mitarbeiter|belegschaft/i.test(el.textContent||'')&&el.querySelector('select,button,input')).sort((a,b)=>(a.textContent||'').length-(b.textContent||'').length)[0]||null;
}

async function openDestination(dashboard,kind){
  if(kind==='procure'){await dashboard.openOperationalSupplyChain('buy');return;}
  if(kind==='buy_equipment'){await dashboard.openOperationalSupplyChain('production');return;}
  if(kind==='hire'){
    const target=findPersonnelArea(dashboard.overlay||document);
    if(target)target.scrollIntoView({behavior:'smooth',block:'center'});
    else alert('Bitte öffne den Personalbereich.');
  }
}

function addPremiumNavigation(dashboard,card){
  if(!premium.canUseGuidedSetupNavigation(accountFor(dashboard)))return;
  let rows;try{rows=productionReadinessChecklist(dashboard.company);}catch{return;}
  const items=[...card.querySelectorAll('.world-production-readiness-checklist > div')];
  rows.slice(0,8).forEach((row,index)=>{
    if(row.ready||!row.nextFix)return;
    const item=items[index];if(!item||item.querySelector('.production-readiness-premium-link'))return;
    const label=row.nextFix.kind==='procure'?'⭐ Zum Einkauf':row.nextFix.kind==='hire'?'⭐ Zum Personal':'⭐ Zur Anlage';
    const button=dashboard.button(label,()=>openDestination(dashboard,row.nextFix.kind));
    button.classList.add('production-readiness-premium-link');
    Object.assign(button.style,{padding:'6px 9px',fontSize:'11px'});
    item.append(button);
  });
}

const proto=EconomyDashboard.prototype;
if(!proto.__productionReadinessPremiumNavigation){
  proto.__productionReadinessPremiumNavigation=true;
  const originalRender=proto.render;
  proto.render=function(panel){
    const result=originalRender.call(this,panel);
    const card=panel.querySelector('#dashboard-production');
    if(card)addPremiumNavigation(this,card);
    return result;
  };
}
