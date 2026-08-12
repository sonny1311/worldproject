// WorldProject - erweiterbare Markt-, Kunden-, Zeitarbeits- und Fahrzeugupgrade-Daten
import { registerWorldContent } from "../core/ContentRegistry.js";

export const MarketAndFleetContent={
 customerTypes:[
  {id:"private",label:"Privatkunden",industries:["retail","online_retail","beverage","bakery","butcher"],baseVolume:1,priceSensitivity:1.2},
  {id:"retailer",label:"Einzelhaendler",industries:["brewery","beverage","food","bakery","butcher","farm","orchard"],baseVolume:250,priceSensitivity:1},
  {id:"wholesaler",label:"Grosshaendler",industries:["*"],baseVolume:1500,priceSensitivity:1.1},
  {id:"industrial",label:"Industriekunde",industries:["farm","carpentry","metal","plastic","mechanical","wholesale"],baseVolume:3000,priceSensitivity:.85}
 ],
 tempAgencyRoles:[
  {id:"temp_machine",label:"Zeitarbeit Maschinenfuehrer",jobId:"machine_operator",skills:["machine"],dailyCost:310,agencyMarkup:.32},
  {id:"temp_warehouse",label:"Zeitarbeit Lager",jobId:"warehouse_worker",skills:["warehouse"],dailyCost:270,agencyMarkup:.28},
  {id:"temp_driver",label:"Zeitarbeit Fahrer",jobId:"driver",skills:["transport"],dailyCost:330,agencyMarkup:.30},
  {id:"temp_brewer",label:"Zeitarbeit Brauer",jobId:"brewer",skills:["brewhouse","fermentation"],industries:["brewery"],dailyCost:370,agencyMarkup:.35},
  {id:"temp_carpenter",label:"Zeitarbeit Schreiner",jobId:"carpenter",skills:["woodshop"],industries:["carpentry"],dailyCost:350,agencyMarkup:.33}
 ],
 fleetUpgrades:[
  {id:"eco_engine",label:"Eco-Motoroptimierung",maxLevel:20,baseCost:1800,costGrowth:1.18,fuelReductionPerLevel:.006},
  {id:"aero",label:"Aerodynamikpaket",maxLevel:15,baseCost:1400,costGrowth:1.2,fuelReductionPerLevel:.004},
  {id:"power",label:"Motorleistung",maxLevel:20,baseCost:2200,costGrowth:1.2,powerGainPerLevel:.015,hillTimeReductionPerLevel:.004},
  {id:"tank",label:"Groesserer Tank",maxLevel:10,baseCost:950,costGrowth:1.22,tankGainLitresPerLevel:50,weightGainKgPerLevel:42},
  {id:"tyres",label:"Effizienzreifen",maxLevel:10,baseCost:1100,costGrowth:1.2,fuelReductionPerLevel:.003},
  {id:"reliability",label:"Zuverlaessigkeit",maxLevel:20,baseCost:1600,costGrowth:1.18,reliabilityGainPerLevel:.008}
 ]
};
registerWorldContent(MarketAndFleetContent);
