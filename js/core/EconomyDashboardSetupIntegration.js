// WorldProject – ergänzt die bestehende Betriebsansicht um Maschinen-/Ausstattungszugriff.
import { EconomyDashboard } from './EconomyDashboard.js';
import { equipmentSetupVM } from './IndustryEquipmentMarketplace.js';
import { universalOperationsDialog } from './UniversalOperationsDialog.js';
const proto=EconomyDashboard.prototype;
if(!proto.__worldSetupEquipmentIntegrated){
 proto.__worldSetupEquipmentIntegrated=true;
 const originalSetup=proto.renderSetup;
 proto.renderSetup=function(panel){
  originalSetup.call(this,panel);
  const state=equipmentSetupVM(this.company),card=this.card('⚙️ Benötigte Maschinen & Ausstattung');
  if(!state.missingRequired.length)card.append(this.el('div','✓ Pflichtausstattung vollständig'));
  else{
   card.append(this.small(`Noch ${state.missingRequired.length} Pflichtposition(en) fehlen.`));
   for(const item of state.missingRequired)card.append(this.stockRow(item.name||item.label||item.id,`${this.money(item.price)} €`));
  }
  card.append(this.button('Maschinen & Ausstattung kaufen',()=>universalOperationsDialog.open('machines')));
  panel.append(card);
 };
 const originalRender=proto.render;
 proto.render=function(panel){
  originalRender.call(this,panel);
  if(!panel||this.company?.setupPhase&&this.company.setupPhase!=='operating')return;
  if(panel.querySelector?.('#dashboard-equipment-market'))return;
  const card=this.card('⚙️ Maschinen & Ausstattung');card.id='dashboard-equipment-market';
  const state=equipmentSetupVM(this.company),missing=state.missingRequired||[];
  card.append(this.small(missing.length?`${missing.length} Pflichtposition(en) fehlen oder müssen ersetzt werden.`:'Maschinen kaufen, warten, upgraden oder verkaufen.'));
  card.append(this.button('Maschinenmarkt öffnen',()=>universalOperationsDialog.open('machines')));
  panel.append(card);
 };
}
