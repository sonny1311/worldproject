// WorldProject - erweiterbares Premium-/Entitlement-System
// Vorteile werden zentral konfiguriert, damit spaeter neue Premiumfunktionen ohne Umbau der Spiellogik ergaenzt werden koennen.
export const PremiumConfig={
 planId:"premium_monthly",
 label:"Premium",
 benefits:{
  concurrentConstruction:{standard:3,premium:5,label:"Parallele Bauauftraege"},
  storageMultiplier:{standard:1,premium:1.20,label:"Lagerkapazitaet"},
  productionQueue:{standard:0,premium:3,label:"Produktionswarteschlange"},
  automaticReorder:{standard:false,premium:true,label:"Automatische Mindestbestaende/Nachbestellung"},
  advancedAnalytics:{standard:false,premium:true,label:"Erweiterte Unternehmensauswertungen"}
 }
};

export class PremiumEntitlementSystem{
 constructor(config=PremiumConfig){this.config=config;}
 state(account={},now=Date.now()){const until=Number(account.premiumUntil||account.premium_until||0),active=until>Number(now);return {active,status:active?"active":(until?"expired":"none"),until};}
 benefit(account,key,now=Date.now()){const cfg=this.config.benefits[key];if(!cfg)throw new Error(`Unbekannter Premiumvorteil: ${key}`);return this.state(account,now).active?cfg.premium:cfg.standard;}
 activate(account,{until}={}){const value=Number(until||0);if(value<=Date.now())throw new Error("Premium-Enddatum muss in der Zukunft liegen");account.premiumUntil=value;return this.state(account);}
 deactivate(account){account.premiumUntil=0;return this.state(account);}
 constructionLimit(account){return Number(this.benefit(account,"concurrentConstruction"));}
 productionQueueLimit(account){return Number(this.benefit(account,"productionQueue"));}
 storageCapacity(account,baseCapacity){return Math.floor(Number(baseCapacity||0)*Number(this.benefit(account,"storageMultiplier")));}
 canStartConstruction(account,runningCount){return Number(runningCount||0)<this.constructionLimit(account);}
 canQueueProduction(account,queuedCount){return Number(queuedCount||0)<this.productionQueueLimit(account);}
 // Beim Ablauf wird nichts geloescht oder abgebrochen. Laufende Premium-Inhalte bleiben gespeichert,
 // neue Premiumaktionen werden nur solange blockiert, bis wieder Berechtigung besteht.
 overCapacityState(account,{baseStorage=0,currentStored=0,runningConstruction=0,queuedProduction=0}={}){const storage=this.storageCapacity(account,baseStorage),constructionLimit=this.constructionLimit(account),queueLimit=this.productionQueueLimit(account);return {storageCapacity:storage,storageOverfilled:Number(currentStored)>storage,constructionLimit,constructionOverLimit:Number(runningConstruction)>constructionLimit,productionQueueLimit:queueLimit,productionQueueOverLimit:Number(queuedProduction)>queueLimit};}
 listBenefits(account,now=Date.now()){const active=this.state(account,now).active;return Object.entries(this.config.benefits).map(([id,cfg])=>({id,label:cfg.label,value:active?cfg.premium:cfg.standard,premiumValue:cfg.premium,standardValue:cfg.standard,active}));}
}

export function runPremiumEntitlementTest(){const p=new PremiumEntitlementSystem(),a={premiumUntil:Date.now()+86400000};if(p.constructionLimit(a)!==5||p.productionQueueLimit(a)!==3||p.storageCapacity(a,10000)!==12000)throw new Error("Premiumvorteile fehlerhaft");a.premiumUntil=Date.now()-1;const expired=p.overCapacityState(a,{baseStorage:10000,currentStored:11500,runningConstruction:5,queuedProduction:3});if(!expired.storageOverfilled||!expired.constructionOverLimit||!expired.productionQueueOverLimit||p.storageCapacity(a,10000)!==10000)throw new Error("Premium-Ablauflogik fehlerhaft");console.log("✅ PREMIUM: 3→5 BAU, +20% LAGER, 0→3 PRODUKTIONSQUEUE, DATENERHALT BEI ABLAUF ERFOLGREICH",expired);return true;}
