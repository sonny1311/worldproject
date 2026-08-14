// WorldProject - prueft alle spielbaren Branchen auf geschlossene Beschaffungsketten.
import { worldContentRegistry } from "./ContentRegistry.js";
import { IndustryProfiles } from "./IndustryCatalog.js";

const branchRecipes=branch=>worldContentRegistry.list("recipes",{filter:r=>(r.industries||[]).includes(branch)&&!r.deprecated});
const producersFor=item=>worldContentRegistry.list("recipes",{filter:r=>r.product===item&&!r.deprecated}).map(r=>({recipeId:r.id,industries:r.industries||[]}));
const suppliersFor=(branch,item)=>worldContentRegistry.list("suppliers",{filter:s=>(s.industries||[]).includes(branch)&&(s.materials||[]).includes(item)});
export function auditIndustrySupplyChains(){
 const rows=[];
 for(const [type,profile] of Object.entries(IndustryProfiles)){
  const branch=profile.branchKey,recipes=branchRecipes(branch),inputs=new Set(recipes.flatMap(r=>Object.keys(r.materials||{})));
  for(const item of inputs){
   const allProducers=producersFor(item),internal=allProducers.filter(p=>p.industries.includes(branch)),external=allProducers.filter(p=>!p.industries.includes(branch)),suppliers=suppliersFor(branch,item),material=worldContentRegistry.get("materials",item),covered=allProducers.length>0||suppliers.length>0;
   rows.push({type,branch,item,label:material?.label||item,covered,internalProduction:internal.length>0,internalRecipeIds:internal.map(p=>p.recipeId),playerProducer:external.length>0,producerIndustries:[...new Set(external.flatMap(p=>p.industries))],aiFallback:suppliers.length>0,supplierIds:suppliers.map(s=>s.id)});
  }
 }
 const missing=rows.filter(x=>!x.covered),industries=[...new Set(rows.map(x=>x.type))],success=missing.length===0;
 return{success,industriesChecked:industries.length,linksChecked:rows.length,missing,rows};
}
export function runIndustrySupplyChainAuditTest(){const result=auditIndustrySupplyChains();if(!result.success)throw new Error(`Offene Versorgungsketten: ${result.missing.map(x=>`${x.type}:${x.item}`).join(", ")}`);return result;}
if(typeof window!=="undefined")window.worldIndustrySupplyChainAudit=auditIndustrySupplyChains;
