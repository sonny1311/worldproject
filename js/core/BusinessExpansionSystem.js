// WorldProject - Langzeit-Expansion und Betriebsausbau
// Neue Betriebe sind Meilensteine; bestehende Betriebe koennen sehr viele kleine Ausbaustufen erhalten.
// WICHTIG: Ausbauten werden zeitbasiert gestartet; keine Sofortwirkung mehr.
import { BusinessUpgradeSystem } from "./BusinessUpgradeSystem.js";

export const UpgradeTracks={
 production:{label:"Produktion",maxLevel:100,baseCost:6500,costGrowth:1.075,bonusPerLevel:0.0125},
 storage:{label:"Lager",maxLevel:100,baseCost:4200,costGrowth:1.07,bonusPerLevel:0.015},
 efficiency:{label:"Effizienz",maxLevel:100,baseCost:7200,costGrowth:1.08,bonusPerLevel:0.006},
 quality:{label:"Qualitaet",maxLevel:100,baseCost:8000,costGrowth:1.08,bonusPerLevel:0.004},
 logistics:{label:"Logistik",maxLevel:100,baseCost:5500,costGrowth:1.075,bonusPerLevel:0.0075},
 administration:{label:"Verwaltung",maxLevel:100,baseCost:6000,costGrowth:1.08,bonusPerLevel:0.0075}
};

export function upgradeCost(track,level=0){const c=UpgradeTracks[track];if(!c)throw new Error("Unbekannter Ausbau");return Math.round(c.baseCost*Math.pow(c.costGrowth,Math.max(0,level)));}
export function upgradeBonus(track,level=0){const c=UpgradeTracks[track];if(!c)return 0;return Math.round(level*c.bonusPerLevel*10000)/10000;}

export function getUpgradeState(company){const src=company?.upgrades||company?.game_state?.upgrades||{};const out={};for(const key of Object.keys(UpgradeTracks))out[key]=Math.max(0,Number(src[key]||0));return out;}

export function expansionRequirements(existingBusinesses=0){if(existingBusinesses<=0)return {creationCost:0,requiredNetWorth:0,requiredCashReserve:0,requiredManagement:0};const n=existingBusinesses;return {creationCost:Math.round(75000*Math.pow(1.72,n-1)),requiredNetWorth:Math.round(220000*Math.pow(1.62,n-1)),requiredCashReserve:Math.round(45000*Math.pow(1.55,n-1)),requiredManagement:n,administrationMultiplier:1+Math.max(0,n-1)*0.12};}

export function estimateCompanyNetWorth(company={}){const cash=Number(company.money||0),assets=Number(company.assetValue||company.asset_value||0),fleet=Number(company.fleetValue||0),inventory=Number(company.inventoryValue||0),debt=Number(company.debt||0);return Math.max(0,cash+assets+fleet+inventory-debt);}

export function canExpand({businesses=[],sourceCompany=null,managementCapacity=0}={}){const req=expansionRequirements(businesses.length),cash=Number(sourceCompany?.money||0),netWorth=businesses.reduce((s,c)=>s+estimateCompanyNetWorth(c),0);const reasons=[];if(businesses.length>0&&cash<req.creationCost+req.requiredCashReserve)reasons.push("Zu wenig Liquiditaet inklusive Reserve");if(netWorth<req.requiredNetWorth)reasons.push("Unternehmenswert noch zu niedrig");if(Number(managementCapacity||0)<req.requiredManagement)reasons.push("Management-Kapazitaet reicht nicht");return {allowed:reasons.length===0,reasons,requirements:req,cash,netWorth};}

// Rueckwaertskompatibler Einstieg fuer alte Aufrufer. Auch dieser Weg startet jetzt nur noch
// einen zeitbasierten Auftrag. Die eigentliche Stufe wird erst bei dessen Abschluss aktiviert.
export function applyUpgrade(company,track,{now=Date.now()}={}){const system=new BusinessUpgradeSystem();return system.startUpgrade(company,track,{now});}

export function operationalModifiers(company){const u=getUpgradeState(company);return {productionMultiplier:1+upgradeBonus("production",u.production),storageMultiplier:1+upgradeBonus("storage",u.storage),operatingCostMultiplier:Math.max(.55,1-upgradeBonus("efficiency",u.efficiency)),qualityBonus:upgradeBonus("quality",u.quality),logisticsMultiplier:1+upgradeBonus("logistics",u.logistics),administrationMultiplier:1+upgradeBonus("administration",u.administration)};}

export function runBusinessExpansionTest(){console.log("======================================");console.log("BETRIEBS-EXPANSIONS-/AUSBAUTEST");const start=1000000,c={money:1000000,upgrades:{}};const a=applyUpgrade(c,"production",{now:start}),b=applyUpgrade(c,"storage",{now:start});if(c.upgrades.production||c.upgrades.storage)throw new Error("Ausbau darf nicht sofort wirksam werden");if(!a.pending||!b.pending||!a.job?.finishAt||!b.job?.finishAt)throw new Error("Zeitbasierter Ausbauauftrag fehlt");const system=new BusinessUpgradeSystem();system.process(c,Math.max(a.job.finishAt,b.job.finishAt));if(c.upgrades.production!==1||c.upgrades.storage!==1)throw new Error("Fertiger Ausbau wird nicht aktiviert");const r2=expansionRequirements(1),r3=expansionRequirements(2);if(r3.creationCost<=r2.creationCost)throw new Error("Expansionskosten steigen nicht");console.log("✅ BETRIEBS-EXPANSIONS-/AUSBAUTEST ERFOLGREICH",{a,b,r2,r3});return true;}
