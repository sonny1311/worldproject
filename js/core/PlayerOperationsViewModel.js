// Zentrale Datenquelle fuer bestehende Spieleransichten. Keine neue UI.
import { commandCenterSnapshot } from './BusinessCommandCenter.js';
import { industryRecipes, industrySuppliers } from './UniversalIndustryCycle.js';
import { machineCatalogFor, ownedMachines } from './UniversalBusinessOperations.js';
import { jobsFor } from './UniversalWorkforceMarket.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export function playerOperationsViewModel(company={}){
 const snap=commandCenterSnapshot(company);
 const recipes=industryRecipes(company).map(r=>({id:r.id,label:r.label,product:r.product,machineType:r.machineType,durationMinutes:n(r.durationMinutes),output:n(r.output),materials:r.materials||{}}));
 const suppliers=industrySuppliers(company).map(s=>({id:s.id,label:s.label,materials:s.materials||[],prices:s.prices||{},deliveryHours:n(s.deliveryHours),distanceKm:n(s.distanceKm),quality:n(s.quality,1),reliability:n(s.reliability,1)}));
 const machines=ownedMachines(company).map(m=>typeof m==='string'?{id:m,instanceId:m,status:'available',condition:100}:m);
 const workforce=(company.employees||[]).map(e=>({id:e.id,role:e.role||e.jobId,status:e.status||'available',shift:e.shift||null,wageMonthly:n(e.wageMonthly),skills:e.skills||[]}));
 return {company:{id:company.id,name:company.name,type:company.type,money:n(company.money)},recipes,suppliers,machineCatalog:machineCatalogFor(company),machines,availableJobs:jobsFor(company),workforce,inventory:company.inventory||{},finishedGoods:company.finishedGoods||{},customerOrders:company.customerOrders||[],productionJobs:company.productionJobs||[],deliveries:company.deliveries||company.activeDeliveries||[],alerts:snap.alerts||[],nextActions:(snap.alerts||[]).slice(0,5),kpis:snap.base};
}
export function operationPanelState(company,panel){const vm=playerOperationsViewModel(company);const map={shopping:{suppliers:vm.suppliers,inventory:vm.inventory,alerts:vm.alerts.filter(a=>['stock_shortage','supplier_risk'].includes(a.code))},warehouse:{inventory:vm.inventory,finishedGoods:vm.finishedGoods,warehouse:vm.kpis?.warehouse,alerts:vm.alerts.filter(a=>a.code==='warehouse_capacity')},production:{recipes:vm.recipes,jobs:vm.productionJobs,machines:vm.machines,alerts:vm.alerts.filter(a=>['maintenance_due','machine_unavailable','late_jobs'].includes(a.code))},workforce:{employees:vm.workforce,jobs:vm.availableJobs},fleet:{deliveries:vm.deliveries},customers:{orders:vm.customerOrders},finance:{money:vm.company.money,finance:vm.kpis?.finance}};return map[panel]||vm;}
if(typeof window!=='undefined'){window.worldPlayerOperationsViewModel=playerOperationsViewModel;window.worldOperationPanelState=operationPanelState;}
