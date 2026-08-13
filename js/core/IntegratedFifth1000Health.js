// WorldProject – integrierter Healthcheck für den fünften 1000er-Block.
import { releaseReadiness } from './ReleaseReadinessSystem.js';
import { ensurePerformanceState,performanceKpis } from './RuntimePerformanceBudget.js';
import { mobilePresentationVM } from './MobileOperationsPresentation.js';
import { visibleStatus } from './OperationsLocalizationRegistry.js';
import { ensureOfflineQueue,offlineQueueKpis } from './OfflineActionQueue.js';
import { auditCompanyIntegrity } from './CompanyDataIntegrityAuditor.js';
import { previewMigration } from './SavegameMigrationPlanner.js';
import { ensureMarketFairness,marketFairnessKpis } from './MarketFairnessGuard.js';
import { applyPopulationScale,worldPopulationKpis } from './WorldPopulationScaler.js';
import { contextualPlayerActions } from './ContextualPlayerActions.js';
import { resolvePlayerError } from './PlayerFacingErrorResolver.js';
import { transactionSnapshot,transactionKpis } from './OperationTransactionCoordinator.js';
import { ensureOperationsUIState } from './OperationsUIStateCoordinator.js';
import { ensureAllianceLaunch,allianceLaunchReadiness } from './AllianceLaunchGuard.js';
import { createLoadScenario,loadScenarioStats } from './WorldLoadScenarioGenerator.js';
import { ensureSystemMonitor,systemHealthSummary } from './SystemOperationsMonitor.js';
import { accessibilityAuditVM } from './OperationsAccessibilityModel.js';
import { IndustryProfiles,createStarterBuilding } from './IndustryCatalog.js';
function sample(type='Brauerei'){return{type,money:100000,buildingState:createStarterBuilding(type),inventory:{},finishedGoods:{},employees:[],productionJobs:[],customerOrders:[],deliveries:[],salesLedger:[],costLedger:[]};}
export function runIntegratedFifth1000Health(){const checks=[],add=(name,ok,detail=null)=>checks.push({name,success:!!ok,detail});const world={};const c=sample();try{add('Release gate',Number.isFinite(releaseReadiness(world).score));ensurePerformanceState(world);add('Performance budget',Number.isFinite(performanceKpis(world).averageMs));add('Mobile VM',mobilePresentationVM({width:390}).mode==='compact');add('Lokalisierung',visibleStatus('running')==='Läuft');ensureOfflineQueue(world);add('Offline Queue',offlineQueueKpis(world).queued===0);add('Datenintegrität',auditCompanyIntegrity(c).success);add('Migration preview',previewMigration({version:1}).steps>=1);ensureMarketFairness(world);add('Markt-Fairness',Number.isFinite(marketFairnessKpis(world).npcShareCap));applyPopulationScale(world,{activePlayers:5});add('Population scaling',worldPopulationKpis(world).targetNpcCompanies>0);add('Kontextaktionen',Array.isArray(contextualPlayerActions(c)));add('Spielerfehler',resolvePlayerError(new Error('Nicht genug Geld')).code==='insufficient_funds');add('Transaktionssnapshot',typeof transactionSnapshot(c)==='object');add('Transaktions-KPI',Number.isFinite(transactionKpis(c).total));add('UI-State',!!ensureOperationsUIState(world));ensureAllianceLaunch(world);add('Allianz bleibt verborgen',!world.allianceLaunch.enabled);add('Allianz-Readiness geblockt',!allianceLaunchReadiness(world,{activePlayers:1}).ready);const load=createLoadScenario({companies:100,ordersPerCompany:2});add('Lastszenario',loadScenarioStats(load).companies===100);ensureSystemMonitor(world);add('Systemmonitor',Number.isFinite(systemHealthSummary(world).score));add('Accessibility',accessibilityAuditVM({controls:[{label:'Test',touchSize:44}]}).success);for(const type of Object.keys(IndustryProfiles)){const s=sample(type);add(`${type}: Integrity`,auditCompanyIntegrity(s).success);}}catch(error){add('Fifth1000 integration',false,error.message);}const failed=checks.filter(x=>!x.success),report={success:failed.length===0,passed:checks.length-failed.length,total:checks.length,failed,checks,ranAt:Date.now()};if(typeof window!=='undefined')window.worldFifth1000Health=report;console[report.success?'log':'error'](`WORLDPROJECT FIFTH-1000 HEALTH ${report.passed}/${report.total}`,report);return report;}