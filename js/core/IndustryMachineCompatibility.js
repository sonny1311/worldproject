// WorldProject – verbindet historische/abstrakte Rezeptmaschinen mit realer Betriebsausstattung.
import { getIndustryProfile } from "./IndustryCatalog.js";

const ALIASES={
 brewery:{brewhouse:["brew_kettle"],bottle_washer:["micro_bottle_washer","bottle_washer"]},
 carpentry:{woodshop:["panel_saw","workbench"]},
 farm:{field_line:["tractor","cultivator","seeder"]},
 beverage:{mixing_tank:["mixing_tank","water_treatment"],filling_line:["filling_line"]},
 bakery:{bakery_oven:["bakery_oven"],dough_mixer:["dough_mixer"]},
 butcher:{meat_cutter:["meat_cutter"]},
 food:{food_mixer:["food_mixer"]},
 livestock:{animal_barn:["animal_barn"]},
 orchard:{orchard_tractor:["orchard_tractor"]},
 mechanical:{cnc_mill:["cnc_mill"]},
 metal:{welder:["welder"]},
 plastic:{injection_machine:["injection_machine"]},
 retail:{pos_system:["pos_system"]},
 wholesale:{forklift:["forklift"]},
 online_retail:{packing_stations:["packing_stations"]}
};

const equipmentList=company=>company?.buildingState?.equipment||company?.building_state?.equipment||[];
const equipmentId=item=>typeof item==="string"?item:item?.id||item?.equipmentId||item?.type||item?.machineType||null;
export function equipmentOperational(item){
 if(typeof item==="string")return true;
 if(!item||item.status==="installing"||item.status==="sold"||item.status==="broken"||item.status==="maintenance")return false;
 return true;
}

export function compatibleMachineIds(company,machineType){
 const key=company?.branchKey||getIndustryProfile(company).branchKey;
 return [...new Set(ALIASES[key]?.[machineType]||[machineType].filter(Boolean))];
}
export function ownedEquipmentIds(company){return equipmentList(company).map(equipmentId).filter(Boolean);}
export function readyEquipment(company){return equipmentList(company).filter(equipmentOperational);}
export function readyEquipmentIds(company){return readyEquipment(company).map(equipmentId).filter(Boolean);}
export function machineRequirementSatisfied(company,machineType){if(!machineType)return true;const ready=new Set(readyEquipmentIds(company)),choices=compatibleMachineIds(company,machineType);return choices.some(id=>ready.has(id));}
export function machineRequirementDetails(company,machineType){
 const compatible=compatibleMachineIds(company,machineType),all=equipmentList(company),owned=ownedEquipmentIds(company),matches=all.filter(item=>compatible.includes(equipmentId(item))),ownedMatches=matches.filter(equipmentOperational),ready=readyEquipmentIds(company);
 return{machineType,compatible,owned,ready,matches,ownedMatches,satisfied:!machineType||ownedMatches.length>0};
}

export function runIndustryMachineCompatibilityTest(){
 const company={branchKey:"brewery",buildingState:{equipment:[
  {id:"brew_kettle",instanceId:"installing",status:"installing"},
  {id:"bottle_washer",instanceId:"ready",status:"available"},
  {id:"panel_saw",instanceId:"sold",status:"sold"}
 ]}};
 if(machineRequirementSatisfied(company,"brewhouse"))throw new Error("Montierende Maschine wird fälschlich als betriebsbereit erkannt");
 const brew=machineRequirementDetails(company,"brewhouse");
 if(brew.matches.length!==1||brew.ownedMatches.length!==0)throw new Error("Montagestatus wird in Maschinendetails nicht berücksichtigt");
 if(!machineRequirementSatisfied(company,"bottle_washer"))throw new Error("Betriebsbereite Maschine wird nicht erkannt");
 company.buildingState.equipment[0].status="available";
 if(!machineRequirementSatisfied(company,"brewhouse"))throw new Error("Fertig montierte Maschine wird nicht freigegeben");
 return true;
}

if(typeof window!=="undefined")window.worldIndustryMachineCompatibilityTest=runIndustryMachineCompatibilityTest;
