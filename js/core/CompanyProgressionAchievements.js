// WorldProject – Fortschritt, Meilensteine und Erfolge.
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export const AchievementCatalog=[
{id:'first_sale',label:'Erster Umsatz',check:c=>(c.salesLedger||[]).length>0,reward:{xp:100}},
{id:'million_revenue',label:'1 Mio. Umsatz',check:c=>(c.salesLedger||[]).reduce((s,x)=>s+n(x.revenue),0)>=1e6,reward:{xp:1000}},
{id:'hundred_jobs',label:'100 Aufträge',check:c=>(c.productionJobs||[]).filter(x=>x.status==='done').length>=100,reward:{xp:500}},
{id:'ten_employees',label:'10 Mitarbeiter',check:c=>(c.employees||[]).length>=10,reward:{xp:250}},
{id:'second_site',label:'Zweiter Standort',check:c=>(c.sites||[]).length>=2,reward:{xp:500}},
{id:'quality_95',label:'Qualitätsführer',check:c=>Number(c.quality?.score||0)>=95,reward:{xp:500}},
{id:'cash_1m',label:'Millionenreserve',check:c=>n(c.money)>=1e6,reward:{xp:750}},
{id:'research_5',label:'Innovator',check:c=>(c.innovation?.unlocks||[]).length>=5,reward:{xp:750}}
];
export function ensureProgression(c={}){c.progression??={xp:0,level:1,achievements:[],milestones:[],streaks:{profitableDays:0,onTimeDeliveries:0}};return c.progression;}
export function levelThreshold(level){return Math.round(750*Math.pow(Math.max(1,n(level)),1.45));}
export function addCompanyXp(c,amount,{source='gameplay'}={}){const p=ensureProgression(c);p.xp+=Math.max(0,n(amount));let gained=0;while(p.xp>=levelThreshold(p.level)){p.xp-=levelThreshold(p.level);p.level++;gained++;p.milestones.push({kind:'level',level:p.level,source,at:Date.now()});}return{level:p.level,xp:p.xp,next:levelThreshold(p.level),gained};}
export function evaluateAchievements(c){const p=ensureProgression(c),newOnes=[];for(const a of AchievementCatalog){if(p.achievements.some(x=>x.id===a.id))continue;if(a.check(c)){const row={id:a.id,label:a.label,earnedAt:Date.now(),reward:a.reward};p.achievements.push(row);newOnes.push(row);if(a.reward?.xp)addCompanyXp(c,a.reward.xp,{source:`achievement:${a.id}`});}}return newOnes;}
export function recordPerformanceDay(c,{profit=0,onTimeDeliveries=0,lateDeliveries=0}={}){const p=ensureProgression(c);p.streaks.profitableDays=profit>0?p.streaks.profitableDays+1:0;p.streaks.onTimeDeliveries=onTimeDeliveries>0&&lateDeliveries===0?p.streaks.onTimeDeliveries+onTimeDeliveries:0;return p.streaks;}
export function progressionKpis(c){const p=ensureProgression(c);return{level:p.level,xp:p.xp,next:levelThreshold(p.level),achievements:p.achievements.length,totalAchievements:AchievementCatalog.length,profitableStreak:p.streaks.profitableDays,onTimeStreak:p.streaks.onTimeDeliveries};}
if(typeof window!=='undefined')window.worldCompanyProgression={ensure:ensureProgression,addXp:addCompanyXp,evaluate:evaluateAchievements,recordDay:recordPerformanceDay,kpis:progressionKpis};
