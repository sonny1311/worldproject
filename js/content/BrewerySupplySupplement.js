// Ergänzt die Brauerei um fehlende beschaffbare Basisinputs und den Mehrwegflaschenkreislauf.
import { registerWorldContent } from "../core/ContentRegistry.js";
registerWorldContent({
 materials:[
  {id:"dirty_bottles",label:"Ungereinigte Rücklaufflaschen 0,33 l",unit:"Stk",storageZone:"packaging"},
  {id:"dirty_bottles_050",label:"Ungereinigte Rücklaufflaschen 0,50 l",unit:"Stk",storageZone:"packaging"}
 ],
 suppliers:[
  {id:"brew_basics",industries:["brewery"],label:"Brauereibedarf Regional",materials:["yeast","water","bottle_wash_chem"],prices:{yeast:6.5,water:.01,bottle_wash_chem:4.9},distanceKm:18,deliveryBase:25,deliveryPerKm:.38,deliveryHours:4,quality:.97,reliability:.99}
 ],
 recipes:[
  {id:"wash_bottles",industries:["brewery"],label:"Rücklaufflaschen 0,33 l reinigen",materials:{dirty_bottles:1000,bottle_wash_chem:1,water:250},machineType:"bottle_washer",durationMinutes:60,output:1000,outputUnit:"Stk",product:"clean_bottles",variableCost:12,bottleSizeLiters:.33,productionStage:"bottle_washing",deprecated:false},
  {id:"wash_bottles_050",industries:["brewery"],label:"Rücklaufflaschen 0,50 l reinigen",materials:{dirty_bottles_050:1000,bottle_wash_chem:1,water:280},machineType:"bottle_washer",durationMinutes:60,output:1000,outputUnit:"Stk",product:"clean_bottles_050",variableCost:13,bottleSizeLiters:.5,productionStage:"bottle_washing",deprecated:false}
 ]
});
