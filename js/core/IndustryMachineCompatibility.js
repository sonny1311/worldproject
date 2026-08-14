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

export function compatibleMachineIds(company,machineType){
 const key=company?.branchKey||getIndustryProfile(company).branchKey;
 return [...new Set(ALIASES[key]?.[machineType]||[machineType].filter(Boolean))];
}
export function ownedEquipmentIds(company){return (company?.buildingState?.equipment||company?.building_state?.equipment||[]).map(x=>typeof x==="string"?x:x.id).filter(Boolean);}
export function machineRequirementSatisfied(company,machineType){if(!machineType)return true;const owned=new Set(ownedEquipmentIds(company)),choices=compatibleMachineIds(company,machineType);return choices.some(id=>owned.has(id));}
export function machineRequirementDetails(company,machineType){const compatible=compatibleMachineIds(company,machineType),owned=ownedEquipmentIds(company);return{machineType,compatible,owned,satisfied:machineRequirementSatisfied(company,machineType)};}
