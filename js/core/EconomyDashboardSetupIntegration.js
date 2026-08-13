// WorldProject – ergänzt die bestehende Gründungsansicht um fehlende Pflichtausstattung.
import { EconomyDashboard } from './EconomyDashboard.js';
import { equipmentSetupVM } from './IndustryEquipmentMarketplace.js';
const proto=EconomyDashboard.prototype;
if(!proto.__worldSetupEquipmentIntegrated){proto.__worldSetupEquipmentIntegrated=true;const original=proto.renderSetup;proto.renderSetup=function(panel){original.call(this,panel);const state=equipmentSetupVM(this.company),card=this.card('⚙️ Benötigte Maschinen & Ausstattung');if(!state.missingRequired.length)card.append(this.el('div','✓ Pflichtausstattung vollständig'));else{card.append(this.small(`Noch ${state.missingRequired.length} Pflichtposition(en) fehlen.`));for(const item of state.missingRequired)card.append(this.stockRow(item.name||item.label||item.id,`${this.money(item.price)} €`));}panel.append(card);};}
