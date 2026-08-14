// WorldProject - Rewarded-Ads Kern.
// Keine Belohnung ohne bestaetigte Vollansicht durch einen Werbeprovider.
// Allgemeines Tageskontingent auf der Startseite: 10 Anzeigen.
// Zeit-Ads erscheinen nur an laufenden Vorgaengen und reduzieren je Anzeige 0,5 % der AKTUELLEN Restzeit.
// Maximal 5 Anzeigen je Vorgang (= nominell bis 2,5 %, tatsaechlich leicht weniger durch die fortlaufend kleinere Restzeit).
import { timerEnd, writeTimeValue } from './TimeValueUtils.js';

export const RewardedAdConfig=Object.freeze({dailyGeneralAds:10,timeReductionRate:.005,maxTimeAdsPerJob:5,generalReward:null});
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const dayKey=(now=Date.now())=>new Date(now).toISOString().slice(0,10);

export class RewardedAdSystem{
 constructor({config=RewardedAdConfig}={}){this.config=config;}
 ensure(company,now=Date.now()){
  company.rewardedAds??={day:dayKey(now),generalWatched:0,history:[],revenueEvents:[]};
  const s=company.rewardedAds;s.history=Array.isArray(s.history)?s.history:[];s.revenueEvents=Array.isArray(s.revenueEvents)?s.revenueEvents:[];
  if(s.day!==dayKey(now)){s.day=dayKey(now);s.generalWatched=0;}return s;
 }
 generalState(company,now=Date.now()){const s=this.ensure(company,now),watched=Math.max(0,Math.min(this.config.dailyGeneralAds,num(s.generalWatched))),remaining=Math.max(0,this.config.dailyGeneralAds-watched);return{day:s.day,watched,remaining,total:this.config.dailyGeneralAds,complete:remaining===0};}
 registerProviderRevenue(company,{provider=null,placement=null,revenue=null,currency=null,providerEventId=null,now=Date.now()}={}){const s=this.ensure(company,now),event={provider:String(provider||'unknown'),placement:String(placement||'unknown'),revenue:Number.isFinite(Number(revenue))?Number(revenue):null,currency:currency?String(currency):null,providerEventId:providerEventId?String(providerEventId):null,at:now};s.revenueEvents.push(event);if(s.revenueEvents.length>500)s.revenueEvents.splice(0,s.revenueEvents.length-500);return event;}
 confirmGeneralAd(company,{providerReceipt=null,now=Date.now()}={}){const state=this.generalState(company,now);if(state.complete)throw new Error('Das heutige Werbekontingent ist bereits ausgeschöpft');if(!providerReceipt?.completed)throw new Error('Werbung wurde nicht vollständig bestätigt');const s=this.ensure(company,now);s.generalWatched=state.watched+1;s.history.push({type:'general',placement:'home',at:now,receiptId:providerReceipt.id||null});if(providerReceipt.revenue!==undefined)this.registerProviderRevenue(company,{provider:providerReceipt.provider,placement:'home',revenue:providerReceipt.revenue,currency:providerReceipt.currency,providerEventId:providerReceipt.id,now});return{success:true,state:this.generalState(company,now),reward:this.config.generalReward};}
 resolveTimer(job){return job?timerEnd(job):null;}
 timeAdState(job){const count=Math.max(0,num(job?.rewardedTimeAds));return{watched:count,remaining:Math.max(0,this.config.maxTimeAdsPerJob-count),total:this.config.maxTimeAdsPerJob,complete:count>=this.config.maxTimeAdsPerJob};}
 confirmTimeAd(company,job,{kind='job',providerReceipt=null,now=Date.now()}={}){
  if(!providerReceipt?.completed)throw new Error('Werbung wurde nicht vollständig bestätigt');const timer=this.resolveTimer(job);if(!timer)throw new Error('Für diesen Vorgang ist keine laufende Restzeit vorhanden');const state=this.timeAdState(job);if(state.complete)throw new Error('Maximal 5 Werbungen für diesen Vorgang erreicht');const remaining=Math.max(0,timer.value-now);if(remaining<=0)throw new Error('Vorgang ist bereits abgeschlossen');
  const reduction=Math.max(1000,Math.floor(remaining*this.config.timeReductionRate)),next=Math.max(now,timer.value-reduction);writeTimeValue(job,timer.key,next);job.rewardedTimeAds=state.watched+1;job.rewardedTimeReductionMs=num(job.rewardedTimeReductionMs)+reduction;
  const s=this.ensure(company,now);s.history.push({type:'time',kind,jobId:job.id||null,at:now,reductionMs:reduction,receiptId:providerReceipt.id||null});if(providerReceipt.revenue!==undefined)this.registerProviderRevenue(company,{provider:providerReceipt.provider,placement:`time:${kind}`,revenue:providerReceipt.revenue,currency:providerReceipt.currency,providerEventId:providerReceipt.id,now});return{success:true,reductionMs:reduction,remainingMs:Math.max(0,next-now),state:this.timeAdState(job),timerKey:timer.key};
 }
}

export function runRewardedAdSystemTest(){
 const system=new RewardedAdSystem(),company={},now=Date.parse('2026-08-14T10:00:00Z'),job={id:'p1',status:'running',finishAt:new Date(now+1000000).toISOString()};let rejected=false;try{system.confirmTimeAd(company,job,{providerReceipt:{completed:false},now});}catch{rejected=true;}if(!rejected)throw new Error('Unbestätigte Werbung wurde belohnt');const r=system.confirmTimeAd(company,job,{providerReceipt:{completed:true,id:'test'},now});if(r.reductionMs!==5000||Date.parse(job.finishAt)!==now+995000)throw new Error('0,5%-Zeitverkürzung oder Reload-Zeitformat fehlerhaft');for(let i=1;i<5;i++)system.confirmTimeAd(company,job,{providerReceipt:{completed:true,id:`t${i}`},now});if(!system.timeAdState(job).complete)throw new Error('5er-Limit pro Vorgang fehlerhaft');for(let i=0;i<10;i++)system.confirmGeneralAd(company,{providerReceipt:{completed:true,id:`g${i}`},now});if(!system.generalState(company,now).complete)throw new Error('10er-Werbeblock fehlerhaft');return true;
}
if(typeof window!=='undefined')window.worldRewardedAds={system:new RewardedAdSystem(),config:RewardedAdConfig,runTest:runRewardedAdSystemTest};
