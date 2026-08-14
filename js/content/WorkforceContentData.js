// WorldProject - erweiterbare Personal-, Energie-, Wartungs- und Schulungsdaten
import { registerWorldContent } from "../core/ContentRegistry.js";

export const WorkforceContent={
 jobs:[
  {id:"brew_master",label:"Braumeister",industries:["brewery","Getränke"],baseWageMonthly:4100,skills:["brewhouse","fermentation","brewery_quality","production_release"],requiredFor:["beer_production"],mandatoryForIndustry:true},
  {id:"brewer",label:"Brauer",industries:["brewery","Getränke"],baseWageMonthly:3200,skills:["brewhouse","fermentation"]},
  {id:"cellar_worker",label:"Keller-/Gärmitarbeiter",industries:["brewery","Getränke"],baseWageMonthly:3050,skills:["fermentation","brewery_quality"]},
  {id:"packaging_operator",label:"Abfüll-/Verpackungsmitarbeiter",industries:["brewery","Getränke","beverage"],baseWageMonthly:2950,skills:["machine","packing","bottle_washing"]},
  {id:"machine_operator",label:"Maschinenführer",industries:["brewery","Getränke","carpentry","bakery","butcher","food","mechanical","metal","plastic"],baseWageMonthly:3000,skills:["machine"]},
  {id:"warehouse_worker",label:"Lagerist",industries:["*"],baseWageMonthly:2850,skills:["warehouse"]},
  {id:"driver",label:"Fahrer",industries:["*"],baseWageMonthly:3000,skills:["transport"]},
  {id:"dispatcher",label:"Disponent",industries:["*"],baseWageMonthly:3300,skills:["dispatch","transport"]},
  {id:"carpenter",label:"Schreiner",industries:["carpentry"],baseWageMonthly:3150,skills:["woodshop"]},
  {id:"baker",label:"Bäcker",industries:["bakery"],baseWageMonthly:3050,skills:["bakery"]},
  {id:"butcher",label:"Metzger",industries:["butcher"],baseWageMonthly:3150,skills:["butchery"]},
  {id:"farmer",label:"Landwirt",industries:["farm","livestock","orchard"],baseWageMonthly:2950,skills:["field_line","livestock","orchard"]},
  {id:"salesperson",label:"Verkäufer",industries:["retail","wholesale"],baseWageMonthly:2700,skills:["sales","customer_service"]},
  {id:"picker",label:"Kommissionierer",industries:["retail","wholesale","online_retail"],baseWageMonthly:2750,skills:["warehouse","picking"]},
  {id:"packer",label:"Versandmitarbeiter",industries:["wholesale","online_retail"],baseWageMonthly:2750,skills:["packing","shipping"]},
  {id:"ecommerce_specialist",label:"E-Commerce-Mitarbeiter",industries:["online_retail"],baseWageMonthly:3200,skills:["ecommerce","customer_service"]},
  {id:"maintenance_tech",label:"Betriebstechniker",industries:["*"],baseWageMonthly:3450,skills:["maintenance"]},
  {id:"shift_supervisor",label:"Schichtleiter",industries:["*"],baseWageMonthly:3900,skills:["leadership"]}
 ],
 shifts:[
  {id:"early",label:"Frühschicht",startHour:6,endHour:14,wageFactor:1},
  {id:"late",label:"Spätschicht",startHour:14,endHour:22,wageFactor:1.08},
  {id:"night",label:"Nachtschicht",startHour:22,endHour:6,wageFactor:1.2}
 ],
 trainingCourses:[
  {id:"machine_basic",label:"Maschinen-Fortbildung",industries:["*"],skills:["machine"],weeks:4,schoolDaysPerWeek:1,schoolWeekday:3,costPerSchoolDay:220,qualificationGain:.08},
  {id:"quality_course",label:"Qualitätssicherung",industries:["*"],skills:["quality"],weeks:6,schoolDaysPerWeek:1,schoolWeekday:2,costPerSchoolDay:260,qualificationGain:.10},
  {id:"maintenance_course",label:"Instandhaltung Aufbaukurs",industries:["*"],skills:["maintenance"],weeks:6,schoolDaysPerWeek:1,schoolWeekday:4,costPerSchoolDay:310,qualificationGain:.12},
  {id:"leadership_course",label:"Schichtleitung / Führung",industries:["*"],skills:["leadership"],weeks:6,schoolDaysPerWeek:1,schoolWeekday:1,costPerSchoolDay:340,qualificationGain:.10},
  {id:"brewery_advanced",label:"Brautechnik Fortbildung",industries:["brewery","Getränke"],skills:["brewhouse","fermentation"],weeks:6,schoolDaysPerWeek:1,schoolWeekday:3,costPerSchoolDay:290,qualificationGain:.12},
  {id:"farm_advanced",label:"Landwirtschaftliche Fortbildung",industries:["farm","livestock","orchard"],skills:["field_line"],weeks:4,schoolDaysPerWeek:1,schoolWeekday:2,costPerSchoolDay:250,qualificationGain:.09},
  {id:"commerce_logistics",label:"Handel & Logistik",industries:["retail","wholesale","online_retail"],skills:["sales","warehouse","picking","packing"],weeks:4,schoolDaysPerWeek:1,schoolWeekday:2,costPerSchoolDay:220,qualificationGain:.08}
 ],
 energyTypes:[
  {id:"electricity",label:"Strom",unit:"kWh",pricePerUnit:.28},
  {id:"gas",label:"Gas",unit:"kWh",pricePerUnit:.11},
  {id:"diesel",label:"Diesel",unit:"l",pricePerUnit:1.45}
 ],
 maintenanceRules:[
  {id:"light",label:"Leichte Maschine",wearPerHour:.0015,serviceAtWear:.55,failureAtWear:.82,serviceCost:350,repairCost:1200},
  {id:"standard",label:"Standardmaschine",wearPerHour:.0018,serviceAtWear:.50,failureAtWear:.80,serviceCost:650,repairCost:2500},
  {id:"heavy",label:"Schwere Maschine",wearPerHour:.0022,serviceAtWear:.45,failureAtWear:.76,serviceCost:1200,repairCost:5200}
 ]
};

registerWorldContent(WorkforceContent);
