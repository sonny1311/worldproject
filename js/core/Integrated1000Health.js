// Gezielt aufrufbarer End-to-End-Healthcheck fuer den 1000er Entwicklungsblock.
import { playerOperationsViewModel } from './PlayerOperationsViewModel.js';
import { machineLifecycleKpis } from './MachineLifecycleSystem.js';
import { productionGraphKpis, defineProductionRoute, startProductionRoute, completeProductionStep } from './ProductionChainGraph.js';
import { workforceCapabilityKpis, defineRoleCapability } from './WorkforceCapabilityMatrix.js';
import { negotiationKpis, startSupplierNegotiation, counterOffer, acceptNegotiation } from './ProcurementNegotiationSystem.js';
import { traceabilityKpis, registerTraceLot } from './WarehouseTraceabilitySystem.js';
import { fleetNetworkKpis } from './FleetNetworkOptimization.js';
import { customerLifetimeValue, ensureCustomerAccount, settleCommercialDelivery } from './CustomerCommercialSystem.js';
import { financePlanningKpis, closeFinancialPeriod } from './FinancePlanningSystem.js';
import { marketPricingKpis, setProductPricing, recommendPrice } from './MarketPricingStrategy.js';
import { corporateGroupKpis, addGroupSite, postSiteResult } from './CorporateGroupSystem.js';
import { researchBonuses, defineResearchBranch } from './ResearchDevelopmentSystem.js';
import { buildingKpis, addPlot } from './BuildingExpansionSystem.js';
import { ensureRegion, regionalEconomySnapshot } from './WorldEconomyCycleSystem.js';
import { liveCoordinatorKpis } from './LiveOperationsCoordinator.js';
import { snapshotV3, hydrateV3, persistenceIntegrityV3 } from './PersistenceMigrationV3.js';
import { securityKpis, claimIdempotentRequest, completeIdempotentRequest } from './SecurityIntegritySystem.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
function baseCompany(type='Brauerei'){return{id:`health-${type}`,type,name:`Health ${type}`,money:100000,inventory:{},finishedGoods:{},productionJobs:[],customerOrders:[],employees:[],vehicles:[],buildingState:{equipment:[]},salesLedger:[],costLedger:[]};}
export function runIntegrated1000Health({company=null,world={}}={}){
 const c=company||baseCompany(),checks=[],ok=(name,fn)=>{try{const detail=fn();checks.push({name,success:true,detail});return detail;}catch(error){checks.push({name,success:false,error:error?.message||String(error)});return null;}};
 ok('player view model',()=>playerOperationsViewModel(c));
 ok('machine lifecycle',()=>machineLifecycleKpis(c));
 ok('production graph',()=>{defineProductionRoute(c,{id:'health-route',productId:'health-product',steps:[{id:'s1',durationMinutes:1,output:{health_intermediate:1}},{id:'s2',durationMinutes:1,output:{health_product:1}}]});const r=startProductionRoute(c,'health-route',10,{requestId:'health-production'}).run;completeProductionStep(c,r.id);completeProductionStep(c,r.id);const k=productionGraphKpis(c);if(k.done<1)throw new Error('Produktionsgraph beendet Lauf nicht');return k;});
 ok('workforce capability',()=>{defineRoleCapability(c,'health-role',{skills:[]});return workforceCapabilityKpis(c);});
 ok('procurement negotiation',()=>{const x=startSupplierNegotiation(c,{supplierId:'health-supplier',item:'health-item',basePrice:10,targetPrice:9,quantity:10});counterOffer(c,x.id,{unitPrice:9.5,deliveryHours:24,quality:.98});acceptNegotiation(c,x.id);return negotiationKpis(c);});
 ok('warehouse traceability',()=>{registerTraceLot(c,{item:'health-item',quantity:10,batchId:'health-batch'});return traceabilityKpis(c);});
 ok('fleet network',()=>fleetNetworkKpis(c));
 ok('customer commercial',()=>{ensureCustomerAccount(c,'health-customer');settleCommercialDelivery(c,{customerId:'health-customer',revenue:100,cost:60,onTime:true,complete:true});return customerLifetimeValue(c,'health-customer');});
 ok('finance planning',()=>{closeFinancialPeriod(c,{period:'health'});return financePlanningKpis(c);});
 ok('market pricing',()=>{setProductPricing(c,'health-product',{cost:1,price:2,referencePrice:2,elasticity:1.1,minMargin:.2});const recommendation=recommendPrice(c,'health-product');if(!Number.isFinite(recommendation.price))throw new Error('Keine gueltige Preisempfehlung');return marketPricingKpis(c);});
 ok('corporate group',()=>{const s=addGroupSite(c,{id:'health-site',name:'Health Site'});postSiteResult(c,s.id,{revenue:1000,cost:700});return corporateGroupKpis(c);});
 ok('research development',()=>{defineResearchBranch(c,{id:'health-rd',nodes:[{id:'health-node',cost:0,durationHours:1,bonus:{qualityBonus:1}}]});return researchBonuses(c);});
 ok('buildings',()=>{addPlot(c,{id:'health-plot',areaM2:1000});return buildingKpis(c);});
 ok('world economy',()=>{ensureRegion(world,'health-region');const s=regionalEconomySnapshot(world,'health-region');if(!Number.isFinite(s.demand))throw new Error('Regionale Nachfrage ungueltig');return s;});
 ok('live ops coordinator',()=>liveCoordinatorKpis(c));
 ok('persistence v3',()=>{const snap=snapshotV3(c),restored=baseCompany(c.type);hydrateV3(restored,snap);const report=persistenceIntegrityV3(restored);if(!report.success)throw new Error(`Persistenzfehler: ${report.issues.length}`);if(n(restored.money)!==n(c.money))throw new Error('Kontostand nach Reload abweichend');return report;});
 ok('security idempotency',()=>{const state={},request={actorId:'health-admin',action:'health',requestId:'one'};const claim=claimIdempotentRequest(state,request);if(!claim.accepted)throw new Error('Erster Request nicht akzeptiert');completeIdempotentRequest(state,claim.key,{ok:true});const repeat=claimIdempotentRequest(state,request);if(!repeat.idempotent)throw new Error('Doppelrequest nicht erkannt');return securityKpis(state);});
 const failed=checks.filter(x=>!x.success),report={success:!failed.length,passed:checks.length-failed.length,total:checks.length,failed,checks,ranAt:Date.now()};
 if(typeof window!=='undefined')window.worldIntegrated1000HealthReport=report;
 console[report.success?'log':'error'](`WORLDPROJECT 1000-BLOCK HEALTH ${report.passed}/${report.total}`,report);
 return report;
}
if(typeof window!=='undefined')window.runWorldIntegrated1000Health=runIntegrated1000Health;
