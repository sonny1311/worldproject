// WorldProject - erweiterbares Premium-/Entitlement-System
// Premium bringt Komfort und mehr Verwaltungsmoeglichkeiten, aber keine monatlichen Gratis-Coins.
export const PremiumConfig={
 planId:"premium_monthly",label:"Premium",benefits:{
  concurrentConstruction:{standard:3,premium:5,label:"Parallele Bauauftraege"},
  storageMultiplier:{standard:1,premium:1.20,label:"Lagerkapazitaet"},
  productionQueue:{standard:0,premium:3,label:"Produktionswarteschlange"},
  automationSlots:{standard:0,premium:3,label:"Automatisierungs-Slots"},
  recipeTemplates:{standard:2,premium:12,label:"Rezeptvorlagen"},
  vehicleAssignments:{standard:2,premium:10,label:"Gespeicherte Fahrzeugzuweisungen"},
  priceAlerts:{standard:0,premium:10,label:"Preisalarme"},
  profileDesignSlots:{standard:1,premium:6,label:"Profil-/Gestaltungs-Slots"},
  automaticReorder:{standard:false,premium:true,label:"Automatische Mindestbestaende/Nachbestellung"},
  advancedAnalytics:{standard:false,premium:true,label:"Erweiterte Unternehmensauswertungen"},
  guidedSetupNavigation:{standard:false,premium:true,label:"Direkte Hilfe zu fehlenden Voraussetzungen"},
  automaticStaffAssignment:{standard:false,premium:true,label:"Automatische Personalzuweisung"},
  smartDeliveryQuantity:{standard:false,premium:true,label:"Intelligenter Liefermengenvorschlag"}
 }};
export class PremiumEntitlementSystem{
 constructor(config=PremiumConfig){this.config=config;}
 state(account={},now=Date.now()){const until=Number(account.premiumUntil||account.premium_until||0),active=until>Number(now);return{active,status:active?'active':(until?'expired':'none'),until};}
 benefit(account,key,now=Date.now()){const cfg=this.config.benefits[key];if(!cfg)throw new Error(`Unbekannter Premiumvorteil: ${key}`);return this.state(account,now).active?cfg.premium:cfg.standard;}
 activate(account,{until}={}){const value=Number(until||0);if(value<=Date.now())throw new Error('Premium-Enddatum muss in der Zukunft liegen');account.premiumUntil=value;return this.state(account);}
 deactivate(account){account.premiumUntil=0;return this.state(account);}
 constructionLimit(account,now=Date.now()){return Number(this.benefit(account,'concurrentConstruction',now));}
 productionQueueLimit(account,now=Date.now()){return Number(this.benefit(account,'productionQueue',now));}
 storageCapacity(account,baseCapacity,now=Date.now()){return Math.floor(Number(baseCapacity||0)*Number(this.benefit(account,'storageMultiplier',now)));}
 limit(account,key,now=Date.now()){return Number(this.benefit(account,key,now));}
 canStartConstruction(account,runningCount,now=Date.now()){return Number(runningCount||0)<this.constructionLimit(account,now);}
 canQueueProduction(account,queuedCount,now=Date.now()){return Number(queuedCount||0)<this.productionQueueLimit(account,now);}
 canUseGuidedSetupNavigation(account,now=Date.now()){return Boolean(this.benefit(account,'guidedSetupNavigation',now));}
 canUseAutomaticStaffAssignment(account,now=Date.now()){return Boolean(this.benefit(account,'automaticStaffAssignment',now));}
 canUseSmartDeliveryQuantity(account,now=Date.now()){return Boolean(this.benefit(account,'smartDeliveryQuantity',now));}
 overCapacityState(account,{baseStorage=0,currentStored=0,runningConstruction=0,queuedProduction=0,now=Date.now()}={}){const storage=this.storageCapacity(account,baseStorage,now),constructionLimit=this.constructionLimit(account,now),queueLimit=this.productionQueueLimit(account,now);return{storageCapacity:storage,storageOverfilled:Number(currentStored)>storage,constructionLimit,constructionOverLimit:Number(runningConstruction)>constructionLimit,productionQueueLimit:queueLimit,productionQueueOverLimit:Number(queuedProduction)>queueLimit};}
 listBenefits(account,now=Date.now()){const active=this.state(account,now).active;return Object.entries(this.config.benefits).map(([id,cfg])=>({id,label:cfg.label,value:active?cfg.premium:cfg.standard,premiumValue:cfg.premium,standardValue:cfg.standard,active}));}
}
export function runPremiumEntitlementTest(){const now=1000000,p=new PremiumEntitlementSystem(),a={premiumUntil:now+86400000};if(p.constructionLimit(a,now)!==5||p.productionQueueLimit(a,now)!==3||p.storageCapacity(a,10000,now)!==12000||p.limit(a,'automationSlots',now)!==3||p.limit(a,'recipeTemplates',now)!==12||p.limit(a,'vehicleAssignments',now)!==10||p.limit(a,'priceAlerts',now)!==10||p.limit(a,'profileDesignSlots',now)!==6||!p.canUseGuidedSetupNavigation(a,now)||!p.canUseAutomaticStaffAssignment(a,now)||!p.canUseSmartDeliveryQuantity(a,now))throw new Error('Premiumvorteile fehlerhaft');a.premiumUntil=now-1;const expired=p.overCapacityState(a,{baseStorage:10000,currentStored:11500,runningConstruction:5,queuedProduction:3,now});if(!expired.storageOverfilled||!expired.constructionOverLimit||!expired.productionQueueOverLimit||p.storageCapacity(a,10000,now)!==10000||p.limit(a,'automationSlots',now)!==0||p.limit(a,'recipeTemplates',now)!==2)throw new Error('Premium-Ablauflogik fehlerhaft');return true;}
