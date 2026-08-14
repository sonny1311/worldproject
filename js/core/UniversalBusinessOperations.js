// WorldProject - universeller Betriebsunterbau fuer ALLE Gewerbe.
// Bewusst datengetrieben ueber IndustryCatalog statt Sonderlogik fuer einzelne Branchen.
import { IndustryProfiles, getIndustryProfile, equipmentFor } from "./IndustryCatalog.js";
import { canPlaceMachine, startMachineUpgrade, advanceExpansion } from './LandConstructionExpansionSystem.js';

const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clone=v=>JSON.parse(JSON.stringify(v));
export const ALL_BUSINESS_TYPES=Object.keys(IndustryProfiles);

export function resolveBusinessProfile(company){
 const profile=getIndustryProfile(company);
 return {...profile,type:company?.type||company?.company_type||profile.label};
}
export function ensureBusinessOperations(company={}){
 company.buildingState??=company.building_state??{equipment:[],rooms:[]};
 company.buildingState.equipment??=[]; company.buildingState.rooms??=[];
 // Jeder Kleinstbetrieb startet mit einer bereits nutzbaren, kleinen Betriebsfläche.
 // Sie liegt innerhalb des 300-m²-Startgrundstücks und verhindert einen unspielbaren Start.
 if(!company.starterBuildingInitialized&&company.buildingState.rooms.length===0){company.buildingState.rooms.push({instanceId:'starter-building',id:'starter_building',label:'Kleiner Startbetrieb',sqm:150,status:'finished',level:1,starter:true});company.starterBuildingInitialized=true;}
 company.employees??=[]; company.machineQueue??=[];
 company.maintenanceOrders??=[]; company.purchaseSuggestions??=[]; company.productionCalendar??=[];
 company.supplierHistory??=[]; company.priceHistory??={}; company.customerRelations??={}; company.kpis??={};
 company.machineUpgradeJobs??=[];
 advanceExpansion(company);
 return company;
}
export function machineCatalogFor(company){
 return equipmentFor(company).map(m=>({...m,capacity:n(m.capacity,1),capacityUnit:m.capacityUnit||"Einheit/h",condition:100,level:1,upgradePrice:Math.round(n(m.price)*.55),floorSqm:Math.max(4,n(m.floorSqm,n(m.slots,1)*8))}));
}
export function ownedMachines(company){ensureBusinessOperations(company);return company.buildingState.equipment;}
export function buyMachine(company,machineId,{requestId}={}){
 ensureBusinessOperations(company); const def=machineCatalogFor(company).find(x=>x.id===machineId); if(!def)throw new Error("Maschine ist fuer dieses Gewerbe nicht verfuegbar");
 company.machinePurchaseIds??=[]; if(requestId&&company.machinePurchaseIds.includes(requestId))return{success:true,idempotent:true,machine:null};
 if(n(company.money)<n(def.price))throw new Error("Firmenkonto reicht fuer den Maschinenkauf nicht aus");
 const place=canPlaceMachine(company,def);if(!place.allowed)throw new Error(`Nicht genug Gebäudefläche für diese Maschine. Benötigt ${place.need} m², frei ${place.free} m². Grundstück/Gebäude zuerst erweitern.`);
 company.money=n(company.money)-n(def.price); const machine={...clone(def),instanceId:`machine-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,condition:100,level:1,status:"available",purchasedAt:Date.now(),purchasePrice:n(def.price),usageMinutes:0};
 company.buildingState.equipment.push(machine); if(requestId)company.machinePurchaseIds.push(requestId); return{success:true,machine,balance:company.money,placement:{usedSqm:place.used+place.need,capacitySqm:place.capacity}};
}
export function machineAvailability(company,machineId,now=Date.now()){
 ensureBusinessOperations(company);advanceExpansion(company,{now});
 const machines=ownedMachines(company).filter(x=>(typeof x==="string"?x:x.id)===machineId).map(x=>typeof x==="string"?{id:x,status:"available",condition:100}:x);
 return machines.map(m=>({...m,available:(m.status||"available")==="available"&&n(m.condition,100)>=20&&n(m.busyUntil,0)<=now}));
}
export function chooseFreeMachine(company,machineId,now=Date.now()){return machineAvailability(company,machineId,now).find(x=>x.available)||null;}
export function queueMachineJob(company,job){ensureBusinessOperations(company);company.machineQueue.push({...job,id:job.id||`mq-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,createdAt:Date.now(),status:"queued"});return company.machineQueue.at(-1);}
export function machineUtilization(machine,periodMinutes=1440){return Math.max(0,Math.min(100,Math.round(n(machine?.usageMinutes)/Math.max(1,n(periodMinutes))*100)));}
export function serviceMachine(machine,{repair=false,now=Date.now()}={}){
 const condition=n(machine.condition,100),missing=100-condition,cost=Math.round((repair?180:80)+missing*(repair?18:8)),durationMinutes=Math.max(30,Math.round((repair?90:45)+missing*(repair?2:1)));
 machine.status=repair?"repair":"maintenance";machine.busyUntil=now+durationMinutes*60000;machine.serviceCost=cost;return{cost,durationMinutes,busyUntil:machine.busyUntil};
}
export function finishMachineService(machine,now=Date.now()){if(n(machine.busyUntil)>now)return false;machine.condition=100;machine.status="available";machine.busyUntil=0;return true;}
// Upgrade ist ab jetzt ein echter Auftrag: Geld wird beim Bestellen abgezogen,
// die Maschine ist währenddessen blockiert und die neue Stufe gilt erst nach finishAt.
export function upgradeMachine(company,machine,{now=Date.now()}={}){ensureBusinessOperations(company);const job=startMachineUpgrade(company,machine,{now});return{success:true,pending:true,job,cost:job.cost,fromLevel:job.fromLevel,toLevel:job.toLevel,durationMinutes:job.durationMinutes,finishAt:job.finishAt};}
export function sellMachine(company,machine){ensureBusinessOperations(company);if(['upgrade','repair','maintenance'].includes(machine?.status))throw new Error('Maschine kann während Upgrade/Wartung nicht verkauft werden');const value=Math.max(0,Math.round(n(machine.purchasePrice)*(.35+.0035*Math.max(0,n(machine.condition,100)))));company.money=n(company.money)+value;company.buildingState.equipment=ownedMachines(company).filter(x=>x!==machine&&x.instanceId!==machine.instanceId);return{success:true,value};}

export function businessPlayabilityAudit(company={}){
 ensureBusinessOperations(company);const p=resolveBusinessProfile(company),catalog=machineCatalogFor(company),owned=ownedMachines(company).map(x=>typeof x==="string"?x:x.id),required=(p.requiredEquipment||[]),missing=required.filter(id=>!owned.includes(id));
 return{type:p.type,label:p.label,branchKey:p.branchKey,machineCatalog:catalog.length,requiredEquipment:required,missingEquipment:missing,hasMachinePath:catalog.length>0,playableSetup:required.length===0||missing.length===0};
}
export function auditAllBusinessTypes(){return ALL_BUSINESS_TYPES.map(type=>businessPlayabilityAudit({type,money:1e9,buildingState:{equipment:[]}}));}

export function runUniversalBusinessOperationsTest(){
 const checks=[];const ok=(name,value)=>checks.push({name,success:Boolean(value)});const audits=auditAllBusinessTypes();
 ok("industry profiles exist",audits.length>=10);audits.forEach(a=>{ok(`${a.type}: branch key`,a.branchKey&&a.branchKey!=="generic");ok(`${a.type}: machine purchase path`,a.hasMachinePath);});
 const sample={type:"Schreinerei",money:100000,buildingState:{equipment:[],rooms:[]}};ensureBusinessOperations(sample);ok('starter building present',sample.buildingState.rooms.some(r=>r.starter&&r.status==='finished'));const first=machineCatalogFor(sample)[0];const before=sample.money,buy=buyMachine(sample,first.id,{requestId:"same"}),again=buyMachine(sample,first.id,{requestId:"same"});ok("machine bought",buy.success&&sample.buildingState.equipment.length===1);ok("machine debited",sample.money===before-first.price);ok("machine purchase idempotent",again.idempotent&&sample.buildingState.equipment.length===1);ok("free machine selectable",chooseFreeMachine(sample,first.id));const m=sample.buildingState.equipment[0];m.condition=10;ok("broken machine blocked",!chooseFreeMachine(sample,first.id));serviceMachine(m,{repair:true,now:0});ok("repair blocks machine",m.status==="repair");finishMachineService(m,1e12);ok("repair restores machine",m.condition===100&&m.status==="available");const oldCap=m.capacity,oldLevel=m.level,up=upgradeMachine(sample,m,{now:0});ok('upgrade scheduled',up.pending&&m.level===oldLevel&&m.status==='upgrade');advanceExpansion(sample,{now:up.finishAt});ok("upgrade raises level after time",m.level===oldLevel+1);ok("upgrade raises capacity after time",m.capacity>oldCap);const sale=sellMachine(sample,m);ok("machine sale returns value",sale.value>0&&sample.buildingState.equipment.length===0);
 const failed=checks.filter(x=>!x.success);return{success:failed.length===0,checks,failed,passed:checks.length-failed.length,total:checks.length};
}
