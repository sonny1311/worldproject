// WorldProject – ViewModels/Actions für BESTEHENDE Ansichten. Keine zweite UI.
import { commandCenterSnapshot,nextBestActions } from './BusinessCommandCenter.js';
import { managementDashboardData } from './IndustryManagementDashboardData.js';
import { maintenanceKpis } from './IndustryMaintenanceEngine.js';
import { workforceKpis } from './IndustryWorkforceDevelopment.js';
import { supplierKpis } from './SupplierManagementSystem.js';
import { pricingKpis } from './PricingPromotionSystem.js';
import { crmKpis } from './CustomerRelationshipSystem.js';
import { financingKpis } from './BusinessFinancingSystem.js';
import { complianceKpis } from './CompliancePermitSystem.js';
import { companyGroupKpis } from './MultiSiteCompanySystem.js';
import { UnifiedOperationsOverviewSystem } from './UnifiedOperationsOverviewSystem.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const workforceEmployees=company=>company?.workforceState?.employees||company?.workforceOperationsState?.employees||company?.employees||[];
const workforceMachines=company=>{const sources=[company?.workforceState?.machines,company?.workforceOperationsState?.machines,company?.machines,company?.buildingState?.equipment,company?.equipment],merged=new Map();for(const source of sources){if(!Array.isArray(source))continue;for(const machine of source){if(!machine)continue;const key=String(machine.instanceId||machine.id||`${machine.type||machine.name}:${merged.size}`);if(!merged.has(key))merged.set(key,machine);else merged.set(key,{...merged.get(key),...machine});}}return [...merged.values()];};
const unifiedOperations=company=>company?new UnifiedOperationsOverviewSystem({companyProvider:()=>company}).state().operations:{supplyOrders:[],productionQueue:[],customerOrders:[]};
function operationalWarehouseKpis(company){
 const state=company?.operationalSupplyState||{},stock=state.warehouseStock||{},capacities={raw:10000,packaging:10000,finished:10000,cold:0,...(state.baseCapacities||{})};
 const zoneNames=[...new Set(['raw','packaging','finished','cold',...Object.keys(capacities),...Object.keys(stock)])];
 const zones=zoneNames.map(zone=>{const used=Object.values(stock[zone]||{}).reduce((sum,value)=>sum+Math.max(0,n(value)),0),capacity=Math.max(0,n(capacities[zone]));return{zone,used,capacity,free:Math.max(0,capacity-used),utilization:capacity?used/capacity:0};});
 return{zones,lots:Object.values(stock).reduce((sum,zone)=>sum+Object.values(zone||{}).filter(value=>n(value)>0).length,0),reserved:0,criticalZones:zones.filter(x=>x.utilization>=.9).map(x=>x.zone)};
}
export function operationsOverviewVM(company){const c=commandCenterSnapshot(company);return{money:n(company?.money),alerts:c.alerts,actions:nextBestActions(company),finance:c.base.finance,operations:c.base.operations,capacity:c.base.capacity,market:c.base.market};}
export function machinePanelVM(company){const eq=workforceMachines(company);return{items:eq.map(m=>({id:m.instanceId||m.id,name:m.label||m.name||m.type||m.id,status:m.status||'available',condition:n(m.condition,100),runtimeHours:n(m.runtimeHours??m.hours),maintenanceDue:n(m.condition,100)<35||m.status==='maintenance_required'})),kpi:maintenanceKpis(company)};}
export function workforcePanelVM(company){return{employees:workforceEmployees(company).map(e=>({id:e.id,role:e.role||e.jobLabel||e.jobId||'Mitarbeiter',status:e.status||'available',wage:n(e.wageMonthly??e.wage),morale:n(e.morale??e.satisfaction,75),fatigue:n(e.fatigue),skill:n(e.skillLevel??e.qualification,1)})),kpi:workforceKpis(company)};}
export function procurementPanelVM(company){return{suppliers:supplierKpis(company),warehouse:operationalWarehouseKpis(company),critical:(commandCenterSnapshot(company).procurement||[]).filter(x=>x.critical)};}
export function salesPanelVM(company){return{crm:crmKpis(company),pricing:pricingKpis(company),orders:unifiedOperations(company).customerOrders,offers:company?.customerLifecycle?.offers||[],complaints:company?.customerLifecycle?.complaints||[]};}
export function financePanelVM(company){return{financing:financingKpis(company),finance:managementDashboardData(company).finance};}
export function compliancePanelVM(company){return complianceKpis(company);}
export function sitesPanelVM(company){return company?.sites?.length?companyGroupKpis(company):{sites:0};}
if(typeof window!=='undefined')window.worldExistingUiAdapters={operationsOverviewVM,machinePanelVM,workforcePanelVM,procurementPanelVM,salesPanelVM,financePanelVM,compliancePanelVM,sitesPanelVM};
