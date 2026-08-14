// WorldProject – behaelt die gewaehlte Einkaufs-/Liefer-/Produktionsansicht bei internen Re-Renders bei.
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';
import { EconomyDashboard } from './EconomyDashboard.js';

function applyFocus(dialog, section){
  const overlay=dialog?.overlay;
  if(!overlay||!section)return;
  const wanted={
    buy:'Rohstoffe & Verpackung einkaufen',
    deliveries:'Laufende Lieferungen',
    production:'Produktionsplanung'
  }[section];
  const title={
    buy:'📦 Einkauf',
    deliveries:'🚚 Lieferungen & Transporte',
    production:'🏗️ Produktion'
  }[section];
  if(!wanted)return;
  const h2=overlay.querySelector('h2');
  if(h2&&title)h2.textContent=title;
  overlay.querySelectorAll('section').forEach(sec=>{
    const h3=sec.querySelector('h3');
    sec.style.display=h3?.textContent?.includes(wanted)?'':'none';
  });
}

const dialogProto=OperationalSupplyChainDialog.prototype;
if(!dialogProto.__worldSectionPersistenceIntegrated){
  dialogProto.__worldSectionPersistenceIntegrated=true;
  const originalRender=dialogProto.render;
  dialogProto.render=function(...args){
    const result=originalRender.apply(this,args);
    applyFocus(this,this.__worldFocusedSection);
    return result;
  };
  const originalClose=dialogProto.close;
  dialogProto.close=function(...args){
    this.__worldFocusedSection=null;
    return originalClose.apply(this,args);
  };
}

const dashboardProto=EconomyDashboard.prototype;
if(!dashboardProto.__worldSectionPersistenceDashboardIntegrated){
  dashboardProto.__worldSectionPersistenceDashboardIntegrated=true;
  const originalFocus=dashboardProto.focusOperationalDialog;
  dashboardProto.focusOperationalDialog=function(section='buy'){
    const dialog=window.worldOperationalSupplyChainDialog;
    if(dialog)dialog.__worldFocusedSection=section;
    const result=originalFocus.call(this,section);
    applyFocus(dialog,section);
    return result;
  };
}

export { applyFocus };
