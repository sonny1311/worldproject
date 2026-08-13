// Prüft, ob jedes angebotene Gewerbe tatsächlich Inhalte für Einkauf -> Leistung -> Verkauf besitzt.
import { IndustryProfiles } from "./IndustryCatalog.js";
import { worldContentRegistry } from "./ContentRegistry.js";
import { compatibleMachineIds } from "./IndustryMachineCompatibility.js";
const list=(type,key)=>worldContentRegistry.list(type).filter(x=>(x.industries||[]).includes(key));
export function auditIndustryContent(type){
 const p=IndustryProfiles[type],key=p.branchKey,company={type,branchKey:key,buildingState:{equipment:(p.equipment||[]).map(x=>({id:x.id}))}};
 const suppliers=list("suppliers",key),recipes=list("recipes",key).filter(x=>!x.deprecated),products=list("products",key).filter(x=>x.sellable!==false),materials=new Set(suppliers.flatMap(x=>x.materials||[]));
 const recipeInputs=new Set(recipes.flatMap(x=>Object.keys(x.materials||{}))),missingInputs=[...recipeInputs].filter(id=>!materials.has(id)&&!list("products",key).some(p=>p.id===id));
 const machineIds=new Set((p.equipment||[]).map(x=>x.id));
 const recipeMachines=recipes.map(x=>x.machineType).filter(Boolean),missingMachines=[...new Set(recipeMachines.filter(id=>!compatibleMachineIds(company,id).some(x=>machineIds.has(x))))];
 const issues=[];if(!suppliers.length)issues.push("keine Lieferanten");if(!recipes.length)issues.push("kein Leistungs-/Produktionsrezept");if(!products.length)issues.push("kein verkaufbares Produkt/Leistung");if(missingInputs.length)issues.push(`nicht beschaffbare Inputs: ${missingInputs.join(", ")}`);if(missingMachines.length)issues.push(`Rezeptmaschinen nicht im Betriebskatalog: ${missingMachines.join(", ")}`);
 return{type,branchKey:key,suppliers:suppliers.length,recipes:recipes.length,products:products.length,missingInputs,missingMachines,issues,success:issues.length===0};
}
export function runIndustryContentCoverageAudit(){const rows=Object.keys(IndustryProfiles).map(auditIndustryContent),failed=rows.filter(x=>!x.success),report={success:failed.length===0,total:rows.length,passed:rows.length-failed.length,failed,rows};if(typeof window!=="undefined")window.worldIndustryContentCoverage=report;console[report.success?"log":"warn"](`${report.success?'✅':'⚠️'} GEWERBE-INHALT ${report.passed}/${report.total}`,report);return report;}
