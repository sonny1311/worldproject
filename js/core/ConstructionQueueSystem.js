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
  const limit=this.premium.constructionLimit(account),running=this.active().sort((a,b)=>a.startedAt-b.startedAt);
  if(running.length>limit){for(const j of running.slice(limit)){j.remainingMs=Math.max(0,Number(j.finishAt)-Number(now));j.status="paused_premium";j.pausedAt=Number(now);j.pauseReason="premium_expired";j.finishAt=null;}}
  return {limit,paused:this.pausedPremium().length};
 }
 resumePremiumJobs(account,{now=Date.now(),confirm=false}={}){
  if(!this.premium.state(account,now).active)return {resumed:[],reason:"premium_inactive"};
  if(!confirm)return {resumed:[],needsConfirmation:this.pausedPremium().length>0};
  const resumed=[];let free=Math.max(0,this.premium.constructionLimit(account)-this.active().length);
  for(const j of this.pausedPremium().sort((a,b)=>a.pausedAt-b.pausedAt)){if(free<=0)break;j.status="building";j.startedAt=Number(now);j.finishAt=Number(now)+Math.max(0,Number(j.remainingMs||0));j.resumedAt=Number(now);j.pauseReason=null;resumed.push(j);free--;}
  return {resumed,needsConfirmation:false};
 }
 advance(now=Date.now(),account=null){if(account)this.syncPremiumState(account,now);const done=[];for(const j of this.jobs.filter(x=>x.status==="building"&&x.finishAt<=Number(now))){j.status="finished";j.finishedAt=Number(now);j.remainingMs=0;done.push(j);}return done;}
 status(account,now=Date.now()){this.syncPremiumState(account,now);this.advance(now);return {active:this.active().length,pausedPremium:this.pausedPremium().length,limit:this.premium.constructionLimit(account),jobs:this.jobs};}
}

export function runConstructionQueueTest(){const q=new ConstructionQueueSystem(),company={money:200000},standard={premiumUntil:0};q.start({account:standard,company,type:"small_storage",now:0});q.start({account:standard,company,type:"small_storage",now:0});q.start({account:standard,company,type:"small_storage",now:0});let blocked=false;try{q.start({account:standard,company,type:"small_storage",now:0});}catch{blocked=true;}if(!blocked||q.active().length!==3)throw new Error("Standard-Baulimit fehlerhaft");const premium={premiumUntil:Date.now()+86400000},p=new ConstructionQueueSystem();for(let i=0;i<5;i++)p.start({account:premium,company,type:"production_hall",now:Date.now()});if(p.active().length!==5)throw new Error("Premium-Baulimit fehlerhaft");const snapshot=p.jobs.map(j=>({id:j.id,cost:j.cost,remainingMs:j.remainingMs}));premium.premiumUntil=Date.now()-1;p.syncPremiumState(premium,Date.now());if(p.active().length!==3||p.pausedPremium().length!==2)throw new Error("Premium-Auftraege wurden nicht korrekt pausiert");for(const before of snapshot.slice(3)){const after=p.jobs.find(j=>j.id===before.id);if(!after||after.status!=="paused_premium"||after.cost!==before.cost||after.remainingMs<=0)throw new Error("Bauprojekt verlor beim Premiumablauf Daten oder Fortschritt");}premium.premiumUntil=Date.now()+86400000;const ask=p.resumePremiumJobs(premium,{confirm:false});if(!ask.needsConfirmation)throw new Error("Fortsetzung muss bestaetigt werden");const resumed=p.resumePremiumJobs(premium,{confirm:true});if(resumed.resumed.length!==2||p.active().length!==5)throw new Error("Pausierte Premium-Bauprojekte wurden nicht korrekt fortgesetzt");console.log("✅ BAUZEIT-/PREMIUM-PAUSE-/FORTSETZUNGSTEST ERFOLGREICH");return true;}
