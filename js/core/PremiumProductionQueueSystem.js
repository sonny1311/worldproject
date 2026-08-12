// WorldProject - Premium-Produktionswarteschlange
// Standard: keine Vorausplanung. Premium: bis zu drei Folgeauftraege.
import { PremiumEntitlementSystem } from "./PremiumEntitlementSystem.js";

export class PremiumProductionQueueSystem{
 constructor({premium=new PremiumEntitlementSystem(),planner=null,workforceCheck=null}={}){this.premium=premium;this.planner=planner;this.workforceCheck=workforceCheck;this.entries=[];this.seq=1;}
 queued(){return this.entries.filter(e=>e.status==="queued").sort((a,b)=>Number(a.position||0)-Number(b.position||0)||a.id-b.id);}
 pausedPremium(){return this.entries.filter(e=>e.status==="paused_premium");}
 normalizePositions(){this.queued().forEach((e,i)=>e.position=i+1);}
 add({account,recipe,batches=1,metadata={}}={}){const limit=this.premium.productionQueueLimit(account);if(limit<=0)throw new Error("Produktionswarteschlange ist nur mit Premium verfuegbar");if(this.queued().length>=limit)throw new Error(`Maximal ${limit} vorausgeplante Produktionen erlaubt`);const e={id:this.seq++,recipe,batches:Math.max(1,Number(batches||1)),metadata,status:"queued",position:this.queued().length+1,createdAt:Date.now(),lastBlockReason:null,startedJobId:null};this.entries.push(e);return e;}

 // Rueckwaertskompatibilitaet fuer aeltere Integrationsmodule (u.a. Block18).
 // Alte API: enqueue(account, {recipe,batches,...})
 enqueue(account,payload={}){return this.add({account,...payload});}

 remove(id){const e=this.entries.find(x=>x.id===id&&["queued","paused_premium"].includes(x.status));if(!e)return false;e.status="removed";e.removedAt=Date.now();this.normalizePositions();return true;}
 move(id,direction){const q=this.queued(),i=q.findIndex(e=>e.id===id),j=i+Number(direction);if(i<0||j<0||j>=q.length)return false;[q[i].position,q[j].position]=[q[j].position,q[i].position];this.normalizePositions();return true;}
 moveUp(id){return this.move(id,-1);}moveDown(id){return this.move(id,1);}
 syncPremium(account){if(this.premium.productionQueueLimit(account)>0)return {paused:0};let paused=0;for(const e of this.queued()){e.status="paused_premium";e.pausedAt=Date.now();paused++;}return {paused};}
 restoreAfterPremium(account,{confirm=false}={}){if(this.premium.productionQueueLimit(account)<=0)return {restored:[],reason:"premium_inactive"};if(!confirm)return {restored:[],needsConfirmation:this.pausedPremium().length>0};const restored=[];let free=Math.max(0,this.premium.productionQueueLimit(account)-this.queued().length);for(const e of this.pausedPremium()){if(free<=0)break;e.status="queued";e.position=this.queued().length+1;e.restoredAt=Date.now();restored.push(e);free--;}this.normalizePositions();return {restored,needsConfirmation:false};}
 canStartEntry(entry,context={}){if(typeof this.workforceCheck==="function"){const r=this.workforceCheck(entry,context);if(r===false)return {ok:false,reason:"Personal nicht verfuegbar",code:"staff_missing"};if(r&&r.ok===false)return r;}return {ok:true};}
 process({account,now=Date.now(),context={}}={}){this.syncPremium(account);if(this.premium.productionQueueLimit(account)<=0)return {started:null,reason:"premium_inactive"};if(!this.planner)throw new Error("ProductionPlanner fehlt");const running=this.planner.queue?.find(j=>j.status==="running");if(running)return {started:null,reason:"production_running",running};const entry=this.queued()[0];if(!entry)return {started:null,reason:"queue_empty"};const staff=this.canStartEntry(entry,context);if(!staff.ok){entry.lastBlockReason=staff.reason||"Personal fehlt";entry.lastBlockCode=staff.code||"staff_missing";return {started:null,reason:entry.lastBlockReason};}try{const job=this.planner.start(entry.recipe,entry.batches,now);entry.status="started";entry.startedAt=now;entry.startedJobId=job.id;entry.lastBlockReason=null;entry.lastBlockCode=null;this.normalizePositions();return {started:job,entry};}catch(e){entry.lastBlockReason=e.message;entry.lastBlockCode=/rohstoff/i.test(e.message)?"materials_missing":/maschine/i.test(e.message)?"machine_busy":"production_blocked";return {started:null,reason:e.message,entry};}}
 advance({account,now=Date.now(),context={}}={}){if(!this.planner)throw new Error("ProductionPlanner fehlt");this.planner.advance(now);for(const e of this.entries.filter(x=>x.status==="started")){const job=this.planner.queue.find(j=>j.id===e.startedJobId);if(job?.status==="finished"){e.status="finished";e.finishedAt=now;}}return this.process({account,now,context});}

 // Alte API: tick({account,planner,now,staffingCheck}).
 // Adapter uebernimmt Planner/Personalpruefung und nutzt danach die neue advance-Logik.
 tick({account,planner=null,now=Date.now(),staffingCheck=null,context={}}={}){
  if(planner)this.planner=planner;
  if(typeof staffingCheck==="function")this.workforceCheck=(entry,ctx)=>staffingCheck(entry,ctx);
  return this.advance({account,now,context});
 }

 view(account){const limit=this.premium.productionQueueLimit(account),active=this.premium.state(account).active;return {active,limit,slots:Array.from({length:Math.max(3,limit)},(_,i)=>{const e=this.queued()[i];return {slot:i+1,entry:e||null,label:e?(e.recipe?.label||e.recipe?.id||"Produktion"):"Frei",batches:e?.batches||0,status:e?.status||"empty",blockReason:e?.lastBlockReason||null};}),paused:this.pausedPremium()};}
}

export function runPremiumProductionQueueTest(){const premium=new PremiumEntitlementSystem(),account={premiumUntil:Date.now()+86400000},warehouse={stock:{raw:{malt:300},packaging:{},finished:{},cold:{}},has(req){const missing={};for(const[k,v]of Object.entries(req))if(Number(this.stock.raw[k]||0)<v)missing[k]=v-Number(this.stock.raw[k]||0);return {ok:!Object.keys(missing).length,missing};},consume(req){const c=this.has(req);if(!c.ok)return c;for(const[k,v]of Object.entries(req))this.stock.raw[k]-=v;return {ok:true};},addFinished(p,q){this.stock.finished[p]=Number(this.stock.finished[p]||0)+q;}},machine={busy:false},planner={queue:[],seq:1,start(recipe,batches,now){if(machine.busy)throw new Error("Maschine belegt");const c=warehouse.consume({malt:100*batches});if(!c.ok)throw new Error("Rohstoffe fehlen");machine.busy=true;const j={id:this.seq++,recipe,plan:{output:1000*batches},status:"running",finishAt:now+60000};this.queue.push(j);return j;},advance(now){for(const j of this.queue)if(j.status==="running"&&now>=j.finishAt){j.status="finished";machine.busy=false;warehouse.addFinished(j.recipe.product,j.plan.output);}}},q=new PremiumProductionQueueSystem({premium,planner,workforceCheck:()=>({ok:true})}),recipe={id:"beer",label:"Bier",product:"beer"};const a=q.add({account,recipe}),b=q.add({account,recipe}),c=q.add({account,recipe});q.moveDown(a.id);if(q.queued()[0].id!==b.id)throw new Error("Queue-Umsortierung fehlerhaft");let blocked=false;try{q.add({account,recipe});}catch{blocked=true;}if(!blocked)throw new Error("Premium-Queue-Limit fehlerhaft");q.process({account,now:0});q.advance({account,now:60000});q.advance({account,now:120000});q.advance({account,now:180000});if(warehouse.stock.finished.beer!==3000)throw new Error("Produktionswarteschlange arbeitete nicht automatisch ab");console.log("✅ PREMIUM-PRODUKTIONSQUEUE SICHTBAR/UMSORTIERBAR/AUTOMATISCH ERFOLGREICH");return true;}
