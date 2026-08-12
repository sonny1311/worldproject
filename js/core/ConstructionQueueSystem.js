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
 canStart(account){return this.premium.canStartConstruction(account,this.active().length);}
 start({account,company,type,level=1,now=Date.now()}={}){const cfg=this.catalog[type];if(!cfg)throw new Error("Unbekannter Bauauftrag");if(!this.canStart(account))throw new Error(`Maximal ${this.premium.constructionLimit(account)} parallele Bauauftraege erlaubt`);const lvl=Math.max(1,Number(level||1)),cost=Math.round(cfg.baseCost*Math.pow(1.18,lvl-1)),durationMinutes=Math.round(cfg.baseMinutes*Math.pow(1.12,lvl-1));if(Number(company?.money||0)<cost)throw new Error("Nicht genug Betriebsgeld");company.money-=cost;const j={id:this.seq++,type,label:cfg.label,level:lvl,cost,durationMinutes,startedAt:Number(now),finishAt:Number(now)+durationMinutes*60000,status:"building"};this.jobs.push(j);return j;}
 advance(now=Date.now()){const done=[];for(const j of this.jobs.filter(x=>x.status==="building"&&x.finishAt<=Number(now))){j.status="finished";j.finishedAt=Number(now);done.push(j);}return done;}
 status(account,now=Date.now()){this.advance(now);return {active:this.active().length,limit:this.premium.constructionLimit(account),jobs:this.jobs};}
}

export function runConstructionQueueTest(){const q=new ConstructionQueueSystem(),company={money:100000},standard={premiumUntil:0};q.start({account:standard,company,type:"small_storage",now:0});q.start({account:standard,company,type:"small_storage",now:0});q.start({account:standard,company,type:"small_storage",now:0});let blocked=false;try{q.start({account:standard,company,type:"small_storage",now:0});}catch{blocked=true;}if(!blocked||q.active().length!==3)throw new Error("Standard-Baulimit fehlerhaft");const premium={premiumUntil:Date.now()+86400000},p=new ConstructionQueueSystem();p.start({account:premium,company,type:"small_storage",now:0});p.start({account:premium,company,type:"small_storage",now:0});p.start({account:premium,company,type:"small_storage",now:0});p.start({account:premium,company,type:"small_storage",now:0});p.start({account:premium,company,type:"small_storage",now:0});if(p.active().length!==5)throw new Error("Premium-Baulimit fehlerhaft");premium.premiumUntil=0;if(!p.status(premium,1).jobs.every(j=>j.status==="building"))throw new Error("Bauauftraege wurden bei Premiumablauf unzulaessig abgebrochen");console.log("✅ BAUZEIT-/BAUWARTESCHLANGEN-/PREMIUMLIMIT-TEST ERFOLGREICH");return true;}
