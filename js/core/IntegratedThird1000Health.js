// WorldProject – integrierter Healthcheck für den dritten 1000er-Block.
import { IndustryProfiles,createStarterBuilding } from './IndustryCatalog.js';
import { industryBusinessRules } from './IndustryBusinessRules.js';
import { createNpcCompany,advanceNpcDay } from './NPCCompanySimulation.js';
import { ensureExchange,placeSellOrder,placeBuyOrder } from './PlayerMarketExchange.js';
import { ensureTenders,createTender } from './TenderContractSystem.js';
import { ensureBrand,brandScore } from './BrandReputationSystem.js';
import { ensureInnovation,innovationThemes } from './InnovationPipelineSystem.js';
import { ensureProgression,evaluateAchievements } from './CompanyProgressionAchievements.js';
import { ensureBusinessEvents,startBusinessEvent,eventMultipliers } from './DynamicBusinessEventSystem.js';
import { ensureTradeNetwork } from './InterCompanyTradeNetwork.js';
import { ensureRestructuring,solvencyStatus } from './BusinessRestructuringSystem.js';
import { ensureClaims } from './InsuranceClaimsSystem.js';
import { ensureTax,taxKpis } from './TaxAndRegulationSystem.js';
import { ensureWarehouseAutomation,warehouseAutomationKpis } from './WarehouseAutomationSystem.js';
import { ensureDemandForecast,demandForecastKpis } from './DemandForecastingEngine.js';
import { ensureProcurementAuctions,procurementAuctionKpis } from './ProcurementAuctionSystem.js';
import { ensureHubNetwork,hubNetworkKpis } from './LogisticsHubNetwork.js';
import { ensureNotifications,notificationKpis } from './PlayerNotificationCenter.js';
import { onboardingState } from './OperationalOnboardingAdvisor.js';
import { ensureTelemetry,captureEconomySnapshot,moduleHealth } from './EconomyTelemetryDiagnostics.js';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
function sampleCompany(type){const p=IndustryProfiles[type];return{type,branchKey:p.branchKey,name:`Test ${type}`,money:100000,buildingState:createStarterBuilding(type),inventory:{sample:100},finishedGoods:{sample:20},employees:[],productionJobs:[],salesLedger:[],costLedger:[],customerOrders:[]};}
export function runIntegratedThird1000Health(){const checks=[],add=(name,ok,detail=null)=>checks.push({name,success:!!ok,detail});for(const type of Object.keys(IndustryProfiles)){const c=sampleCompany(type);try{const rules=industryBusinessRules(c);add(`${type}: Branchenregeln`,!!rules.branchKey);const npc=createNpcCompany({type,seed:1});advanceNpcDay(npc);add(`${type}: NPC simulierbar`,Number.isFinite(npc.money));ensureBrand(c);add(`${type}: Marke`,Number.isFinite(brandScore(c)));ensureInnovation(c);add(`${type}: Innovationsthemen`,innovationThemes(c).length>0);ensureProgression(c);evaluateAchievements(c);add(`${type}: Progression`,c.progression.level>=1);ensureTax(c);add(`${type}: Steuerzustand`,Number.isFinite(taxKpis(c).regulatoryLoad));ensureWarehouseAutomation(c);add(`${type}: Lagerautomation`,Number.isFinite(warehouseAutomationKpis(c).openTasks));ensureDemandForecast(c);add(`${type}: Nachfrageprognose`,demandForecastKpis(c).observations===0);ensureProcurementAuctions(c);add(`${type}: Beschaffungsauktion`,procurementAuctionKpis(c).open===0);ensureClaims(c);ensureRestructuring(c);add(`${type}: Restrukturierung`,!!solvencyStatus(c).status);ensureNotifications(c);add(`${type}: Benachrichtigungen`,notificationKpis(c).active===0);ensureTelemetry(c);captureEconomySnapshot(c);add(`${type}: Telemetrie`,moduleHealth(c).healthy);const ob=onboardingState(c);add(`${type}: Spielerführung`,!!ob.phase);}catch(error){add(`${type}: Modulintegration`,false,error.message);}}
 const world={};ensureExchange(world);ensureTenders(world);ensureBusinessEvents(world);ensureTradeNetwork(world);ensureHubNetwork(world);add('Welt: Exchange',Array.isArray(world.exchange.orders));add('Welt: Tender',Array.isArray(world.tenders.open));startBusinessEvent(world,'energy_spike');add('Welt: Eventmultiplikator',eventMultipliers(world,sampleCompany('Brauerei')).energy>1);add('Welt: Intercompany Network',Array.isArray(world.tradeNetwork.agreements));add('Welt: Logistics Hubs',hubNetworkKpis(world).hubs===0);
 const seller=sampleCompany('Einzelhandel'),buyer=sampleCompany('Großhandel');seller.finishedGoods.sample=10;buyer.money=1000;try{placeSellOrder(world,seller,{productId:'sample',quantity:5,unitPrice:10});placeBuyOrder(world,buyer,{productId:'sample',quantity:5,maxUnitPrice:10});add('Welt: B2B Match',n(buyer.inventory.sample)>=5);}catch(error){add('Welt: B2B Match',false,error.message);}try{createTender(world,{buyerId:'buyer',productId:'sample',quantity:10,reserveUnitPrice:20,dueAt:Date.now()+86400000});add('Welt: Ausschreibung',world.tenders.open.length>0);}catch(error){add('Welt: Ausschreibung',false,error.message);}
 const failed=checks.filter(x=>!x.success),report={success:failed.length===0,passed:checks.length-failed.length,total:checks.length,failed,checks,ranAt:Date.now()};if(typeof window!=='undefined')window.worldThird1000Health=report;console[report.success?'log':'error'](`WORLDPROJECT THIRD-1000 HEALTH ${report.passed}/${report.total}`,report);return report;}
