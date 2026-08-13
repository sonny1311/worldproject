// Lädt ausschließlich Diagnosen/Tests. Keine zweite Oberfläche, keine parallelen Spielsysteme.
import { runIndustryContentCoverageAudit } from "./IndustryContentCoverageAudit.js";
import { runAllIndustryEconomyRegression } from "./AllIndustryEconomyRegression.js";
import { runAllIndustryLifecycleRegression } from "./AllIndustryLifecycleRegression.js";
import "./IndustryEconomyDiagnostics.js";
export function runAllIndustryEconomyHealth(){
 const coverage=runIndustryContentCoverageAudit();
 const regression=runAllIndustryEconomyRegression();
 const lifecycle=runAllIndustryLifecycleRegression();
 const report={success:coverage.success&&regression.success&&lifecycle.success,coverage,regression,lifecycle,ranAt:Date.now()};
 if(typeof window!=="undefined")window.worldAllIndustryEconomyHealth=report;
 console[report.success?"log":"error"](`WORLDPROJECT ALLE-GEWERBE HEALTH ${report.success?'GRÜN':'FEHLER'}`,report);
 return report;
}
