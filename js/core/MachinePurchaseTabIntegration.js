// WorldProject – zentraler Maschinenkauf als eigener Reiter der bestehenden Betriebsverwaltung.
// Nutzt ausschließlich IndustryEquipmentMarketplace und OperationalSupplyChainDialog.
import './IndustryEquipmentCatalogSupplement.js';
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';
import { EconomyDashboard } from './EconomyDashboard.js';
import { visibleEquipmentMarketplace,buyIndustryEquipment,persistIndustryEquipment } from './IndustryEquipmentMarketplace.js';
import { recipesForCompany } from './OperationalSupplyChainSystem.js';
import { compatibleMachineIds } from './IndustryMachineCompatibility.js';

const SECTION_TITLES={
  buy:['Rohstoffe & Verpackung einkaufen'],
  deliveries:['Laufende Lieferungen'],
  warehouse:['Lagerbestand'],
  machines:['Maschinenkauf'],
  production:['Produktionsplanung','Produktionswarteschlange']
};
const WINDOW_TITLES={
  buy:'📦 Einkauf',deliveries:'🚚 Lieferungen & Transporte',warehouse:'🏬 Lager',machines:'⚙️ Maschinenkauf',production:'🏗️ Produktion'
};

function applySectionFocus(dialog,section){
  const overlay=dialog?.overlay,wanted=SECTION_TITLES[section];
  if(!overlay||!wanted)return false;
  const h2=overlay.querySelector('h2');if(h2)h2.textContent=WINDOW_TITLES[section]||'📦 Betrieb';
  overlay.querySelectorAll('section').forEach(sec=>{
    const text=sec.querySelector('h3')?.textContent||'';
    sec.style.display=wanted.some(title=>text.includes(title))?'':'none';
  });
  overlay.querySelectorAll('[data-operational-tab]').forEach(btn=>{
    const active=btn.dataset.operationalTab===section;
    btn.setAttribute('aria-pressed',active?'true':'false');
    Object.assign(btn.style,{fontWeight:active?'800':'600',outline:active?'2px solid #2463eb':'none',background:active?'#eef4ff':'#fff'});
  });
  return true;
}

function machineUsage(company,item,recipes){
  return recipes.filter(recipe=>compatibleMachineIds(company,recipe.machineType).includes(item.id)).map(recipe=>recipe.label||recipe.id);
}

function purchaseSnapshot(company){
  return {
    money:Number(company.money||0),
    setupPhase:company.setupPhase,
    setup_phase:company.setup_phase,
    buildingState:structuredClone(company.buildingState||company.building_state||{}),
    costLedger:structuredClone(company.costLedger||[]),
    requestIds:structuredClone(company.equipmentPurchaseRequestIds||[])
  };
}
function restorePurchaseSnapshot(company,snapshot){
  company.money=snapshot.money;
  company.setupPhase=snapshot.setupPhase;
  company.setup_phase=snapshot.setup_phase;
  company.buildingState=snapshot.buildingState;
  company.costLedger=snapshot.costLedger;
  company.equipmentPurchaseRequestIds=snapshot.requestIds;
}

function renderMachineMarket(dialog,panel,company,recipes){
  const section=dialog.el('section');section.className='world-machine-purchase-section';
  section.append(dialog.el('h3','Maschinenkauf'),dialog.el('p','Hier findest du zentral alle Maschinen und Betriebsausstattungen, die für deinen aktuellen Betriebslevel freigeschaltet sind. Fehlende Produktionsmaschinen werden direkt mit ihrem Einsatzzweck angezeigt.'));
  const market=visibleEquipmentMarketplace(company).sort((a,b)=>Number(b.required&&!b.owned)-Number(a.required&&!a.owned)||Number(a.owned)-Number(b.owned)||Number(a.price||0)-Number(b.price||0));
  if(!market.length){section.append(dialog.el('p','Für dieses Gewerbe sind auf deinem aktuellen Betriebslevel noch keine kaufbaren Maschinen verfügbar.'));panel.append(section);return;}
  for(const item of market){
    const row=dialog.el('div');Object.assign(row.style,{border:'1px solid #d7d7d7',borderRadius:'10px',padding:'11px',margin:'8px 0',background:item.owned?'#f3fbf3':'#fafafa'});
    const top=dialog.el('div');Object.assign(top.style,{display:'flex',justifyContent:'space-between',gap:'12px',alignItems:'center',flexWrap:'wrap'});
    const name=dialog.el('strong',item.name||item.label||item.id);const status=dialog.el('strong',item.owned?'✅ Vorhanden':item.required?'🔴 Für Betrieb benötigt':'⚙️ Verfügbar');top.append(name,status);row.append(top);
    const usage=machineUsage(company,item,recipes);const details=[];
    if(item.description)details.push(item.description);
    if(item.capacity)details.push(`Kapazität: ${dialog.number(item.capacity)} ${item.capacityUnit||'Einheiten/h'}`);
    if(item.room)details.push(`Bereich: ${item.room==='production'?'Produktion':item.room==='storage'?'Lager':item.room}`);
    if(item.requiredLevel>1)details.push(`Freigeschaltet ab Betriebslevel ${item.requiredLevel}`);
    if(usage.length)details.push(`Benötigt für: ${usage.join(', ')}`);
    if(details.length){const info=dialog.el('div',details.join(' · '));Object.assign(info.style,{margin:'6px 0',fontSize:'13px',lineHeight:'1.45'});row.append(info);}
    const price=dialog.el('strong',item.owned?'Bereits gekauft':dialog.money(item.price));Object.assign(price.style,{marginRight:'8px'});row.append(price);
    if(!item.owned){
      const button=dialog.btn(item.affordable?'Kaufen':'Nicht genug Geld',async()=>{
        const snapshot=purchaseSnapshot(company);
        button.disabled=true;
        try{
          buyIndustryEquipment(company,item.id,{requestId:`machine-tab-${item.id}-${Date.now()}`});
          const persisted=await persistIndustryEquipment(company);
          if(persisted?.persisted===false&&company.serverCompanyId)throw new Error(persisted.reason||'Maschinenkauf konnte nicht gespeichert werden');
          dialog.ensureMachines(company);
          dialog.__worldFocusedSection='machines';
          dialog.render(panel);
          window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'equipment-purchase',equipmentId:item.id}}));
        }catch(error){
          restorePurchaseSnapshot(company,snapshot);
          button.disabled=false;
          alert(`Kauf nicht durchgeführt: ${error.message}`);
        }
      });
      button.disabled=!item.affordable;button.title=item.affordable?`${item.name||item.id} kaufen`:'Firmenkonto reicht für diese Maschine nicht aus';row.append(button);
    }
    section.append(row);
  }
  panel.append(section);
}

function addTabBar(dialog,panel){
  panel.querySelector('.world-operational-tabbar')?.remove();
  const head=panel.firstElementChild,bar=dialog.el('div');bar.className='world-operational-tabbar';Object.assign(bar.style,{display:'flex',gap:'6px',flexWrap:'wrap',position:'sticky',top:'58px',zIndex:'19',background:'#fff',padding:'8px 0',borderBottom:'1px solid #ddd'});
  const tabs=[['buy','📦 Einkauf'],['deliveries','🚚 Lieferungen'],['warehouse','🏬 Lager'],['machines','⚙️ Maschinenkauf'],['production','🏗️ Produktion']];
  for(const [key,label] of tabs){const btn=dialog.btn(label,()=>{dialog.__worldFocusedSection=key;applySectionFocus(dialog,key);});btn.dataset.operationalTab=key;bar.append(btn);}
  if(head?.nextSibling)panel.insertBefore(bar,head.nextSibling);else panel.append(bar);
}

const dialogProto=OperationalSupplyChainDialog.prototype;
if(!dialogProto.__worldMachinePurchaseTabIntegrated){
  dialogProto.__worldMachinePurchaseTabIntegrated=true;
  const originalRender=dialogProto.render;
  dialogProto.render=function(panel,...args){
    const result=originalRender.call(this,panel,...args),company=this.companyProvider();
    if(company){
      let recipes=[];try{recipes=recipesForCompany(company);}catch{}
      renderMachineMarket(this,panel,company,recipes);
      addTabBar(this,panel);
      if(this.__worldFocusedSection)applySectionFocus(this,this.__worldFocusedSection);
    }
    return result;
  };
}

const dashboardProto=EconomyDashboard.prototype;
if(!dashboardProto.__worldMachinePurchaseTabDashboardIntegrated){
  dashboardProto.__worldMachinePurchaseTabDashboardIntegrated=true;
  const originalFocus=dashboardProto.focusOperationalDialog;
  dashboardProto.focusOperationalDialog=function(section='buy'){
    if(['warehouse','machines'].includes(section)){
      const dialog=window.worldOperationalSupplyChainDialog;if(dialog)dialog.__worldFocusedSection=section;
      applySectionFocus(dialog,section);return;
    }
    const result=originalFocus.call(this,section);applySectionFocus(window.worldOperationalSupplyChainDialog,section);return result;
  };
  const originalRender=dashboardProto.render;
  dashboardProto.render=function(panel){
    const result=originalRender.call(this,panel),card=panel.querySelector('#dashboard-production');
    if(card&&!card.querySelector('.world-machine-market-button')){
      const button=this.button('⚙️ Maschinenkauf',()=>this.openOperationalSupplyChain('machines'));button.classList.add('world-machine-market-button');card.append(button);
    }
    return result;
  };
}

export { applySectionFocus,machineUsage,purchaseSnapshot,restorePurchaseSnapshot };
if(typeof window!=='undefined')window.worldMachinePurchaseTab={applySectionFocus,machineUsage};
