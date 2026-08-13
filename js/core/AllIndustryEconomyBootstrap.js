// Lädt ausschließlich Diagnosen/Tests. Keine zweite Oberfläche, keine parallelen Spielsysteme.
import { runIndustryContentCoverageAudit } from "./IndustryContentCoverageAudit.js";
import { runAllIndustryEconomyRegression } from "./AllIndustryEconomyRegression.js";
import { runAllIndustryLifecycleRegression } from "./AllIndustryLifecycleRegression.js";
import { runIndustryDeepSimulationRegression } from "./IndustryDeepSimulationRegression.js";
import "./IndustryEconomyDiagnostics.js";
import "./IndustryManagementDashboardData.js";
import "./BusinessCommandCenter.js";
import "./CustomerOrderLifecycle.js";
import "./AdvancedProductionFlow.js";
import "./InboundInventoryAndLogistics.js";
import "./WorkforceOrganizationSystem.js";
import "./CorporateStrategyAndExpansion.js";
import { runLongTermAllIndustrySimulation } from "./LongTermCompanySimulator.js";
export function runAllIndustryEconomyHealth(){
 const coverage=runIndustryContentCoverageAudit();
 const regression=runAllIndustryEconomyRegression();
 const lifecycle=runAllIndustryLifecycleRegression();
 const deepSimulation=runIndustryDeepSimulationRegression();
 const report={success:coverage.success&&regression.success&&lifecycle.success&&deepSimulation.success,coverage,regression,lifecycle,deepSimulation,runLongTermSimulation:(years=5)=>runLongTermAllIndustrySimulation({years}),ranAt:Date.now()};
 if(typeof window!=="undefined")window.worldAllIndustryEconomyHealth=report;
 console[report.success?"log":"error"](`WORLDPROJECT ALLE-GEWERBE HEALTH ${report.success?'GRÜN':'FEHLER'} · DEEP ${deepSimulation.passed}/250`,report);
 return report;
}
