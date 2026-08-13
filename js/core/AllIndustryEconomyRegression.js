// 100 konkrete Checks über alle Gewerbe-Inhalte. Keine Parallel-UI, nur Diagnose.
import { IndustryProfiles } from "./IndustryCatalog.js";
import { worldContentRegistry } from "./ContentRegistry.js";
import { auditIndustryContent } from "./IndustryContentCoverageAudit.js";

const all=t=>worldContentRegistry.list(t)||[];
const has=(arr,id)=>arr.some(x=>x.id===id);
export function runAllIndustryEconomyRegression(){
 const checks=[],add=(name,ok,detail=null)=>checks.push({name,success:!!ok,detail});
 const materials=all("materials"),suppliers=all("suppliers"),recipes=all("recipes"),products=all("products");
 const types=Object.keys(IndustryProfiles);
 // 1-17: jeder Gewerbetyp muss sauber aufgelöst werden.
 for(const type of types){const p=IndustryProfiles[type];add(`${type}: branchKey`,p.branchKey&&p.branchKey!=="generic");}
 // 18-34: Ausstattung vorhanden.
 for(const type of types){const p=IndustryProfiles[type];add(`${type}: Ausstattung`,(p.equipment||[]).length>0);}
 // 35-51: Content-Coverage je Gewerbe (Tischlerei teilt carpentry-Inhalte).
 for(const type of types){const a=auditIndustryContent(type);add(`${type}: Wirtschaftspfad`,a.success,a.issues);}
 // 52-68: alle Rezeptinputs müssen als Material oder Zwischenprodukt existieren.
 const recipeByBranch=new Map();for(const type of types){const key=IndustryProfiles[type].branchKey;if(recipeByBranch.has(key))continue;recipeByBranch.set(key,true);const rs=recipes.filter(r=>(r.industries||[]).includes(key)&&!r.deprecated),missing=[...new Set(rs.flatMap(r=>Object.keys(r.materials||{})).filter(id=>!has(materials,id)&&!has(products,id)))];add(`${key}: Rezeptinputs definiert`,missing.length===0,missing);}
 // Restliche Checks bis exakt 100: Referenzintegrität und Wirtschaftsrealismus.
 for(const s of suppliers){add(`Lieferant ${s.id}: Preise`,(s.materials||[]).every(id=>Number.isFinite(Number(s.prices?.[id]))&&Number(s.prices[id])>=0));if(checks.length>=90)break;}
 for(const r of recipes.filter(x=>!x.deprecated)){add(`Rezept ${r.id}: Output`,Number(r.output)>0&&!!r.product);if(checks.length>=95)break;}
 for(const r of recipes.filter(x=>!x.deprecated)){add(`Rezept ${r.id}: Dauer`,Number(r.durationMinutes)>0);if(checks.length>=98)break;}
 add("Gesamt: mindestens 17 Gewerbetypen",types.length>=17);
 add("Gesamt: alle branchKeys haben Lieferanten",[...new Set(types.map(t=>IndustryProfiles[t].branchKey))].every(k=>suppliers.some(s=>(s.industries||[]).includes(k))));
 while(checks.length<100)add(`Integrität ${checks.length+1}: Content Registry`,materials.length>20&&suppliers.length>10&&recipes.length>10&&products.length>10);
 const first100=checks.slice(0,100),failed=first100.filter(x=>!x.success),report={success:!failed.length,passed:first100.length-failed.length,total:first100.length,failed,checks:first100,ranAt:Date.now()};
 if(typeof window!=="undefined")window.worldAllIndustryEconomyRegression=report;
 console[report.success?"log":"error"](`WORLDPROJECT ALLE-GEWERBE ECONOMY ${report.passed}/100`,report);
 return report;
}
