// WorldProject – verbindet vorhandene Betriebsausstattung mit der bestehenden Personal-/Maschinensteuerung.
// Normale Spieler weisen Personal manuell zu; Premium weist eine passende freie Fachkraft automatisch zu.
import { WorkforceOperationsDialog } from './WorkforceOperationsDialog.js';
import { PremiumEntitlementSystem } from './PremiumEntitlementSystem.js';
import { worldContentRegistry } from './ContentRegistry.js';

const premium=new PremiumEntitlementSystem();
export const MACHINE_STAFFING={
  micro_brew_kettle:{label:'Kleine Brauanlage 30–50 l',requiredRole:'brew_master',requiredSkill:'brewhouse',energyPerHour:10,maintenanceClass:'light'},
  brew_kettle:{label:'Sudwerk',requiredRole:'brew_master',requiredSkill:'brewhouse',energyPerHour:24,maintenanceClass:'standard'},
  brewhouse:{label:'Sudhaus',requiredRole:'brew_master',requiredSkill:'brewhouse',energyPerHour:24,maintenanceClass:'standard'},
  micro_fermenter:{label:'Kleiner Gärbehälter',requiredRole:'cellar_worker',requiredSkill:'fermentation',energyPerHour:2,maintenanceClass:'light'},
  fermenter:{label:'Gär-/Lagertank',requiredRole:'cellar_worker',requiredSkill:'fermentation',energyPerHour:4,maintenanceClass:'standard'},
  fermentation_tank:{label:'Gär-/Lagertank',requiredRole:'cellar_worker',requiredSkill:'fermentation',energyPerHour:4,maintenanceClass:'standard'},
  manual_bottle_filler:{label:'Manueller Gegendruckfüller',requiredRole:'packaging_operator',requiredSkill:'machine',energyPerHour:1,maintenanceClass:'light'},
  filling_line:{label:'Abfüllanlage',requiredRole:'packaging_operator',requiredSkill:'machine',energyPerHour:18,maintenanceClass:'standard'},
  micro_bottle_washer:{label:'Kleine Flaschenwaschanlage',requiredRole:'packaging_operator',requiredSkill:'bottle_washing',energyPerHour:8,maintenanceClass:'light'},
  bottle_washer:{label:'Flaschenwaschanlage',requiredRole:'packaging_operator',requiredSkill:'bottle_washing',energyPerHour:15,maintenanceClass:'standard'},
  cooling_system:{label:'Kühltechnik',requiredRole:'maintenance_tech',requiredSkill:'maintenance',energyPerHour:12,maintenanceClass:'standard'},
  cooling:{label:'Kühltechnik',requiredRole:'maintenance_tech',requiredSkill:'maintenance',energyPerHour:12,maintenanceClass:'standard'},
  refrigeration:{label:'Kühltechnik',requiredRole:'maintenance_tech',requiredSkill:'maintenance',energyPerHour:12,maintenanceClass:'standard'},
  production_line:{label:'Produktionslinie',requiredRole:'machine_operator',requiredSkill:'machine',energyPerHour:10,maintenanceClass:'standard'}
};
const equipmentType=item=>String(item?.sourceType||item?.type||item?.equipmentId||item?.id||'');
const accountFor=()=>window.worldCurrentUser||window.worldAccount||{};
const active=e=>e&&e.active!==false&&!['notice','dismissed','terminated','inactive','fired'].includes(String(e.status||'').toLowerCase());
export const employeeSkills=e=>[...new Set([...(worldContentRegistry.get('jobs',e?.jobId)?.skills||[]),...(e?.extraSkills||[])])];
export const machineRule=m=>MACHINE_STAFFING[equipmentType(m)]||null;
export const employeeFitsMachine=(employee,machine)=>{
  if(!employee||!machine)return false;
  const rule=machineRule(machine),role=machine.requiredRole||rule?.requiredRole||null,skill=machine.requiredSkill||rule?.requiredSkill||null;
  if(role&&employee.jobId!==role&&!(employee.roles||[]).includes(role))return false;
  return !skill||employeeSkills(employee).includes(skill);
};

function sourceMachines(company){
  const building=company?.buildingState?.equipment||company?.building_state?.equipment||[];
  const legacy=company?.machines||[];
  const rows=[...building,...legacy],seen=new Set(),out=[];
  for(const item of rows){
    if(!item||item.status==='sold')continue;
    const type=equipmentType(item),rule=MACHINE_STAFFING[type];if(!rule)continue;
    const sourceInstanceId=String(item?.instanceId||item?.sourceEquipmentInstanceId||item?.id||type);
    const key=`${type}:${sourceInstanceId}`;if(seen.has(key))continue;seen.add(key);out.push({item,type,rule,sourceInstanceId});
  }
  return out;
}
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
  const state=ensureCompanyWorkforceState(company),added=[];let changed=false;
  for(const {type,rule,sourceInstanceId} of sourceMachines(company)){
    const existing=state.machines.find(m=>String(m.sourceEquipmentInstanceId||'')===sourceInstanceId||(m.type===type&&!m.sourceEquipmentInstanceId));
    if(existing){const before=`${existing.label}|${existing.requiredSkill}|${existing.requiredRole}|${existing.sourceType}`;Object.assign(existing,{label:rule.label,requiredSkill:rule.requiredSkill,requiredRole:rule.requiredRole,sourceType:type,sourceEquipmentInstanceId:sourceInstanceId});if(before!==`${existing.label}|${existing.requiredSkill}|${existing.requiredRole}|${existing.sourceType}`)changed=true;continue;}
    const machine=machineRecord(type,rule,state.machineSeq++,sourceInstanceId);state.machines.push(machine);added.push(machine);changed=true;
  }
  return{changed,added};
}

export function removeInvalidAssignments(state){
  if(!state)return{changed:false,removed:[]};const removed=[],employees=state.employees||[],machines=state.machines||[];
  state.assignments=(state.assignments||[]).filter(a=>{if(a.machineId===null||a.machineId===undefined||a.machineId==='')return true;const e=employees.find(x=>String(x.id)===String(a.employeeId)),m=machines.find(x=>String(x.id)===String(a.machineId));const valid=e&&m&&employeeFitsMachine(e,m);if(!valid)removed.push(a);return valid;});
  return{changed:removed.length>0,removed};
}

export function autoAssignCompanyMachineStaff(company,{enabled=true}={}){
  if(!company||!enabled)return{changed:false,assigned:[]};
  const state=ensureCompanyWorkforceState(company),assigned=[];removeInvalidAssignments(state);
  for(const machine of state.machines){
    if(!machineRule(machine))continue;
    if(state.assignments.some(a=>String(a.machineId)===String(machine.id)))continue;
    const candidate=state.employees.find(e=>active(e)&&employeeFitsMachine(e,machine)&&!state.assignments.some(a=>String(a.employeeId)===String(e.id)));
    if(!candidate)continue;
    const assignment={employeeId:candidate.id,shiftId:'early',machineId:machine.id,area:null};state.assignments.push(assignment);assigned.push({employee:candidate,machine,assignment});
  }
  return{changed:assigned.length>0,assigned};
}

export function syncPurchasedMachines(dialog,company=dialog?.company?.()){
  if(!dialog||!company)return{changed:false,added:[]};
  const added=[];let changed=false;dialog.machines.machines??=[];
  for(const {type,rule,sourceInstanceId} of sourceMachines(company)){
    const existing=dialog.machines.machines.find(m=>String(m.sourceEquipmentInstanceId||'')===sourceInstanceId||(m.type===type&&!m.sourceEquipmentInstanceId));
    if(existing){const before=`${existing.label}|${existing.requiredSkill}|${existing.requiredRole}|${existing.sourceType}`;Object.assign(existing,{label:rule.label,requiredSkill:rule.requiredSkill,requiredRole:rule.requiredRole,sourceType:type,sourceEquipmentInstanceId:sourceInstanceId});if(before!==`${existing.label}|${existing.requiredSkill}|${existing.requiredRole}|${existing.sourceType}`)changed=true;continue;}
    const machine=dialog.machines.addMachine({type,label:rule.label,requiredSkill:rule.requiredSkill,requiredWorkers:1,energyPerHour:rule.energyPerHour,maintenanceClass:rule.maintenanceClass});
    machine.requiredRole=rule.requiredRole;machine.sourceType=type;machine.sourceEquipmentInstanceId=sourceInstanceId;added.push(machine);changed=true;
  }
  const clean=removeInvalidAssignments({employees:dialog.workforce.employees,assignments:dialog.workforce.assignments,machines:dialog.machines.machines});if(clean.changed){dialog.workforce.assignments=(dialog.workforce.assignments||[]).filter(a=>!clean.removed.includes(a));changed=true;}
  return{changed,added};
}

export function autoAssignMachineStaff(dialog,{enabled=true}={}){
  if(!dialog||!enabled)return{changed:false,assigned:[]};
  const assigned=[],assignments=dialog.workforce.assignments||[],employees=dialog.workforce.employees||[];
  for(const machine of dialog.machines.machines||[]){
    if(!machineRule(machine))continue;
    if(assignments.some(a=>String(a.machineId)===String(machine.id)))continue;
    const candidate=employees.find(e=>active(e)&&employeeFitsMachine(e,machine)&&!assignments.some(a=>String(a.employeeId)===String(e.id)));
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
  const sync=syncCompanyPurchasedMachines(company),clean=removeInvalidAssignments(company.workforceState),auto=autoAssignCompanyMachineStaff(company,{enabled:premium.canUseAutomaticStaffAssignment(accountFor())});
  if(sync.changed||clean.changed||auto.changed){window.dispatchEvent(new CustomEvent('world:state-dirty',{detail:{reason:'machine-staffing-auto'}}));window.dispatchEvent(new CustomEvent('world:game-state-dirty',{detail:{reason:'machine-staffing-auto'}}));}
  return{changed:sync.changed||clean.changed||auto.changed,added:sync.added,assigned:auto.assigned};
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
  const fake={machines:{machines:[],seq:1,addMachine({type,label,requiredSkill,requiredWorkers=1,energyPerHour=0,maintenanceClass='standard'}){const m={id:this.seq++,type,label,requiredSkill,requiredWorkers,energyPerHour,maintenanceClass};this.machines.push(m);return m;}},workforce:{employees:[{id:1,jobId:'packaging_operator',active:true,extraSkills:[]}],assignments:[],assign(employeeId,{shiftId,machineId}){const a={employeeId,shiftId,machineId};this.assignments.push(a);return a;}},company(){return null;}};
  const company={buildingState:{equipment:[{id:'micro_bottle_washer',instanceId:'washer-1',status:'available'}]},machines:[{type:'micro_fermenter',instanceId:'fermenter-1',status:'available'},{type:'cooling_system',instanceId:'cooling-1',status:'available'}],workforceState:{employees:[{id:1,jobId:'packaging_operator',active:true,extraSkills:[]},{id:2,jobId:'cellar_worker',active:true,extraSkills:[]},{id:3,jobId:'maintenance_tech',active:true,extraSkills:[]}],assignments:[{employeeId:2,shiftId:'early',machineId:999}],machines:[],seq:4,machineSeq:1}};
  const sync=syncPurchasedMachines(fake,company);if(!sync.changed||!fake.machines.machines.some(m=>m.sourceType==='cooling_system'))throw new Error('Kühltechnik aus alternativer Maschinenquelle fehlt im Personaldialog');
  const companySync=syncCompanyPurchasedMachines(company),clean=removeInvalidAssignments(company.workforceState),companyAuto=autoAssignCompanyMachineStaff(company,{enabled:true});
  const fermenter=company.workforceState.machines.find(m=>m.sourceType==='micro_fermenter'),cooling=company.workforceState.machines.find(m=>m.sourceType==='cooling_system');
  if(!companySync.changed||!clean.changed||!fermenter||!cooling)throw new Error('Maschinensynchronisation oder Altzuweisungsbereinigung fehlgeschlagen');
  const cellarAssignment=company.workforceState.assignments.find(a=>a.employeeId===2),techAssignment=company.workforceState.assignments.find(a=>a.employeeId===3);
  if(!cellarAssignment||String(cellarAssignment.machineId)!==String(fermenter.id))throw new Error('Gärmitarbeiter wurde nicht passend dem Gärbehälter zugewiesen');
  if(!techAssignment||String(techAssignment.machineId)!==String(cooling.id))throw new Error('Betriebstechniker wurde nicht passend der Kühltechnik zugewiesen');
  if(!companyAuto.changed)throw new Error('Premium-Autozuweisung hat keine passenden Mitarbeiter zugewiesen');
  return true;
}

if(typeof window!=='undefined')window.runWorkforceMachineAssignmentTest=runWorkforceMachineAssignmentTest;
