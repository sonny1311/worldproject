// WorldProject – verbindet gekaufte Betriebsausstattung mit der bestehenden Personal-/Maschinensteuerung.
// Normale Spieler weisen Personal manuell zu; Premium weist eine passende freie Fachkraft automatisch zu.
import { WorkforceOperationsDialog } from './WorkforceOperationsDialog.js';
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';
import { worldContentRegistry } from './ContentRegistry.js';

const premium=new PremiumEntitlementSystem();
const MACHINE_STAFFING={
  micro_bottle_washer:{label:'Kleine Flaschenwaschanlage',requiredRole:'packaging_operator',requiredSkill:'bottle_washing',energyPerHour:8,maintenanceClass:'light'},
  bottle_washer:{label:'Flaschenwaschanlage',requiredRole:'packaging_operator',requiredSkill:'bottle_washing',energyPerHour:15,maintenanceClass:'standard'}
};
const equipmentType=item=>String(item?.sourceType||item?.type||item?.equipmentId||item?.id||'');
const accountFor=()=>window.worldCurrentUser||window.worldAccount||{};
const active=e=>e&&e.active!==false&&!['notice','dismissed','terminated','inactive','fired'].includes(String(e.status||'').toLowerCase());
const employeeSkills=e=>[...new Set([...(worldContentRegistry.get('jobs',e?.jobId)?.skills||[]),...(e?.extraSkills||[])])];

export function syncPurchasedMachines(dialog,company=dialog?.company?.()){
  if(!dialog||!company)return{changed:false,added:[]};
  const equipment=company.buildingState?.equipment||company.building_state?.equipment||[],added=[];
  dialog.machines.machines??=[];
  for(const item of equipment){
    const type=equipmentType(item),rule=MACHINE_STAFFING[type];
    if(!rule||item?.status==='sold')continue;
    const sourceInstanceId=String(item?.instanceId||item?.id||type);
    const existing=dialog.machines.machines.find(m=>String(m.sourceEquipmentInstanceId||'')===sourceInstanceId||(m.type===type&&!m.sourceEquipmentInstanceId));
    if(existing){
      existing.label=rule.label;
      existing.requiredSkill=rule.requiredSkill;
      existing.requiredRole=rule.requiredRole;
      existing.sourceType=type;
      existing.sourceEquipmentInstanceId=sourceInstanceId;
      continue;
    }
    const machine=dialog.machines.addMachine({type,label:rule.label,requiredSkill:rule.requiredSkill,requiredWorkers:1,energyPerHour:rule.energyPerHour,maintenanceClass:rule.maintenanceClass});
    machine.requiredRole=rule.requiredRole;
    machine.sourceType=type;
    machine.sourceEquipmentInstanceId=sourceInstanceId;
    added.push(machine);
  }
  return{changed:added.length>0,added};
}

export function autoAssignMachineStaff(dialog,{enabled=true}={}){
  if(!dialog||!enabled)return{changed:false,assigned:[]};
  const assigned=[];
  const assignments=dialog.workforce.assignments||[],employees=dialog.workforce.employees||[];
  for(const machine of dialog.machines.machines||[]){
    const rule=MACHINE_STAFFING[machine.sourceType||machine.type];if(!rule)continue;
    const already=assignments.some(a=>String(a.machineId)===String(machine.id));if(already)continue;
    const candidate=employees.find(e=>active(e)&&e.jobId===rule.requiredRole&&!assignments.some(a=>a.employeeId===e.id)&&employeeSkills(e).includes(rule.requiredSkill));
    if(!candidate)continue;
    const assignment=dialog.workforce.assign(candidate.id,{shiftId:'early',machineId:machine.id});
    assigned.push({employee:candidate,machine,assignment});
  }
  return{changed:assigned.length>0,assigned};
}

function writeState(dialog,company){
  if(!company)return;
  company.workforceState={employees:structuredClone(dialog.workforce.employees),assignments:structuredClone(dialog.workforce.assignments),trainings:structuredClone(dialog.workforce.trainings),seq:dialog.workforce.seq,trainingSeq:dialog.workforce.trainingSeq,trainingCosts:dialog.workforce.trainingCosts,machines:structuredClone(dialog.machines.machines),machineSeq:dialog.machines.seq};
  window.dispatchEvent(new CustomEvent('world:state-dirty',{detail:{reason:'machine-staffing-sync'}}));
  window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'machine-staffing-sync'}}));
}

const proto=WorkforceOperationsDialog.prototype;
if(!proto.__worldPurchasedMachineStaffingIntegrated){
  proto.__worldPurchasedMachineStaffingIntegrated=true;
  const originalRender=proto.render;
  proto.render=function(panel,industry,...args){
    const company=this.company(),sync=syncPurchasedMachines(this,company);
    const auto=autoAssignMachineStaff(this,{enabled:premium.canUseAutomaticStaffAssignment(accountFor())});
    if(sync.changed||auto.changed)writeState(this,company);
    return originalRender.call(this,panel,industry,...args);
  };
}

export function runWorkforceMachineAssignmentTest(){
  const fake={
    machines:{machines:[],seq:1,addMachine({type,label,requiredSkill,requiredWorkers=1,energyPerHour=0,maintenanceClass='standard'}){const m={id:this.seq++,type,label,requiredSkill,requiredWorkers,energyPerHour,maintenanceClass};this.machines.push(m);return m;}},
    workforce:{employees:[{id:1,jobId:'packaging_operator',active:true,extraSkills:[]}],assignments:[],assign(employeeId,{shiftId,machineId}){const a={employeeId,shiftId,machineId};this.assignments.push(a);return a;}},
    company(){return null;}
  };
  const company={buildingState:{equipment:[{id:'micro_bottle_washer',instanceId:'washer-1',status:'available'}]}};
  const sync=syncPurchasedMachines(fake,company),auto=autoAssignMachineStaff(fake,{enabled:true});
  if(!sync.changed||fake.machines.machines[0]?.label!=='Kleine Flaschenwaschanlage'||fake.machines.machines[0]?.requiredSkill!=='bottle_washing')throw new Error('Flaschenwaschanlage wurde nicht korrekt in die Personalsteuerung übernommen');
  if(!auto.changed||fake.workforce.assignments[0]?.machineId!==fake.machines.machines[0].id)throw new Error('Premium-Personalzuweisung für Flaschenwaschanlage fehlgeschlagen');
  return true;
}

if(typeof window!=='undefined')window.runWorkforceMachineAssignmentTest=runWorkforceMachineAssignmentTest;
