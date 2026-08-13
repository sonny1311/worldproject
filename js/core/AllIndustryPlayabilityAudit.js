// WorldProject - prueft alle im IndustryCatalog angebotenen Gewerbe auf einen spielbaren Grundpfad.
import { IndustryProfiles } from "./IndustryCatalog.js";
import { machineCatalogFor, buyMachine, runUniversalBusinessOperationsTest } from "./UniversalBusinessOperations.js";
import { jobsFor, generateApplicants, hireApplicant, runUniversalWorkforceTest } from "./UniversalWorkforceMarket.js";
import { businessKpis, runUniversalPlanningTest } from "./UniversalPlanningAndProcurement.js";

export function auditIndustry(type){
 const profile=IndustryProfiles[type],company={type,money:1000000,buildingState:{equipment:[]},employees:[],inventory:{},customerOrders:[]};const issues=[];
 if(!profile?.branchKey||profile.branchKey==="generic")issues.push("kein eindeutiger branchKey");
 const machines=machineCatalogFor(company);if(!machines.length)issues.push("kein Maschinen-/Ausstattungskatalog");
 for(const required of profile.requiredEquipment||[]){const def=machines.find(x=>x.id===required);if(!def){issues.push(`Pflichtausstattung ${required} nicht kaufbar`);continue;}try{buyMachine(company,required,{requestId:`audit-${type}-${required}`});}catch(e){issues.push(`Kauf ${required}: ${e.message}`);}}
 const jobs=jobsFor(company),apps=generateApplicants(company,{count:4,seed:123456});if(!jobs.length)issues.push("keine Personalrollen");if(!apps.length)issues.push("keine Bewerber");else try{hireApplicant(company,apps[0],{requestId:`audit-hire-${type}`});}catch(e){issues.push(`Einstellung: ${e.message}`);}
 const kpi=businessKpis(company);if(kpi.branchKey!==profile.branchKey)issues.push("KPI branchKey inkonsistent");
 return{type,label:profile.label,branchKey:profile.branchKey,requiredEquipment:(profile.requiredEquipment||[]).length,ownedEquipment:company.buildingState.equipment.length,jobs:jobs.length,issues,success:issues.length===0};
}
export function runAllIndustryPlayabilityAudit(){const industries=Object.keys(IndustryProfiles).map(auditIndustry),failed=industries.filter(x=>!x.success);const componentTests=[runUniversalBusinessOperationsTest(),runUniversalWorkforceTest(),runUniversalPlanningTest()];const componentFailures=componentTests.filter(x=>!x.success);const success=!failed.length&&!componentFailures.length;const report={success,totalIndustries:industries.length,playableIndustries:industries.length-failed.length,failedIndustries:failed,industries,componentTests};if(typeof window!=="undefined")window.worldAllIndustryPlayability=report;console[success?"log":"error"](success?`✅ ALLE GEWERBE BASIS-SPIELBAR ${industries.length}/${industries.length}`:`❌ GEWERBE-AUDIT ${industries.length-failed.length}/${industries.length}`,report);return report;}
