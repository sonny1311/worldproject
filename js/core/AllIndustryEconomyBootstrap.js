// Lädt ausschließlich Diagnosen/Tests. Keine zweite Oberfläche, keine parallelen Spielsysteme.
import { runIndustryContentCoverageAudit } from "./IndustryContentCoverageAudit.js";
import { runAllIndustryEconomyRegression } from "./AllIndustryEconomyRegression.js";
import "./IndustryEconomyDiagnostics.js";
export function runAllIndustryEconomyHealth(){const coverage=runIndustryContentCoverageAudit(),regression=runAllIndustryEconomyRegression(),report={success:coverage.success&&regression.success,coverage,regression,ranAt:Date.now()};if(typeof window!=="undefined")window.worldAllIndustryEconomyHealth=report;return report;}
