// WorldProject – ViewModels/Actions für BESTEHENDE Ansichten. Keine zweite UI.
import { commandCenterSnapshot,nextBestActions } from './BusinessCommandCenter.js';
import { managementDashboardData } from './IndustryManagementDashboardData.js';
import { maintenanceKpis } from './IndustryMaintenanceEngine.js';
import { workforceKpis } from './IndustryWorkforceDevelopment.js';
import { supplierKpis } from './SupplierManagementSystem.js';
import { pricingKpis } from './PricingPromotionSystem.js';
import { warehouseKpis } from './IndustryWarehouseEngine.js';
import { crmKpis } from './CustomerRelationshipSystem.js';
import { financingKpis } from './BusinessFinancingSystem.js';
import { complianceKpis } from './CompliancePermitSystem.js';
import { companyGroupKpis } from './MultiSiteCompanySystem.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export function operationsOverviewVM(company){const c=commandCenterSnapshot(company);return{money:n(company.money),alerts:c.alerts,actions:nextBestActions(company),finance:c.base.finance,operations:c.base.operations,capacity:c.base.capacity,market:c.base.market};}
export function machinePanelVM(company){const eq=company.buildingState?.equipment||[];return{items:eq.map(m=>({id:m.instanceId||m.id,name:m.name||m.id,status:m.status||'available',condition:n(m.condition,100),runtimeHours:n(m.runtimeHours),maintenanceDue:n(m.condition,100)<35||m.status==='maintenance_required'})),kpi:maintenanceKpis(company)};}
export function workforcePanelVM(company){return{employees:(company.employees||[]).map(e=>({id:e.id,role:e.role||e.jobId||'Mitarbeiter',status:e.status||'available',wage:n(e.wageMonthly),morale:n(e.morale,75),fatigue:n(e.fatigue),skill:n(e.skillLevel,1)})),kpi:workforceKpis(company)};}
export function procurementPanelVM(company){return{suppliers:supplierKpis(company),warehouse:warehouseKpis(company),critical:(commandCenterSnapshot(company).procurement||[]).filter(x=>x.critical)};}
export function salesPanelVM(company){return{crm:crmKpis(company),pricing:pricingKpis(company),orders:company.customerOrders||[],offers:company.customerLifecycle?.offers||[],complaints:company.customerLifecycle?.complaints||[]};}
export function financePanelVM(company){return{financing:financingKpis(company),finance:managementDashboardData(company).finance};}
export function compliancePanelVM(company){return complianceKpis(company);}
export function sitesPanelVM(company){return company.sites?.length?companyGroupKpis(company):{sites:0};}
if(typeof window!=='undefined')window.worldExistingUiAdapters={operationsOverviewVM,machinePanelVM,workforcePanelVM,procurementPanelVM,salesPanelVM,financePanelVM,compliancePanelVM,sitesPanelVM};
