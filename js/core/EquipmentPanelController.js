// WorldProject – Maschinenansicht für bestehende UI.
import { equipmentSetupVM,equipmentForMachineRequirement } from './IndustryEquipmentMarketplace.js';
import { maintenanceKpis,maintenanceDue,breakdownRisk } from './IndustryMaintenanceEngine.js';
import { industryRecipes } from './UniversalIndustryCycle.js';
export function equipmentPanelState(company){const setup=equipmentSetupVM(company),recipes=industryRecipes(company),owned=company.buildingState?.equipment||[];return{setup,maintenance:maintenanceKpis(company),owned:owned.map(m=>({machine:m,due:maintenanceDue(company,m),breakdownRisk:breakdownRisk(m),recipes:recipes.filter(r=>equipmentForMachineRequirement(company,r.machineType).some(x=>x.id===m.id)).map(r=>r.id)})),missingRequired:setup.missingRequired,optional:setup.optional};}
if(typeof window!=='undefined')window.worldEquipmentPanel={state:equipmentPanelState};
