// WorldProject - einheitliche Coin-Zeitverkuerzung fuer alle sinnvollen Vorgangstimer.
// Regel: 1 Coin je angefangener Stunde, maximal 10 Stunden pro Kauf.
import { AuthApiClient } from './AuthApiClient.js';
import { timerEnd,shiftKnownEndTimes } from './TimeValueUtils.js';

const api=new AuthApiClient();
const ELIGIBLE=new Set(['production','delivery','construction','land','warehouse_expansion','machine_upgrade','business_upgrade']);
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export function canReduceOperation(row={}){return ELIGIBLE.has(row.kind)&&row.id!=null&&row.raw&&n(row.remainingMs)>0&&!!timerEnd(row.raw);}
export function operationTimeReductionQuote(row={},hours=1,{now=Date.now()}={}){
 if(!canReduceOperation(row))throw new Error('Dieser Vorgang kann nicht mit Coins beschleunigt werden');
 const end=timerEnd(row.raw)?.value||0,remainingMs=Math.max(0,end-now);if(!remainingMs)throw new Error('Der Vorgang ist bereits fertig');
 const requestedHours=Math.max(1,Math.min(10,Math.floor(n(hours,1)))),reducedMs=Math.min(remainingMs,requestedHours*3600000),costCoins=Math.max(1,Math.ceil(reducedMs/3600000));
 return{requestedHours,reducedMs,costCoins,remainingMs,newRemainingMs:remainingMs-reducedMs};
}
export async function reduceOperationTimeWithCoins(company={},row={},hours=1){
 const q=operationTimeReductionQuote(row,hours);const companyId=Number(company.serverCompanyId);if(!Number.isFinite(companyId)||companyId<=0)throw new Error('Server-Betrieb fehlt');
 const r=await api.rpc('shorten_company_timed_action',{p_company_id:companyId,p_action_kind:row.kind,p_action_id:String(row.id),p_hours:q.requestedHours});
 const reducedMs=n(r?.reducedMs),newBalance=n(r?.newBalance,company.coins);if(reducedMs<=0)throw new Error('Zeit konnte nicht verkuerzt werden');
 shiftKnownEndTimes(row.raw,-reducedMs,{floorMs:Date.now()});company.coins=newBalance;
 if((row.kind==='construction'||row.kind==='land')&&row.raw.buildingInstanceId){const room=company?.buildingState?.rooms?.find(x=>String(x.instanceId)===String(row.raw.buildingInstanceId));if(room&&timerEnd(room))shiftKnownEndTimes(room,-reducedMs,{floorMs:Date.now()});}
 if(row.kind==='machine_upgrade'&&row.raw.machineInstanceId){const machine=company?.buildingState?.equipment?.find(x=>String(x.instanceId)===String(row.raw.machineInstanceId));if(machine&&n(machine.busyUntil)>0)machine.busyUntil=Math.max(Date.now(),n(machine.busyUntil)-reducedMs);}
 window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'secure-coin-time-reduction',kind:row.kind,id:row.id}}));
 window.dispatchEvent(new CustomEvent('world:server-balances-changed',{detail:{coinBalance:newBalance}}));
 return{...r,reducedMs,newBalance};
}
export function runOperationCoinTimeReductionTest(){const now=1000000,row={kind:'production',id:'p1',remainingMs:2*3600000+15*60000,raw:{id:'p1',finishAt:now+2*3600000+15*60000}},q=operationTimeReductionQuote(row,10,{now});if(q.costCoins!==3||q.reducedMs!==2*3600000+15*60000)throw new Error('Teil-Stunden-Regel fehlerhaft');const short={kind:'delivery',id:'d1',remainingMs:25*60000,raw:{id:'d1',arrivalAt:now+25*60000}},s=operationTimeReductionQuote(short,10,{now});if(s.costCoins!==1)throw new Error('Restzeit unter einer Stunde kostet nicht exakt 1 Coin');return true;}
if(typeof window!=='undefined')window.worldOperationCoinTimeReduction={canReduce:canReduceOperation,quote:operationTimeReductionQuote,reduce:reduceOperationTimeWithCoins,test:runOperationCoinTimeReductionTest};
