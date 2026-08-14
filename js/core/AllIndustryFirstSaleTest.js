// WorldProject – vollständiger Test: Beschaffen -> Produzieren/Leisten -> Verkaufen.
import { IndustryProfiles } from "./IndustryCatalog.js";
import { procureInstantForTest,startIndustryJob,finishIndustryJob,sellIndustryOutput,industryRecipes } from "./UniversalIndustryCycle.js";
import { machineCatalogFor,buyMachine } from "./UniversalBusinessOperations.js";
import { machineRequirementSatisfied } from "./IndustryMachineCompatibility.js";
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
function clone(v){return JSON.parse(JSON.stringify(v));}
function priceFor(recipe){const unit=Math.max(.01,n(recipe.variableCost)/Math.max(1,n(recipe.output,1)));return unit*2+1;}
export function simulateIndustryFirstSale(type){const p=IndustryProfiles[type],c={type,branchKey:p.branchKey,money:500000,buildingState:{equipment:[]},employees:[],inventory:{},finishedGoods:{}};const steps=[];try{
 for(const id of p.requiredEquipment||[]){const def=machineCatalogFor(c).find(x=>x.id===id);if(!def)throw new Error(`Pflichtausstattung fehlt im Katalog: ${id}`);buyMachine(c,id,{requestId:`eq-${type}-${id}`});steps.push(`Ausstattung ${id}`);}
 const recipes=industryRecipes(c);if(!recipes.length)throw new Error("Kein Rezept/Arbeitsablauf");
 // Nicht stumpf recipes[0] verwenden: optionale Spezialprozesse (z.B. Flaschenwaschen)
 // koennen durch Content-Reihenfolge vor dem regulaeren Starterprozess stehen.
 const selected=recipes.find(recipe=>machineRequirementSatisfied(c,recipe.machineType));
 if(!selected)throw new Error("Kein Arbeitsablauf mit der vorhandenen Pflichtausstattung startbar");
 const r=clone(selected),amount=Math.max(1,n(r.output,1));
 for(const[id,q]of Object.entries(r.materials||{})){procureInstantForTest(c,id,n(q));steps.push(`Beschaffung ${id}`);}
 const start=startIndustryJob(c,r.id,amount,{requestId:`start-${type}`,now:1000});steps.push("Start");finishIndustryJob(c,start.job.id,{now:start.job.endsAt,force:true});steps.push("Fertigstellung");const before=c.money,sale=sellIndustryOutput(c,r.product,amount,priceFor(r),{requestId:`sale-${type}`,now:start.job.endsAt+1});steps.push("Verkauf");return{type,branchKey:p.branchKey,success:sale.revenue>0&&c.money>before,steps,revenue:sale.revenue,balance:c.money,recipe:r.id,product:r.product};
 }catch(error){return{type,branchKey:p?.branchKey||"unknown",success:false,steps,error:error.message};}}
export function runAllIndustryFirstSaleTest(){const rows=Object.keys(IndustryProfiles).map(simulateIndustryFirstSale),failed=rows.filter(x=>!x.success),report={success:failed.length===0,total:rows.length,passed:rows.length-failed.length,failed,rows};if(typeof window!=="undefined")window.worldAllIndustryFirstSale=report;console[report.success?"log":"error"](`WORLDPROJECT ERSTER-VERKAUF ${report.passed}/${report.total}`,report);return report;}
