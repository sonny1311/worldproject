// WorldProject - Bauwarteschlange mit echten Bauzeiten und Premium-Limits
import { PremiumEntitlementSystem } from "./PremiumEntitlementSystem.js";

export const ConstructionCatalog={
 small_storage:{label:"Kleines Lager",baseMinutes:30,baseCost:2500},
 workshop_extension:{label:"Werkstatterweiterung",baseMinutes:90,baseCost:8000},
 production_hall:{label:"Produktionshalle",baseMinutes:240,baseCost:25000},
 large_warehouse:{label:"Grosslager",baseMinutes:360,baseCost:40000}
};

export class ConstructionQueueSystem{
 constructor({premium=new PremiumEntitlementSystem(),catalog=ConstructionCatalog}={}){this.premium=premium;this.catalog=catalog;this.jobs=[];this.seq=1;}
 active(){return this.jobs.filter(j=>j.status==="building");}
 pausedPremium(){return this.jobs.filter(j=>j.status==="paused_premium");}
 canStart(account){return this.premium.canStartConstruction(account,this.active().length);}
 start({account,company,type,level=1,now=Date.now()}={}){const cfg=this.catalog[type];if(!cfg)throw new Error("Unbekannter Bauauftrag");if(!this.canStart(account))throw new Error(`Maximal ${this.premium.constructionLimit(account)} parallele Bauauftraege erlaubt`);const lvl=Math.max(1,Number(level||1)),cost=Math.round(cfg.baseCost*Math.pow(1.18,lvl-1)),durationMinutes=Math.round(cfg.baseMinutes*Math.pow(1.12,lvl-1));if(Number(company?.money||0)<cost)throw new Error("Nicht genug Betriebsgeld");company.money-=cost;const j={id:this.seq++,type,label:cfg.label,level:lvl,cost,durationMinutes,startedAt:Number(now),finishAt:Number(now)+durationMinutes*60000,status:"building",remainingMs:durationMinutes*60000};this.jobs.push(j);return j;}
 syncPremiumState(account,now=Date.now()){
  // Neue feste Regel: Premium-Ablauf stoppt niemals bereits gestartete Bauprojekte.
  // Alte Speicherstaende mit paused_premium werden automatisch wieder aufgenommen.
  for(const j of this.pausedPremium()){
   j.status="building";
   j.startedAt=Number(now);
   j.finishAt=Number(now)+Math.max(0,Number(j.remainingMs||0));
   j.resumedAt=Number(now);
   j.pauseReason=null;
  }
  const limit=this.premium.constructionLimit(account),running=this.active().length;
  return {limit,running,overLimit:running>limit,paused:0};
 }
 resumePremiumJobs(account,{now=Date.now(),confirm=true}={}){
  const legacy=this.pausedPremium().slice();
  this.syncPremiumState(account,now);
  return {resumed:legacy,needsConfirmation:false,legacyMigration:true};
 }
 advance(now=Date.now(),account=null){if(account)this.syncPremiumState(account,now);const done=[];for(const j of this.jobs.filter(x=>x.status==="building"&&x.finishAt<=Number(now))){j.status="finished";j.finishedAt=Number(now);j.remainingMs=0;done.push(j);}return done;}
 status(account,now=Date.now()){this.syncPremiumState(account,now);this.advance(now);return {active:this.active().length,pausedPremium:0,limit:this.premium.constructionLimit(account),overLimit:this.active().length>this.premium.constructionLimit(account),jobs:this.jobs};}
}

export function runConstructionQueueTest(){const q=new ConstructionQueueSystem(),company={money:500000},standard={premiumUntil:0};q.start({account:standard,company,type:"small_storage",now:0});q.start({account:standard,company,type:"small_storage",now:0});q.start({account:standard,company,type:"small_storage",now:0});let blocked=false;try{q.start({account:standard,company,type:"small_storage",now:0});}catch{blocked=true;}if(!blocked||q.active().length!==3)throw new Error("Standard-Baulimit fehlerhaft");const now=Date.now(),premium={premiumUntil:now+86400000},p=new ConstructionQueueSystem();for(let i=0;i<5;i++)p.start({account:premium,company,type:"production_hall",now});premium.premiumUntil=now-1;const expired=p.syncPremiumState(premium,now);if(p.active().length!==5||p.pausedPremium().length!==0||!expired.overLimit)throw new Error("Premium-Ablauf darf laufende Bauauftraege nicht pausieren");let blockedAfterExpiry=false;try{p.start({account:premium,company,type:"small_storage",now});}catch{blockedAfterExpiry=true;}if(!blockedAfterExpiry)throw new Error("Nach Premium-Ablauf darf oberhalb des Standardlimits kein neuer Bau starten");p.jobs[0].status="finished";p.jobs[1].status="finished";p.jobs[2].status="finished";if(!p.canStart(premium))throw new Error("Unterhalb von drei laufenden Auftraegen muss wieder ein Standard-Bauplatz frei sein");console.log("✅ BAULIMIT: STANDARD 3 / PREMIUM 5, LAUFENDE AUFTRAEGE LAUFEN NACH PREMIUM-ABLAUF WEITER");return true;}
