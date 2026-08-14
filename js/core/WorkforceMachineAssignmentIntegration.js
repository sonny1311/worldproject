// WorldProject – verbindet gekaufte Betriebsausstattung mit der bestehenden Personal-/Maschinensteuerung.
// Normale Spieler weisen Personal manuell zu; Premium weist eine passende freie Fachkraft automatisch zu.
import { WorkforceOperationsDialog } from './WorkforceOperationsDialog.js';
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';
import { worldContentRegistry } from './ContentRegistry.js';

const premium=new PremiumEntitlementSystem();
const MACHINE_STAFFING={
  micro_brew_kettle:{label:'Kleine Brauanlage 30–50 l',requiredRole:'brew_master',requiredSkill:'brewhouse',energyPerHour:10,maintenanceClass:'light'},
  brew_kettle:{label:'Sudwerk',requiredRole:'brew_master',requiredSkill:'brewhouse',energyPerHour:24,maintenanceClass:'standard'},
  brewhouse:{label:'Sudhaus',requiredRole:'brew_master',requiredSkill:'brewhouse',energyPerHour:24,maintenanceClass:'standard'},
  micro_fermenter:{label:'Kleiner Gärbehälter',requiredRole:'cellar_worker',requiredSkill:'fermentation',energyPerHour:2,maintenanceClass:'light'},
  fermenter:{label:'Gär-/Lagertank',requiredRole:'cellar_worker',requiredSkill:'fermentation',energyPerHour:4,maintenanceClass:'standard'},
  fermentation_tank:{label:'Gär-/Lagertank',requiredRole:'cellar_worker',requiredSkill:'fermentation',energyPerHour:4,maintenanceClass:'standard'},
  manual_bottle_filler:{label:'Manueller Gegendruckfüller',requiredRole:'packaging_operator',requiredSkill:'machine',energyPerHour:1,maintenanceClass:'light'},
  filling_line:{label:'Abfüllanlage',requiredRole:'packaging_operator',requiredSkill:'machine',energyPerHour:18,maintenanceClass:'standard'},
  micro_bottle_washer:{label:'Kleine Flaschenwaschanlage',requiredRole:'packaging_operator',requiredSkill:'bottle_washing',energyPerHour:8,maintenanceClass:'light'},
  bottle_washer:{label:'Flaschenwaschanlage',requiredRole:'packaging_operator',requiredSkill:'bottle_washing',energyPerHour:15,maintenanceClass:'standard'}
};
const equipmentType=item=>String(item?.sourceType||item?.type||item?.equipmentId||item?.id||'');
const accountFor=()=>window.worldCurrentUser||window.worldAccount||{};
const active=e=>e&&e.active!==false&&!['notice','dismissed','terminated','inactive','fired'].includes(String(e.status||'').toLowerCase());
const employeeSkills=e=>[...new Set([...(worldContentRegistry.get('jobs',e?.jobId)?.skills||[]),...(e?.extraSkills||[])])];

function ensureCompanyWorkforceState(company){
  const state=company.workforceState??={};
  state.employees??=[];state.assignments??=[];state.trainings??=[];state.machines??=[];
  state.seq=Number(state.seq||state.employees.reduce((m,e)=>Math.max(m,Number(e.id)||0),0)+1);
  state.trainingSeq=Number(state.trainingSeq||1);state.trainingCosts=Number(state.trainingCosts||0);
  state.machineSeq=Number(state.machineSeq||state.machines.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1);
  return state;
}
function machineRecord(type,rule,id,sourceInstanceId){return{id,type,label:rule.label,maintenanceClass:rule.maintenanceClass,energyTypeId:'electricity',energyPerHour:rule.energyPerHour,requiredSkill:rule.requiredSkill,requiredWorkers:1,wear:0,hours:0,status:'idle',lastServiceHours:0,currentJob:null,requiredRole:rule.requiredRole,sourceType:type,sourceEquipmentInstanceId:sourceInstanceId};}

export function syncCompanyPurchasedMachines(company){
  if(!company)return{changed:false,added:[]};
  const state=ensureCompanyWorkforceState(company),equipment=company.buildingState?.equipment||company.building_state?.equipment||[],added=[];
  for(const item of equipment){
    const type=equipmentType(item),rule=MACHINE_STAFFING[type];if(!rule||item?.status==='sold')continue;
    const sourceInstanceId=String(item?.instanceId||item?.id||type);
    const existing=state.machines.find(m=>String(m.sourceEquipmentInstanceId||'')===sourceInstanceId||(m.type===type&&!m.sourceEquipmentInstanceId));
    if(existing){Object.assign(existing,{label:rule.label,requiredSkill:rule.requiredSkill,requiredRole:rule.requiredRole,sourceType:type,sourceEquipmentInstanceId:sourceInstanceId});continue;}
    const machine=machineRecord(type,rule,state.machineSeq++,sourceInstanceId);state.machines.push(machine);added.push(machine);
  }
  return{changed:added.length>0,added};
}

export function autoAssignCompanyMachineStaff(company,{enabled=true}={}){
  if(!company||!enabled)return{changed:false,assigned:[]};
  const state=ensureCompanyWorkforceState(company),assigned=[];
  for(const machine of state.machines){
    const rule=MACHINE_STAFFING[machine.sourceType||machine.type];if(!rule)continue;
    if(state.assignments.some(a=>String(a.machineId)===String(machine.id)))continue;
    const candidate=state.employees.find(e=>active(e)&&e.jobId===rule.requiredRole&&!state.assignments.some(a=>String(a.employeeId)===String(e.id))&&employeeSkills(e).includes(rule.requiredSkill));
    if(!candidate)continue;
    const assignment={employeeId:candidate.id,shiftId:'early',machineId:machine.id,area:null};state.assignments.push(assignment);assigned.push({employee:candidate,machine,assignment});
  }
  return{changed:assigned.length>0,assigned};
}

export function syncPurchasedMachines(dialog,company=dialog?.company?.()){
  if(!dialog||!company)return{changed:false,added:[]};
  const equipment=company.buildingState?.equipment||company.building_state?.equipment||[],added=[];
  dialog.machines.machines??=[];
  for(const item of equipment){
    const type=equipmentType(item),rule=MACHINE_STAFFING[type];
    if(!rule||item?.status==='sold')continue;
    const sourceInstanceId=String(item?.instanceId||item?.id||type);
    const existing=dialog.machines.machines.find(m=>String(m.sourceEquipmentInstanceId||'')===sourceInstanceId||(m.type===type&&!m.sourceEquipmentInstanceId));
    if(existing){Object.assign(existing,{label:rule.label,requiredSkill:rule.requiredSkill,requiredRole:rule.requiredRole,sourceType:type,sourceEquipmentInstanceId:sourceInstanceId});continue;}
    const machine=dialog.machines.addMachine({type,label:rule.label,requiredSkill:rule.requiredSkill,requiredWorkers:1,energyPerHour:rule.energyPerHour,maintenanceClass:rule.maintenanceClass});
    machine.requiredRole=rule.requiredRole;machine.sourceType=type;machine.sourceEquipmentInstanceId=sourceInstanceId;added.push(machine);
  }
  return{changed:added.length>0,added};
}

export function autoAssignMachineStaff(dialog,{enabled=true}={}){
  if(!dialog||!enabled)return{changed:false,assigned:[]};
  const assigned=[],assignments=dialog.workforce.assignments||[],employees=dialog.workforce.employees||[];
  for(const machine of dialog.machines.machines||[]){
    const rule=MACHINE_STAFFING[machine.sourceType||machine.type];if(!rule)continue;
    if(assignments.some(a=>String(a.machineId)===String(machine.id)))continue;
    const candidate=employees.find(e=>active(e)&&e.jobId===rule.requiredRole&&!assignments.some(a=>String(a.employeeId)===String(e.id))&&employeeSkills(e).includes(rule.requiredSkill));
    if(!candidate)continue;
    const assignment=dialog.workforce.assign(candidate.id,{shiftId:'early',machineId:machine.id});assigned.push({employee:candidate,machine,assignment});
  }
  return{changed:assigned.length>0,assigned};
}

function writeState(dialog,company){
  if(!company)return;
  company.workforceState={employees:structuredClone(dialog.workforce.employees),assignments:structuredClone(dialog.workforce.assignments),trainings:structuredClone(dialog.workforce.trainings),seq:dialog.workforce.seq,trainingSeq:dialog.workforce.trainingSeq,trainingCosts:dialog.workforce.trainingCosts,machines:structuredClone(dialog.machines.machines),machineSeq:dialog.machines.seq};
  window.dispatchEvent(new CustomEvent('world:state-dirty',{detail:{reason:'machine-staffing-sync'}}));
  window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'machine-staffing-sync'}}));
}
function syncCompanyAfterPurchase(company){
  if(!company)return{changed:false,assigned:[]};
  const sync=syncCompanyPurchasedMachines(company),auto=autoAssignCompanyMachineStaff(company,{enabled:premium.canUseAutomaticStaffAssignment(accountFor())});
  if(sync.changed||auto.changed){window.dispatchEvent(new CustomEvent('world:state-dirty',{detail:{reason:'machine-staffing-auto'}}));window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'machine-staffing-auto'}}));}
  return{changed:sync.changed||auto.changed,added:sync.added,assigned:auto.assigned};
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

if(typeof window!=='undefined'){
  window.addEventListener('world:game-state-dirty',event=>{if(event?.detail?.reason==='equipment-purchase')syncCompanyAfterPurchase(window.worldPlayerCompany||null);});
  window.addEventListener('worldproject:company-switched',()=>syncCompanyAfterPurchase(window.worldPlayerCompany||null));
}

export function runWorkforceMachineAssignmentTest(){
  const fake={
    machines:{machines:[],seq:1,addMachine({type,label,requiredSkill,requiredWorkers=1,energyPerHour=0,maintenanceClass='standard'}){const m={id:this.seq++,type,label,requiredSkill,requiredWorkers,energyPerHour,maintenanceClass};this.machines.push(m);return m;}},
    workforce:{employees:[{id:1,jobId:'packaging_operator',active:true,extraSkills:[]}],assignments:[],assign(employeeId,{shiftId,machineId}){const a={employeeId,shiftId,machineId};this.assignments.push(a);return a;}},company(){return null;}
  };
  const company={buildingState:{equipment:[{id:'micro_bottle_washer',instanceId:'washer-1',status:'available'},{id:'micro_fermenter',instanceId:'fermenter-1',status:'available'}]},workforceState:{employees:[{id:1,jobId:'packaging_operator',active:true,extraSkills:[]},{id:2,jobId:'cellar_worker',active:true,extraSkills:[]}],assignments:[],machines:[],seq:3,machineSeq:1}};
  const sync=syncPurchasedMachines(fake,company),auto=autoAssignMachineStaff(fake,{enabled:true});
  if(!sync.changed||fake.machines.machines[0]?.label!=='Kleine Flaschenwaschanlage'||fake.machines.machines[0]?.requiredSkill!=='bottle_washing')throw new Error('Flaschenwaschanlage wurde nicht korrekt in die Personalsteuerung übernommen');
  if(!auto.changed||fake.workforce.assignments[0]?.machineId!==fake.machines.machines[0].id)throw new Error('Premium-Personalzuweisung im Dialog fehlgeschlagen');
  const companySync=syncCompanyPurchasedMachines(company),companyAuto=autoAssignCompanyMachineStaff(company,{enabled:true});
  const fermenter=company.workforceState.machines.find(m=>m.sourceType==='micro_fermenter');
  if(!companySync.changed||!companyAuto.changed||!fermenter||fermenter.label!=='Kleiner Gärbehälter')throw new Error('Gärbehälter wurde nicht in die Personalsteuerung übernommen');
  const cellarAssignment=company.workforceState.assignments.find(a=>a.employeeId===2);
  if(!cellarAssignment||String(cellarAssignment.machineId)!==String(fermenter.id))throw new Error('Premium-Gärmitarbeiter wurde nicht dem Gärbehälter zugewiesen');
  return true;
}

if(typeof window!=='undefined')window.runWorkforceMachineAssignmentTest=runWorkforceMachineAssignmentTest;
