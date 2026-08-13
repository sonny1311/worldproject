// WorldProject – gemeinsame Section-Registry für bestehende Betriebsoberflächen.
// Keine Parallel-UI: liefert nur konsistente Daten/Aktionen an vorhandene Views.
import './Sixth1000SmokeHealth.js';
import './Seventh1000SmokeHealth.js';
import { operationalDashboardVM } from './IndustryOperationalDashboardVM.js';
import { contextualPlayerActions } from './ContextualPlayerActions.js';
import { commandCenterSnapshot } from './BusinessCommandCenter.js';
import { resolvePlayerError } from './PlayerFacingErrorResolver.js';
import { procurementPanelState } from './ProcurementPanelController.js';
import { inventoryPanelState } from './InventoryPanelController.js';
import { productionPanelState } from './ProductionPanelController.js';
import { equipmentPanelState } from './EquipmentPanelController.js';
import { workforcePanelState } from './WorkforcePanelController.js';
import { fleetPanelState } from './FleetPanelController.js';
import { salesPanelState } from './SalesPanelController.js';
import { financePanelState } from './FinancePanelController.js';
const sectionOrder=['overview','procurement','inventory','production','equipment','workforce','fleet','sales','finance','alerts'];
export function operationsSections(company){const vm=operationalDashboardVM(company),actions=contextualPlayerActions(company),command=commandCenterSnapshot(company),alerts=command.alerts||[];const sections={overview:{id:'overview',label:'Übersicht',data:vm.overview},procurement:{id:'procurement',label:'Einkauf',data:procurementPanelState(company)},inventory:{id:'inventory',label:'Lager',data:inventoryPanelState(company)},production:{id:'production',label:'Produktion',data:productionPanelState(company)},equipment:{id:'equipment',label:'Maschinen',data:equipmentPanelState(company)},workforce:{id:'workforce',label:'Personal',data:workforcePanelState(company)},fleet:{id:'fleet',label:'Fuhrpark & Lieferungen',data:fleetPanelState(company)},sales:{id:'sales',label:'Kunden & Vertrieb',data:salesPanelState(company)},finance:{id:'finance',label:'Finanzen',data:financePanelState(company)},alerts:{id:'alerts',label:'Hinweise',data:{actions,alerts,critical:alerts.filter(x=>x.severity==='critical').length,warnings:alerts.filter(x=>x.severity==='warning').length}}};return sectionOrder.map(id=>sections[id]);}
export function operationsSection(company,id){return operationsSections(company).find(x=>x.id===id)||null;}
export function sectionFailure(error){return resolvePlayerError(error);}
if(typeof window!=='undefined')window.worldOperationsSections={all:operationsSections,get:operationsSection};
