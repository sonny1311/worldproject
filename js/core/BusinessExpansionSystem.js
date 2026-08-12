// WorldProject - Langzeit-Expansion und Betriebsausbau
// Neue Betriebe sind Meilensteine; bestehende Betriebe können sehr viele kleine Ausbaustufen erhalten.

export const UpgradeTracks={
 production:{label:"Produktion",maxLevel:100,baseCost:6500,costGrowth:1.075,bonusPerLevel:0.0125},
 storage:{label:"Lager",maxLevel:100,baseCost:4200,costGrowth:1.07,bonusPerLevel:0.015},
 efficiency:{label:"Effizienz",maxLevel:100,baseCost:7200,costGrowth:1.08,bonusPerLevel:0.006},
 quality:{label:"Qualität",maxLevel:100,baseCost:8000,costGrowth:1.08,bonusPerLevel:0.004},
 logistics:{label:"Logistik",maxLevel:100,baseCost:5500,costGrowth:1.075,bonusPerLevel:0.0075},
 administration:{label:"Verwaltung",maxLevel:100,baseCost:6000,costGrowth:1.08,bonusPerLevel:0.0075}
};

export function upgradeCost(track,level=0){const c=UpgradeTracks[track];if(!c)throw new Error("Unbekannter Ausbau");return Math.round(c.baseCost*Math.pow(c.costGrowth,Math.max(0,level)));}
export function upgradeBonus(track,level=0){const c=UpgradeTracks[track];if(!c)return 0;return Math.round(level*c.bonusPerLevel*10000)/10000;}

export function getUpgradeState(company){
 const src=company?.upgrades||company?.game_state?.upgrades||{};
 const out={};for(const key of Object.keys(UpgradeTracks))out[key]=Math.max(0,Number(src[key]||0));return out;
}

export function expansionRequirements(existingBusinesses=0){
 // Betrieb 1 ist der Spieleinstieg. Danach wachsen Kosten und Anforderungen progressiv.
 if(existingBusinesses<=0)return {creationCost:0,requiredNetWorth:0,requiredCashReserve:0,requiredManagement:0};
 const n=existingBusinesses;
 return {
  creationCost:Math.round(75000*Math.pow(1.72,n-1)),
  requiredNetWorth:Math.round(220000*Math.pow(1.62,n-1)),
  requiredCashReserve:Math.round(45000*Math.pow(1.55,n-1)),
  requiredManagement:n,
  administrationMultiplier:1+Math.max(0,n-1)*0.12
 };
}

export function estimateCompanyNetWorth(company={}){
 const cash=Number(company.money||0),assets=Number(company.assetValue||company.asset_value||0),fleet=Number(company.fleetValue||0),inventory=Number(company.inventoryValue||0),debt=Number(company.debt||0);
 return Math.max(0,cash+assets+fleet+inventory-debt);
}

export function canExpand({businesses=[],sourceCompany=null,managementCapacity=0}={}){
 const req=expansionRequirements(businesses.length),cash=Number(sourceCompany?.money||0),netWorth=businesses.reduce((s,c)=>s+estimateCompanyNetWorth(c),0);
 const reasons=[];
 if(businesses.length>0&&cash<req.creationCost+req.requiredCashReserve)reasons.push("Zu wenig Liquidität inklusive Reserve");
 if(netWorth<req.requiredNetWorth)reasons.push("Unternehmenswert noch zu niedrig");
 if(Number(managementCapacity||0)<req.requiredManagement)reasons.push("Management-Kapazität reicht nicht");
 return {allowed:reasons.length===0,reasons,requirements:req,cash,netWorth};
}

export function applyUpgrade(company,track){
 const cfg=UpgradeTracks[track];if(!cfg)throw new Error("Unbekannter Ausbau");
 company.upgrades=getUpgradeState(company);const level=company.upgrades[track];if(level>=cfg.maxLevel)throw new Error("Maximale Ausbaustufe erreicht");
 const cost=upgradeCost(track,level);if(Number(company.money||0)<cost)throw new Error("Nicht genügend Geld für Ausbau");
 company.money=Number(company.money||0)-cost;company.upgrades[track]=level+1;
 return {success:true,track,level:level+1,cost,bonus:upgradeBonus(track,level+1),nextCost:level+1<cfg.maxLevel?upgradeCost(track,level+1):null};
}

export function operationalModifiers(company){const u=getUpgradeState(company);return {
 productionMultiplier:1+upgradeBonus("production",u.production),
 storageMultiplier:1+upgradeBonus("storage",u.storage),
 operatingCostMultiplier:Math.max(.55,1-upgradeBonus("efficiency",u.efficiency)),
 qualityBonus:upgradeBonus("quality",u.quality),
 logisticsMultiplier:1+upgradeBonus("logistics",u.logistics),
 administrationMultiplier:1+upgradeBonus("administration",u.administration)
};}

export function runBusinessExpansionTest(){
 console.log("======================================");console.log("BETRIEBS-EXPANSIONS-/AUSBAUTEST");
 const c={money:1000000,upgrades:{}};const a=applyUpgrade(c,"production"),b=applyUpgrade(c,"storage");
 if(a.level!==1||b.level!==1||upgradeCost("production",1)<=a.cost)throw new Error("Ausbauprogression fehlerhaft");
 const r2=expansionRequirements(1),r3=expansionRequirements(2);if(r3.creationCost<=r2.creationCost)throw new Error("Expansionskosten steigen nicht");
 console.log("✅ BETRIEBS-EXPANSIONS-/AUSBAUTEST ERFOLGREICH",{a,b,r2,r3});
}
