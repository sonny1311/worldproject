// WorldProject - wendet die regionale KI-Rueckzugslogik auf die operativen KI-Lieferanten an.
import { worldContentRegistry, registerWorldContent } from "./ContentRegistry.js";
import { ensureExchange } from "./PlayerMarketExchange.js";
import { AdaptiveAiSupplyService } from "./AdaptiveAiSupplyService.js";
const service=new AdaptiveAiSupplyService();
const baseline=new Map();
const world=()=>window.worldProjectWorld||window.worldWorld||window.worldGameState||window;
const buyer=()=>window.worldPlayerCompany||window.worldActiveServerCompany||null;
function captureBaseline(){for(const s of worldContentRegistry.list("suppliers")){if(!baseline.has(s.id))baseline.set(s.id,{...s,materials:[...(s.materials||[])],prices:{...(s.prices||{})}});}return baseline.size;}
export function reconcileAdaptiveAiSupply(){
 if(typeof window==="undefined")return{success:true,suppressedMaterials:0,removedSuppliers:0,states:[]};
 captureBaseline();if(!baseline.size)return{success:true,suppressedMaterials:0,removedSuppliers:0,states:[]};
 const orders=ensureExchange(world()).orders||[],company=buyer(),states=[],activeIds=new Set(),suppressed=[];
 for(const [id,base] of baseline){
  const materials=[],prices={};
  for(const item of base.materials||[]){const state=service.evaluate(item,{buyer:company,orders,demand:company?.procurementDemand?.[item]||0});states.push({supplierId:id,...state});if(state.playerOnly){suppressed.push({supplierId:id,item,state});continue;}materials.push(item);if(Object.prototype.hasOwnProperty.call(base.prices||{},item))prices[item]=base.prices[item];}
  if(!materials.length){worldContentRegistry.remove("suppliers",id);continue;}
  registerWorldContent({suppliers:[{...base,materials,prices,sourceType:base.sourceType||"ai",adaptiveAi:true,hiddenMaterials:(base.materials||[]).filter(x=>!materials.includes(x))}]});activeIds.add(id);
 }
 const result={success:true,suppressedMaterials:suppressed.length,removedSuppliers:[...baseline.keys()].filter(id=>!activeIds.has(id)).length,states,suppressed,at:Date.now()};
 window.worldAdaptiveAiSupplyState=result;window.dispatchEvent(new CustomEvent("world:ai-supply-reconciled",{detail:result}));return result;
}
let timer=null;const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>reconcileAdaptiveAiSupply(),0);};
for(const eventName of ["world:player-market-dirty","worldproject:company-loaded","worldproject:company-founded","worldproject:company-switched","worldproject:company-activated"]){window.addEventListener(eventName,schedule);}
setTimeout(schedule,0);
window.worldAdaptiveAiSupplyRuntime={service,reconcile:reconcileAdaptiveAiSupply,state:()=>window.worldAdaptiveAiSupplyState||null};
