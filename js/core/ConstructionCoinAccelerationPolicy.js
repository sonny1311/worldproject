// WorldProject - einheitliche Coin-Beschleunigung fuer Bau, Ausbau und Montage.
// Coins duerfen hoechstens 75 % der urspruenglichen Projektdauer entfernen.
// Die letzten 25 % muessen immer real ablaufen.
export const CONSTRUCTION_COIN_POLICY=Object.freeze({
 minimumRealTimeRatio:0.25,
 maximumAcceleratedRatio:0.75,
 maximumHoursPerPurchase:10,
 maximumCoinsPerPurchase:50
});

const num=v=>Number(v||0);

export function constructionCoinAccelerationState(project,now=Date.now()){
 const startedAt=num(project?.startedAt||project?.startTime||project?.createdAt);
 const originalDurationMs=Math.max(0,num(project?.originalDurationMs||project?.durationMs||project?.buildDurationMs));
 const acceleratedMs=Math.max(0,num(project?.coinAcceleratedMs));
 const minimumRealMs=originalDurationMs*CONSTRUCTION_COIN_POLICY.minimumRealTimeRatio;
 const maximumAcceleratedMs=originalDurationMs-minimumRealMs;
 const removableMs=Math.max(0,maximumAcceleratedMs-acceleratedMs);
 const naturalElapsedMs=startedAt?Math.max(0,num(now)-startedAt):0;
 const effectiveElapsedMs=naturalElapsedMs+acceleratedMs;
 const remainingMs=Math.max(0,originalDurationMs-effectiveElapsedMs);
 return {startedAt,originalDurationMs,acceleratedMs,minimumRealMs,maximumAcceleratedMs,removableMs,naturalElapsedMs,effectiveElapsedMs,remainingMs,locked:removableMs<=0};
}

export function constructionCoinAccelerationQuote(project,{hours=10,coins=50,now=Date.now()}={}){
 const state=constructionCoinAccelerationState(project,now);
 const requestedHours=Math.max(0,Math.min(CONSTRUCTION_COIN_POLICY.maximumHoursPerPurchase,num(hours)));
 const requestedMs=requestedHours*60*60*1000;
 const appliedMs=Math.min(requestedMs,state.removableMs,state.remainingMs);
 const appliedHours=appliedMs/3600000;
 const requestedCoins=Math.max(0,Math.min(CONSTRUCTION_COIN_POLICY.maximumCoinsPerPurchase,Math.ceil(num(coins))));
 const coinCost=appliedMs>0&&requestedHours>0?Math.max(1,Math.ceil(requestedCoins*(appliedHours/requestedHours))):0;
 return {...state,requestedHours,appliedHours,appliedMs,coinCost,minimumRemainingRatio:CONSTRUCTION_COIN_POLICY.minimumRealTimeRatio,canAccelerate:appliedMs>0};
}

export function applyConstructionCoinAcceleration(project,company,options={}){
 const quote=constructionCoinAccelerationQuote(project,options);
 if(!quote.canAccelerate)throw new Error('Die letzten 25 % der Bauzeit muessen normal ablaufen.');
 if(num(company?.coins)<quote.coinCost)throw new Error('Nicht genug Coins fuer diese Beschleunigung.');
 company.coins=num(company.coins)-quote.coinCost;
 project.originalDurationMs=quote.originalDurationMs;
 project.coinAcceleratedMs=quote.acceleratedMs+quote.appliedMs;
 project.coinAccelerationPolicy='construction-25-percent-real-time';
 project.coinAccelerationPurchases=num(project.coinAccelerationPurchases)+1;
 return {project,company,quote};
}

export function ensureConstructionTiming(project,{startedAt=Date.now(),durationMs}={}){
 if(!project)return project;
 if(!num(project.startedAt)&&!num(project.startTime))project.startedAt=startedAt;
 if(!num(project.originalDurationMs))project.originalDurationMs=Math.max(0,num(durationMs||project.durationMs||project.buildDurationMs));
 if(!num(project.durationMs)&&num(project.originalDurationMs))project.durationMs=project.originalDurationMs;
 project.coinAcceleratedMs=Math.max(0,num(project.coinAcceleratedMs));
 return project;
}

export function runConstructionCoinAccelerationPolicyTest(){
 const duration=30*24*3600000,project={startedAt:1,originalDurationMs:duration,coinAcceleratedMs:0},company={coins:10000};
 let guard=0;
 while(constructionCoinAccelerationQuote(project,{hours:10,coins:50,now:1}).canAccelerate&&guard++<100){applyConstructionCoinAcceleration(project,company,{hours:10,coins:50,now:1});}
 const state=constructionCoinAccelerationState(project,1);
 return Math.round(state.minimumRealMs/3600000)===180&&Math.round(state.acceleratedMs/3600000)===540&&state.locked===true;
}
