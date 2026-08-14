// WorldProject - langfristige, zeitbasierte Betriebsausbaustufen
// Grundregel: Bezahlte Ausbauten wirken NIE sofort. Erst nach Ablauf des Umbau-/Schulungsauftrags
// wird die neue Stufe aktiviert. Freunde koennen lange Projekte begrenzt beschleunigen.

export const UpgradeTracks={
 production:{label:"Produktionsleistung",baseCost:5000,growth:1.16,effectPerLevel:.012,baseHours:4,durationGrowth:1.10,maxHours:504,workLabels:["Maschinen werden umgebaut","Produktionsablauf wird neu abgestimmt","Personal wird an der neuen Linie geschult","Testlauf und Feinabstimmung laufen"]},
 storage:{label:"Lagerkapazitaet",baseCost:3500,growth:1.15,effectPerLevel:.015,baseHours:3,durationGrowth:1.095,maxHours:504,workLabels:["Lagertechnik wird erweitert","Regale und Wege werden angepasst","Lagerplaetze werden neu organisiert","Abnahme der Lagererweiterung laeuft"]},
 efficiency:{label:"Betriebseffizienz",baseCost:6500,growth:1.18,effectPerLevel:.006,baseHours:5,durationGrowth:1.105,maxHours:504,workLabels:["Arbeitsablaeufe werden analysiert","Maschinenparameter werden optimiert","Personal wird auf neue Prozesse geschult","Effizienztest und Abnahme laufen"]},
 reliability:{label:"Betriebszuverlaessigkeit",baseCost:7000,growth:1.19,effectPerLevel:.004,baseHours:6,durationGrowth:1.11,maxHours:504,workLabels:["Anlagen werden technisch ueberarbeitet","Verschleissteile und Sensorik werden angepasst","Wartungsplaene werden neu eingerichtet","Zuverlaessigkeitstest und Abnahme laufen"]}
};

const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const nowMs=v=>v instanceof Date?v.getTime():Number.isFinite(Number(v))?Number(v):Date.now();

export class BusinessUpgradeSystem{
 constructor({tracks=UpgradeTracks,friendReduction=.04,maxFriendReduction=.32}={}){this.tracks=tracks;this.friendReduction=friendReduction;this.maxFriendReduction=maxFriendReduction;}
 ensure(company){
  company.upgrades=company.upgrades||{};
  company.upgradeJobs=Array.isArray(company.upgradeJobs)?company.upgradeJobs:[];
  company.upgradeHistory=Array.isArray(company.upgradeHistory)?company.upgradeHistory:[];
  return company.upgrades;
 }
 level(company,track){return Number(this.ensure(company)[track]||0);}
 activeJobs(company){this.ensure(company);return company.upgradeJobs.filter(j=>j.status==='running');}
 activeJob(company,track){return this.activeJobs(company).find(j=>j.track===track)||null;}
 durationHours(track,nextLevel){const c=this.tracks[track];if(!c)throw new Error("Unbekannter Ausbauzweig");return Math.min(c.maxHours||504,Math.max(.25,(c.baseHours||1)*Math.pow(c.durationGrowth||1.1,Math.max(0,nextLevel-1))));}
 maxHelpers(nextLevel){return clamp(2+Math.floor(Math.max(1,nextLevel)/10),2,8);}
 quote(company,track){
  const c=this.tracks[track];if(!c)throw new Error("Unbekannter Ausbauzweig");
  const next=this.level(company,track)+1,hours=this.durationHours(track,next),active=this.activeJob(company,track);
  return{track,label:c.label,nextLevel:next,cost:Math.round(c.baseCost*Math.pow(c.growth,next-1)),effectTotal:c.effectPerLevel*next,effectGain:c.effectPerLevel,durationHours:hours,durationMs:Math.round(hours*3600000),maxHelpers:this.maxHelpers(next),activeJob:active};
 }
 startUpgrade(company,track,{now=Date.now()}={}){
  this.ensure(company);this.process(company,now);
  const existing=this.activeJob(company,track);if(existing)throw new Error(`${this.tracks[track]?.label||track} wird bereits ausgebaut`);
  const q=this.quote(company,track);if(Number(company.money||0)<q.cost)throw new Error("Nicht genug Betriebsgeld");
  company.money-=q.cost;const start=nowMs(now),finish=start+q.durationMs;
  const job={id:`upgrade-${track}-${start}-${Math.random().toString(36).slice(2,8)}`,track,label:q.label,targetLevel:q.nextLevel,cost:q.cost,effectGain:q.effectGain,effectTotal:q.effectTotal,status:'running',startedAt:start,baseFinishAt:finish,finishAt:finish,baseDurationMs:q.durationMs,helpers:[],maxHelpers:q.maxHelpers,friendReduction:0,workLabels:[...(this.tracks[track].workLabels||[])],completedAt:null};
  company.upgradeJobs.push(job);return{success:true,pending:true,...q,job};
 }
 // Rueckwaertskompatibel: alte Aufrufer duerfen upgrade() weiter verwenden,
 // bekommen aber ab jetzt einen zeitbasierten Auftrag statt Sofortwirkung.
 upgrade(company,track,options={}){return this.startUpgrade(company,track,options);}
 applyFriendHelp(company,jobId,{friendId,friendName=null,now=Date.now()}={}){
  this.ensure(company);this.process(company,now);const job=company.upgradeJobs.find(j=>j.id===jobId);
  if(!job||job.status!=='running')throw new Error("Ausbauauftrag ist nicht aktiv");
  const id=String(friendId||'').trim();if(!id)throw new Error("Freund fehlt");if(job.helpers.some(h=>h.friendId===id))throw new Error("Dieser Freund hat bei diesem Ausbau bereits geholfen");if(job.helpers.length>=job.maxHelpers)throw new Error("Maximale Freundeshilfe fuer diesen Ausbau erreicht");
  const currentReduction=job.friendReduction||0,remainingReduction=Math.max(0,this.maxFriendReduction-currentReduction),applied=Math.min(this.friendReduction,remainingReduction);if(applied<=0)throw new Error("Maximale Zeitverkuerzung bereits erreicht");
  const cut=Math.round(job.baseDurationMs*applied);job.friendReduction=currentReduction+applied;job.finishAt=Math.max(nowMs(now),job.finishAt-cut);job.helpers.push({friendId:id,friendName:String(friendName||id),helpedAt:nowMs(now),reductionMs:cut,reductionRate:applied});
  return{success:true,job,reductionMs:cut,reductionRate:applied,remainingMs:Math.max(0,job.finishAt-nowMs(now))};
 }
 phase(job,now=Date.now()){
  if(!job)return null;if(job.status==='completed')return 'Ausbau abgeschlossen';const labels=job.workLabels||[];if(!labels.length)return 'Ausbauarbeiten laufen';const elapsed=Math.max(0,nowMs(now)-job.startedAt),duration=Math.max(1,job.finishAt-job.startedAt),ratio=clamp(elapsed/duration,0,.9999);return labels[Math.min(labels.length-1,Math.floor(ratio*labels.length))];
 }
 progress(job,now=Date.now()){if(!job)return 0;if(job.status==='completed')return 100;const duration=Math.max(1,job.finishAt-job.startedAt);return clamp(Math.round((nowMs(now)-job.startedAt)/duration*100),0,99);}
 process(company,now=Date.now()){
  this.ensure(company);const ts=nowMs(now),completed=[];
  for(const job of company.upgradeJobs){if(job.status!=='running'||ts<job.finishAt)continue;job.status='completed';job.completedAt=ts;this.ensure(company)[job.track]=Math.max(this.level(company,job.track),job.targetLevel);company.upgradeHistory.push({...job,helpers:[...(job.helpers||[])]});completed.push(job);}
  return completed;
 }
 status(company,track,now=Date.now()){
  this.process(company,now);const job=this.activeJob(company,track),q=this.quote(company,track);return{track,label:q.label,level:this.level(company,track),modifier:this.modifier(company,track),active:!!job,job,phase:job?this.phase(job,now):null,progress:job?this.progress(job,now):100,remainingMs:job?Math.max(0,job.finishAt-nowMs(now)):0,next:q};
 }
 modifier(company,track,now=Date.now()){this.process(company,now);const c=this.tracks[track];return c?1+this.level(company,track)*c.effectPerLevel:1;}
}

export function runBusinessUpgradeTest(){
 const start=1_000_000,c={money:100000},u=new BusinessUpgradeSystem(),a=u.upgrade(c,"production",{now:start});
 if(u.level(c,"production")!==0||u.modifier(c,"production",start)!==1)throw new Error("Ausbau wirkt faelschlich sofort");
 const before=a.job.finishAt,help=u.applyFriendHelp(c,a.job.id,{friendId:'friend-1',friendName:'Anna',now:start+1000});if(!(help.job.finishAt<before))throw new Error("Freundeshilfe verkuerzt Ausbau nicht");
 u.process(c,a.job.finishAt);if(u.level(c,"production")!==1||u.modifier(c,"production",a.job.finishAt)<=1)throw new Error("Fertiger Ausbau wird nicht aktiviert");
 const b=u.quote(c,"production");if(b.cost<=a.cost||b.durationHours<=a.durationHours)throw new Error("Hoehere Ausbaustufe wird nicht teurer/laenger");
 console.log("🏭 ZEITBASIERTER BETRIEBSAUSBAU ERFOLGREICH");return true;
}
