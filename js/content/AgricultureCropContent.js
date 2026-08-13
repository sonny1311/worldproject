// WorldProject - erweiterter Ackerbau mit regionalen und saisonalen Metadaten.
import { registerWorldContent } from "../core/ContentRegistry.js";
const seed=(id,label)=>({id,label,unit:"kg",storageZone:"raw"});
const product=(id,label)=>({id,industries:["farm"],label,unit:"kg"});
const crop=(id,label,seedId,seedKg,fertilizerKg,dieselL,minutes,outputKg,variableCost,climateZones,sowMonths,harvestMonths,waterNeed="medium")=>({id,industries:["farm"],label,materials:{[seedId]:seedKg,fertilizer:fertilizerKg,diesel:dieselL},machineType:"field_line",durationMinutes:minutes,output:outputKg,outputUnit:"kg",product:id.replace("grow_",""),variableCost,cropMeta:{climateZones,sowMonths,harvestMonths,waterNeed}});
export const AgricultureCropContent={
 materials:[
  seed("seed_rye","Roggensaatgut"),seed("seed_oats","Hafersaatgut"),seed("seed_spelt","Dinkelsaatgut"),seed("seed_triticale","Triticalesaatgut"),
  seed("seed_sugar_beet","Zuckerrübensaatgut"),seed("seed_sunflower","Sonnenblumensaatgut"),seed("seed_peas","Erbsensaatgut"),seed("seed_field_beans","Ackerbohnensaatgut"),
  seed("seed_soy","Sojasaatgut"),seed("seed_flax","Leinsaatgut"),seed("seed_buckwheat","Buchweizensaatgut"),seed("seed_alfalfa","Luzernesaatgut")
 ],
 suppliers:[{
  id:"farm_seed_extended",industries:["farm"],label:"Saatgutgenossenschaft Europa",materials:["seed_rye","seed_oats","seed_spelt","seed_triticale","seed_sugar_beet","seed_sunflower","seed_peas","seed_field_beans","seed_soy","seed_flax","seed_buckwheat","seed_alfalfa"],
  prices:{seed_rye:.78,seed_oats:.72,seed_spelt:.96,seed_triticale:.74,seed_sugar_beet:3.8,seed_sunflower:2.1,seed_peas:1.05,seed_field_beans:.95,seed_soy:1.35,seed_flax:1.45,seed_buckwheat:1.18,seed_alfalfa:2.35},distanceKm:67,deliveryBase:42,deliveryPerKm:.46,deliveryHours:11,quality:.97,reliability:.98
 }],
 recipes:[
  crop("grow_corn","Mais anbauen","seed_corn",25,150,60,760,9000,132,["temperate","warm_temperate","continental"],[4,5],[9,10],"high"),
  crop("grow_rapeseed","Raps anbauen","seed_rapeseed",5,165,58,730,4200,138,["cool_temperate","temperate","continental"],[8,9],[7,8],"medium"),
  crop("grow_potato","Kartoffeln anbauen","seed_potato",2200,125,72,820,36000,235,["cool_temperate","temperate","continental"],[3,4,5],[8,9,10],"high"),
  crop("grow_rye","Roggen anbauen","seed_rye",160,115,50,690,6200,108,["cool_temperate","temperate","continental"],[9,10],[7,8],"low"),
  crop("grow_oats","Hafer anbauen","seed_oats",155,105,48,660,5600,104,["cool_temperate","temperate","continental"],[3,4],[7,8],"medium"),
  crop("grow_spelt","Dinkel anbauen","seed_spelt",180,120,51,710,5800,119,["cool_temperate","temperate"],[9,10,11],[7,8],"medium"),
  crop("grow_triticale","Triticale anbauen","seed_triticale",165,120,51,700,6500,112,["cool_temperate","temperate","continental"],[9,10],[7,8],"low"),
  crop("grow_sugar_beet","Zuckerrüben anbauen","seed_sugar_beet",2,180,75,880,70000,250,["temperate","warm_temperate","continental"],[3,4],[9,10,11],"high"),
  crop("grow_sunflower","Sonnenblumen anbauen","seed_sunflower",7,90,48,720,3200,115,["warm_temperate","continental","mediterranean"],[4,5],[9,10],"medium"),
  crop("grow_peas","Futter-/Körnererbsen anbauen","seed_peas",180,35,44,650,4800,92,["cool_temperate","temperate","continental"],[2,3,4],[7,8],"medium"),
  crop("grow_field_beans","Ackerbohnen anbauen","seed_field_beans",220,40,45,680,5200,96,["cool_temperate","temperate"],[2,3,4],[8,9],"medium"),
  crop("grow_soy","Sojabohnen anbauen","seed_soy",75,30,46,740,3300,110,["warm_temperate","continental","subtropical"],[4,5],[9,10],"medium"),
  crop("grow_flax","Lein anbauen","seed_flax",55,65,43,690,2200,101,["cool_temperate","temperate","continental"],[3,4],[8,9],"medium"),
  crop("grow_buckwheat","Buchweizen anbauen","seed_buckwheat",65,25,39,610,2500,86,["cool_temperate","temperate","continental"],[5,6],[8,9],"low"),
  crop("grow_alfalfa","Luzerne anbauen","seed_alfalfa",25,20,48,800,11000,98,["temperate","warm_temperate","continental","mediterranean"],[3,4,8],[6,7,8,9],"medium")
 ],
 products:[
  product("corn","Mais"),product("rapeseed","Raps"),product("potato","Kartoffeln"),product("rye","Roggen"),product("oats","Hafer"),product("spelt","Dinkel"),product("triticale","Triticale"),product("sugar_beet","Zuckerrüben"),product("sunflower","Sonnenblumen"),product("peas","Erbsen"),product("field_beans","Ackerbohnen"),product("soy","Sojabohnen"),product("flax","Lein"),product("buckwheat","Buchweizen"),product("alfalfa","Luzerne")
 ]
};
registerWorldContent(AgricultureCropContent);
