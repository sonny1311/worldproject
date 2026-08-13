// Diagnosehilfen für die vorhandene UI: Was fehlt einem Gewerbe konkret?
import { IndustryProfiles } from "./IndustryCatalog.js";
import { worldContentRegistry } from "./ContentRegistry.js";
import { auditIndustryContent } from "./IndustryContentCoverageAudit.js";
const all=t=>worldContentRegistry.list(t)||[];
export function industryEconomyDiagnostics(type){const p=IndustryProfiles[type];if(!p)return null;const key=p.branchKey,a=auditIndustryContent(type),suppliers=all("suppliers").filter(x=>(x.industries||[]).includes(key)),recipes=all("recipes").filter(x=>(x.industries||[]).includes(key)&&!x.deprecated),products=all("products").filter(x=>(x.industries||[]).includes(key)&&x.sellable!==false);return{type,label:p.label,branchKey:key,success:a.success,issues:a.issues,suppliers:suppliers.map(s=>({id:s.id,label:s.label,deliveryHours:s.deliveryHours,materials:s.materials})),recipes:recipes.map(r=>({id:r.id,label:r.label,machineType:r.machineType,durationMinutes:r.durationMinutes,output:r.output,outputUnit:r.outputUnit||"Stk",product:r.product,materials:r.materials})),products:products.map(x=>({id:x.id,label:x.label,unit:x.unit})),equipment:(p.equipment||[]).map(x=>({id:x.id,name:x.name,price:x.price,required:x.required!==false}))};}
export function allIndustryEconomyDiagnostics(){return Object.keys(IndustryProfiles).map(industryEconomyDiagnostics);}
if(typeof window!=="undefined"){window.worldIndustryEconomyDiagnostics=industryEconomyDiagnostics;window.worldAllIndustryEconomyDiagnostics=allIndustryEconomyDiagnostics;}
