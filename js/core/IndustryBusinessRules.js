// WorldProject – branchenspezifische Betriebsregeln statt Einheitslogik.
import { getIndustryProfile } from './IndustryCatalog.js';
const RULES={
 brewery:{perishable:true,coldChain:true,hygiene:1,setupLoad:.7,qualityRisk:.5,capitalBinding:.65,cycleType:'batch'},
 beverage:{perishable:true,coldChain:false,hygiene:.9,setupLoad:.45,qualityRisk:.35,capitalBinding:.5,cycleType:'batch'},
 bakery:{perishable:true,coldChain:false,hygiene:1,setupLoad:.35,qualityRisk:.5,capitalBinding:.25,cycleType:'daily'},
 butcher:{perishable:true,coldChain:true,hygiene:1,setupLoad:.45,qualityRisk:.7,capitalBinding:.4,cycleType:'daily'},
 food:{perishable:true,coldChain:false,hygiene:1,setupLoad:.5,qualityRisk:.55,capitalBinding:.5,cycleType:'batch'},
 farm:{perishable:false,coldChain:false,hygiene:.3,setupLoad:.6,qualityRisk:.35,capitalBinding:.75,cycleType:'seasonal'},
 livestock:{perishable:true,coldChain:true,hygiene:.8,setupLoad:.25,qualityRisk:.55,capitalBinding:.8,cycleType:'continuous'},
 orchard:{perishable:true,coldChain:false,hygiene:.45,setupLoad:.35,qualityRisk:.4,capitalBinding:.7,cycleType:'seasonal'},
 carpentry:{perishable:false,coldChain:false,hygiene:.1,setupLoad:.65,qualityRisk:.35,capitalBinding:.55,cycleType:'job'},
 mechanical:{perishable:false,coldChain:false,hygiene:.1,setupLoad:.85,qualityRisk:.5,capitalBinding:.8,cycleType:'job'},
 metal:{perishable:false,coldChain:false,hygiene:.1,setupLoad:.8,qualityRisk:.5,capitalBinding:.7,cycleType:'job'},
 plastic:{perishable:false,coldChain:false,hygiene:.15,setupLoad:.75,qualityRisk:.45,capitalBinding:.7,cycleType:'batch'},
 retail:{perishable:false,coldChain:false,hygiene:.15,setupLoad:.1,qualityRisk:.15,capitalBinding:.65,cycleType:'turnover'},
 wholesale:{perishable:false,coldChain:false,hygiene:.1,setupLoad:.1,qualityRisk:.15,capitalBinding:.85,cycleType:'turnover'},
 online_retail:{perishable:false,coldChain:false,hygiene:.05,setupLoad:.15,qualityRisk:.2,capitalBinding:.55,cycleType:'fulfillment'}
};
const key=c=>c?.branchKey||getIndustryProfile(c).branchKey;
export function industryBusinessRules(company){return{branchKey:key(company),...(RULES[key(company)]||{perishable:false,coldChain:false,hygiene:.2,setupLoad:.5,qualityRisk:.3,capitalBinding:.5,cycleType:'job'})};}
export function operationalMultipliers(company,{quality=1,season=1}={}){const r=industryBusinessRules(company);return{setupTime:1+r.setupLoad*.4,workingCapital:1+r.capitalBinding*.5,qualityLoss:Math.max(0,(1-Number(quality||1))*r.qualityRisk),seasonality:r.cycleType==='seasonal'?Number(season||1):1,coldChainCost:r.coldChain?1.12:1,hygieneCost:1+r.hygiene*.06};}
export function businessRuleWarnings(company){const r=industryBusinessRules(company),out=[];if(r.coldChain&&!company.buildingState?.equipment?.some(x=>['cold_storage','cold_room','fruit_storage'].includes(typeof x==='string'?x:x.id)))out.push({severity:'critical',code:'cold_chain',text:'Kühlpflichtige Branche ohne passende Kühltechnik'});if(r.hygiene>=.8&&!company.compliance?.permits?.length)out.push({severity:'warning',code:'hygiene',text:'Hohe Hygieneanforderung – Compliance prüfen'});return out;}
if(typeof window!=='undefined')window.worldIndustryRules={get:industryBusinessRules,multipliers:operationalMultipliers,warnings:businessRuleWarnings};
