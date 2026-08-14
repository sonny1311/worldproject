// WorldProject - Regression fuer spielbare Gewerbeketten, gemeinsame Waren-IDs und KI-Rueckzug.
import "../content/ContentBootstrap.js";
import { worldContentRegistry } from "./ContentRegistry.js";
import { runIndustryChainCatalogTest } from "./IndustryChainCatalogSupplement.js";
import { runIndustrySupplyChainAuditTest } from "./IndustrySupplyChainAudit.js";
import { runAdaptiveAiSupplyServiceTest } from "./AdaptiveAiSupplyService.js";
import { runIndustryRegistryBranchLookupTest } from "./IndustryRegistryBranchLookupIntegration.js";
const recipe=id=>worldContentRegistry.get("recipes",id);
const consumes=(branch,item)=>worldContentRegistry.list("recipes",{filter:r=>(r.industries||[]).includes(branch)&&Object.prototype.hasOwnProperty.call(r.materials||{},item)}).length>0;
export function runConnectedIndustryEconomyRegression(){
 const catalog=runIndustryChainCatalogTest(),audit=runIndustrySupplyChainAuditTest(),adaptive=runAdaptiveAiSupplyServiceTest(),lookup=runIndustryRegistryBranchLookupTest();
 const chains=[
  ["malt_barley","malt","brewery"],["grow_hops","hops","brewery"],["glass_033","bottles","brewery"],["caps_make","caps","brewery"],["labels_033_make","labels","brewery"],
  ["mill_wheat","flour_wheat","bakery"],["saw_softwood","softwood","carpentry"],["raise_pigs","pigs","slaughterhouse"],["slaughter_pork","pork","butcher"],
  ["steel_sheet_make","steel_sheet","mechanical"],["plastic_granulate_make","plastic_granulate","plastic"],["cardboard_make","cardboard","packaging_maker"]
 ];
 const broken=chains.filter(([producer,item,consumer])=>recipe(producer)?.product!==item||!consumes(consumer,item));
 if(broken.length)throw new Error(`Nicht durchgaengige Spielerketten: ${broken.map(x=>x.join("->")).join(", ")}`);
 const result={success:true,chainsChecked:chains.length,industryLinksChecked:audit.linksChecked,industriesChecked:audit.industriesChecked,catalog,adaptive,lookup};
 if(typeof window!=="undefined")window.worldConnectedIndustryEconomyRegression=result;return result;
}
try{const result=runConnectedIndustryEconomyRegression();console.log("✅ VERBUNDENE GEWERBEWIRTSCHAFT REGRESSION ERFOLGREICH",result);}catch(error){console.error("❌ VERBUNDENE GEWERBEWIRTSCHAFT REGRESSION FEHLGESCHLAGEN",error);if(typeof window!=="undefined")window.worldConnectedIndustryEconomyRegression={success:false,error:error?.message||String(error)};}
