// WorldProject – gemeinsame Section-Registry für bestehende Betriebsoberflächen.
// Keine Parallel-UI: liefert nur konsistente Daten/Aktionen an vorhandene Views.
import { operationalDashboardVM } from './IndustryOperationalDashboardVM.js';
import { contextualActions } from './ContextualPlayerActions.js';
import { resolvePlayerError } from './PlayerFacingErrorResolver.js';
const sectionOrder=['overview','procurement','inventory','production','equipment','workforce','fleet','sales','finance','alerts'];
export function operationsSections(company){const vm=operationalDashboardVM(company),actions=contextualActions(company);const sections={overview:{id:'overview',label:'Übersicht',data:vm.overview},procurement:{id:'procurement',label:'Einkauf',data:vm.procurement},inventory:{id:'inventory',label:'Lager',data:vm.inventory},production:{id:'production',label:'Produktion',data:vm.production},equipment:{id:'equipment',label:'Maschinen',data:{setup:vm.equipment,machines:vm.machines}},workforce:{id:'workforce',label:'Personal',data:vm.workforce},fleet:{id:'fleet',label:'Fuhrpark & Lieferungen',data:vm.fleet},sales:{id:'sales',label:'Kunden & Vertrieb',data:vm.sales},finance:{id:'finance',label:'Finanzen',data:vm.finance},alerts:{id:'alerts',label:'Hinweise',data:{actions}}};return sectionOrder.map(id=>sections[id]);}
export function operationsSection(company,id){return operationsSections(company).find(x=>x.id===id)||null;}
export function sectionFailure(error){return resolvePlayerError(error);}
if(typeof window!=='undefined')window.worldOperationsSections={all:operationsSections,get:operationsSection};
