// WorldProject - Maschinenzustand muss echte Produktionswirkung haben.
// Kritische Maschinen duerfen nicht starten; Wartungshinweis wird in der Produktionsplanung sichtbar.
import { ProductionPlanner } from './OperationalSupplyChainSystem.js';

export const MACHINE_CONDITION={critical:25,maintenance:45};
const condition=m=>Number.isFinite(Number(m?.condition))?Math.max(0,Math.min(100,Number(m.condition))):100;
export function machineConditionState(m){const c=condition(m);if(c<=MACHINE_CONDITION.critical)return{state:'critical',condition:c,usable:false,label:'Wartung erforderlich'};if(c<=MACHINE_CONDITION.maintenance)return{state:'maintenance_due',condition:c,usable:true,label:'Wartung bald empfohlen'};return{state:'ok',condition:c,usable:true,label:'Betriebsbereit'};}
function baseUsable(m){return !!m&&!m.busy&&!['broken','sold','maintenance','workshop_required'].includes(String(m.status||'').toLowerCase());}
const p=ProductionPlanner.prototype;
if(!p.__worldMachineConditionGuard){
 p.__worldMachineConditionGuard=true;
 p.usableMachine=function(recipe){return this.machines.find(m=>m.type===recipe.machineType&&baseUsable(m)&&machineConditionState(m).usable);};
 const oldPlan=p.plan;
 p.plan=function(recipe,batches=1){const result=oldPlan.call(this,recipe,batches),matching=this.machines.filter(m=>m.type===recipe?.machineType),healthy=matching.find(m=>baseUsable(m)&&machineConditionState(m).usable),critical=matching.filter(m=>!machineConditionState(m).usable);if(!healthy&&critical.length){result.machineAvailable=false;result.ready=false;result.machineConditionBlocked=true;result.machineCondition=machineConditionState(critical[0]).condition;}return result;};
}
export function runMachineConditionProductionGuardTest(){const warehouse={has:()=>({ok:true,missing:{}})},planner=new ProductionPlanner({warehouse,machines:[{id:'m1',type:'brew',condition:20,busy:false}]});const plan=planner.plan({id:'r',machineType:'brew',materials:{},output:1,durationMinutes:1},1);if(plan.ready||!plan.machineConditionBlocked)throw new Error('Kritische Maschine darf Produktion nicht freigeben');planner.machines[0].condition=40;const ok=planner.plan({id:'r',machineType:'brew',materials:{},output:1,durationMinutes:1},1);if(!ok.ready)throw new Error('Wartungsfaellige, aber noch nutzbare Maschine wurde faelschlich gesperrt');return true;}
if(typeof window!=='undefined')window.worldMachineConditionGuard={state:machineConditionState,test:runMachineConditionProductionGuardTest};
