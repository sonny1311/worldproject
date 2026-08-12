// WorldProject - zentrale Inhaltsdaten
// Neue Rohstoffe, Lieferanten, Produkte, Rezepte und Maschinen koennen hier oder in weiteren
// Content-Modulen registriert werden, ohne Kernsysteme umzuschreiben.
import { registerWorldContent } from "../core/ContentRegistry.js";

export const BaseGameContent={
 materials:[
  {id:"malt",label:"Malz",unit:"kg",storageZone:"raw"},{id:"hops",label:"Hopfen",unit:"kg",storageZone:"raw"},{id:"yeast",label:"Hefe",unit:"kg",storageZone:"cold"},{id:"water",label:"Wasser",unit:"l",storageZone:"raw"},{id:"bottles",label:"0,33-l-Flaschen",unit:"Stk",storageZone:"packaging"},{id:"caps",label:"Kronkorken",unit:"Stk",storageZone:"packaging"},{id:"labels",label:"Etiketten",unit:"Stk",storageZone:"packaging"},
  {id:"softwood",label:"Nadelholz",unit:"m3",storageZone:"raw"},{id:"hardwood",label:"Hartholz",unit:"m3",storageZone:"raw"},{id:"plywood",label:"Plattenmaterial",unit:"m2",storageZone:"raw"},{id:"glue",label:"Leim",unit:"kg",storageZone:"raw"},{id:"screws",label:"Beschlaege/Schrauben",unit:"Set",storageZone:"raw"},{id:"varnish",label:"Lack/Oel",unit:"l",storageZone:"raw"},{id:"packaging",label:"Verpackung",unit:"Stk",storageZone:"packaging"},
  {id:"seed_wheat",label:"Weizensaatgut",unit:"kg",storageZone:"raw"},{id:"seed_barley",label:"Gerstensaatgut",unit:"kg",storageZone:"raw"},{id:"seed_corn",label:"Maissaatgut",unit:"kg",storageZone:"raw"},{id:"seed_rapeseed",label:"Rapssaatgut",unit:"kg",storageZone:"raw"},{id:"seed_potato",label:"Pflanzkartoffeln",unit:"kg",storageZone:"raw"},{id:"fertilizer",label:"Duenger",unit:"kg",storageZone:"raw"},{id:"diesel",label:"Diesel",unit:"l",storageZone:"raw"},{id:"animal_feed",label:"Tierfutter",unit:"kg",storageZone:"raw"},{id:"straw",label:"Stroh",unit:"kg",storageZone:"raw"}
 ],
 suppliers:[
  {id:"brew_malt_north",industries:["brewery"],label:"Malzhandel Nord",materials:["malt"],prices:{malt:1.05},distanceKm:82,deliveryBase:55,deliveryPerKm:.55,deliveryHours:14,quality:.95,reliability:.98},
  {id:"brew_malt_regional",industries:["brewery"],label:"Regionalmalz",materials:["malt"],prices:{malt:1.13},distanceKm:31,deliveryBase:40,deliveryPerKm:.48,deliveryHours:7,quality:.98,reliability:.99},
  {id:"brew_hops",industries:["brewery"],label:"Hopfenkontor",materials:["hops"],prices:{hops:9.2},distanceKm:145,deliveryBase:65,deliveryPerKm:.52,deliveryHours:20,quality:.98,reliability:.97},
  {id:"brew_packaging",industries:["brewery","beverage"],label:"Getraenkeverpackung West",materials:["bottles","caps","labels"],prices:{bottles:.17,caps:.025,labels:.09},distanceKm:64,deliveryBase:50,deliveryPerKm:.50,deliveryHours:10,quality:.96,reliability:.98},
  {id:"wood_regional",industries:["carpentry"],label:"Holzhandel Regional",materials:["softwood","hardwood","plywood"],prices:{softwood:520,hardwood:1180,plywood:14.5},distanceKm:42,deliveryBase:80,deliveryPerKm:.75,deliveryHours:9,quality:.96,reliability:.98},
  {id:"wood_fittings",industries:["carpentry"],label:"Beschlagtechnik Mitte",materials:["glue","screws","varnish","packaging"],prices:{glue:4.5,screws:5.8,varnish:8.4,packaging:1.1},distanceKm:77,deliveryBase:45,deliveryPerKm:.48,deliveryHours:12,quality:.95,reliability:.97},
  {id:"farm_seed",industries:["farm"],label:"Agrar Saatgut GmbH",materials:["seed_wheat","seed_barley","seed_corn","seed_rapeseed","seed_potato"],prices:{seed_wheat:.72,seed_barley:.68,seed_corn:1.1,seed_rapeseed:2.3,seed_potato:.5},distanceKm:58,deliveryBase:45,deliveryPerKm:.48,deliveryHours:10,quality:.97,reliability:.98},
  {id:"farm_inputs",industries:["farm"],label:"Landhandel Mitte",materials:["fertilizer","diesel"],prices:{fertilizer:.55,diesel:1.45},distanceKm:24,deliveryBase:28,deliveryPerKm:.40,deliveryHours:5,quality:.94,reliability:.99}
 ],
 machines:[
  {id:"brewhouse",industries:["brewery"],label:"Sudhaus"},{id:"woodshop",industries:["carpentry"],label:"Werkstattlinie"},{id:"field_line",industries:["farm"],label:"Ackerbau-Maschinenkette"}
 ],
 recipes:[
  {id:"beer_basic",industries:["brewery"],label:"Bier Grundcharge",materials:{malt:100,hops:2,yeast:1,water:700,bottles:1000,caps:1000,labels:1000},machineType:"brewhouse",durationMinutes:180,output:1000,product:"beer_basic",variableCost:90},
  {id:"table_basic",industries:["carpentry"],label:"Einfacher Tisch",materials:{softwood:.08,glue:.3,screws:1,varnish:.2,packaging:1},machineType:"woodshop",durationMinutes:90,output:1,product:"table_basic",variableCost:18},
  {id:"grow_wheat",industries:["farm"],label:"Weizen anbauen",materials:{seed_wheat:180,fertilizer:140,diesel:55},machineType:"field_line",durationMinutes:720,output:7000,product:"wheat",variableCost:120},
  {id:"grow_barley",industries:["farm"],label:"Gerste anbauen",materials:{seed_barley:170,fertilizer:130,diesel:52},machineType:"field_line",durationMinutes:700,output:6500,product:"barley",variableCost:115}
 ],
 products:[
  {id:"beer_basic",industries:["brewery"],label:"Bier 0,33 l",unit:"Flaschen"},{id:"table_basic",industries:["carpentry"],label:"Tisch",unit:"Stk"},{id:"wheat",industries:["farm"],label:"Weizen",unit:"kg"},{id:"barley",industries:["farm"],label:"Gerste",unit:"kg"}
 ]
};

registerWorldContent(BaseGameContent);
