// WorldProject - gebuendelter, nicht-interaktiver Kernregressionstest.
// Keine Dialoge; nur reproduzierbare Logiktests mit klarer Fehlerliste.
import "../content/ContentBootstrap.js";
import { runTransportGameplayIntegrationTest } from "./TransportGameplayIntegration.js";
import { runAdvancedEconomyTest } from "./AdvancedEconomySystem.js";
import { SupplyOrderSystem, WarehouseSystem } from "./OperationalSupplyChainSystem.js";
import { runOperationalSupplyChainRegressionTest } from "./OperationalSupplyChainRegressionTest.js";
import { runOperationalSupplyTransactionTest } from "./OperationalSupplyTransactions.js";
import { runExtendedCoreRegression } from "./ExtendedCoreRegression.js";
import { worldContentRegistry } from "./ContentRegistry.js";

export function runCoreRegressionSuite(){
 const results=[],run=(name,fn)=>{try{const value=fn();const success=value===true||value?.success===true;results.push({name,success,value});if(!success)console.error(`❌ CORE-REGRESSION ${name}`,value);}catch(error){results.push({name,success:false,error:error?.message||String(error)});console.error(`❌ CORE-REGRESSION ${name}`,error);}};
 run("Transport",()=>runTransportGameplayIntegrationTest());
 run("Advanced Economy",()=>runAdvancedEconomyTest());
 run("Operational Supply 25",()=>runOperationalSupplyChainRegressionTest());
 run("Supply Transactions",()=>runOperationalSupplyTransactionTest({SupplyOrderSystem,WarehouseSystem,supplier:worldContentRegistry.get("suppliers","brew_malt_regional")}));
 run("Extended Core",()=>runExtendedCoreRegression());
 const failed=results.filter(r=>!r.success),success=failed.length===0,passed=results.length-failed.length,score=Math.round(passed/Math.max(1,results.length)*100);
 const summary={success,score,passed,total:results.length,failed:failed.map(x=>({name:x.name,error:x.error||x.value?.failed||null})),results,ranAt:Date.now()};
 console[success?"log":"error"](success?`✅ WORLDPROJECT CORE HEALTH ${score}/100`:`❌ WORLDPROJECT CORE HEALTH ${score}/100`,summary);
 window.worldCoreRegression=summary;window.worldProjectHealth=summary;
 return summary;
}

// Der Test ist rein logisch und oeffnet keine UI. Ein Lauf beim Bootstrap macht Regressionen sofort sichtbar.
runCoreRegressionSuite();
