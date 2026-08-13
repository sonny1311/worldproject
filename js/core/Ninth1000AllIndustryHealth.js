// WorldProject – branchenübergreifender Smokecheck für den neunten 1000er-Block.
import { runIndustryContentCoverageAudit } from './IndustryContentCoverageAudit.js';
import { runPlayability2HealthCheck } from './IndustryPlayabilityMatrix.js';
import { runUniversalWorkforceTest } from './UniversalWorkforceMarket.js';
import { industryScenarioMatrix } from './IndustryScenarioMatrix.js';
import { IndustryProfiles } from './IndustryCatalog.js';

export function runNinth1000AllIndustryHealth(){
 const coverage=runIndustryContentCoverageAudit();
 const playability=runPlayability2HealthCheck();
 const workforce=runUniversalWorkforceTest();
 const scenarios=industryScenarioMatrix();
 const branchKeys=new Set(Object.values(IndustryProfiles).map(x=>x.branchKey));
 const scenarioBranches=new Set(scenarios.map(x=>x.branchKey));
 const missingScenarioBranches=[...branchKeys].filter(x=>!scenarioBranches.has(x));
 const checks=[
  {name:'Content-Abdeckung berechenbar',success:!!coverage&&Array.isArray(coverage.rows)},
  {name:'Spielbarkeitsmatrix berechenbar',success:!!playability&&Array.isArray(playability.matrix)},
  {name:'Personalmarkt-Test berechenbar',success:!!workforce&&Array.isArray(workforce.checks)},
  {name:'Szenarien für alle Branchen',success:missingScenarioBranches.length===0,missing:missingScenarioBranches}
 ];
 const failed=checks.filter(x=>!x.success);
 const report={success:failed.length===0,checks,failed,coverage,playability,workforce,scenarioCount:scenarios.length,ranAt:Date.now()};
 if(typeof window!=='undefined')window.worldNinth1000AllIndustryHealth=report;
 return report;
}
if(typeof window!=='undefined')window.runNinth1000AllIndustryHealth=runNinth1000AllIndustryHealth;
