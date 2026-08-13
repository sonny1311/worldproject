// Lädt ausschließlich Diagnosen/Tests. Keine zweite Oberfläche, keine parallelen Spielsysteme.
import { runIndustryContentCoverageAudit } from "./IndustryContentCoverageAudit.js";
import { runAllIndustryEconomyRegression } from "./AllIndustryEconomyRegression.js";
import { runAllIndustryLifecycleRegression } from "./AllIndustryLifecycleRegression.js";
import { runIndustryDeepSimulationRegression } from "./IndustryDeepSimulationRegression.js";
import "./IndustryEconomyDiagnostics.js";
import "./IndustryManagementDashboardData.js";
export function runAllIndustryEconomyHealth(){
 const coverage=runIndustryContentCoverageAudit();
 const regression=runAllIndustryEconomyRegression();
 const lifecycle=runAllIndustryLifecycleRegression();
 const deepSimulation=runIndustryDeepSimulationRegression();
 const report={success:coverage.success&&regression.success&&lifecycle.success&&deepSimulation.success,coverage,regression,lifecycle,deepSimulation,ranAt:Date.now()};
 if(typeof window!=="undefined")window.worldAllIndustryEconomyHealth=report;
 console[report.success?"log":"error"](`WORLDPROJECT ALLE-GEWERBE HEALTH ${report.success?'GRÜN':'FEHLER'} · DEEP ${deepSimulation.passed}/250`,report);
 return report;
}
