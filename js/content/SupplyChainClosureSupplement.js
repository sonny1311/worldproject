// WorldProject - schliesst Restluecken zwischen den neuen Gewerben und haelt KI nur als Start-/Notversorgung vor.
import { registerWorldContent } from "../core/ContentRegistry.js";
const fallback=(id,industries,label,materials,prices,distanceKm=65,deliveryHours=8)=>({id,industries,label,materials,prices,distanceKm,deliveryBase:40,deliveryPerKm:.48,deliveryHours,quality:.93,reliability:.96,sourceType:"ai",fallbackOnly:true});
registerWorldContent({
 materials:[{id:"wood_chips",label:"Holzhackschnitzel / Faserholz",unit:"kg",storageZone:"raw"}],
 recipes:[
  {id:"sawmill_fiberwood",industries:["sawmill"],label:"Faserholz und Hackschnitzel aufbereiten",materials:{roundwood_soft:12},machineType:"sawmill_line",durationMinutes:100,output:4800,outputUnit:"kg",product:"wood_chips",variableCost:65},
  {id:"feed_mix",industries:["feed_mill"],label:"Tierfutter mischen",materials:{corn:500,wheat:300,barley:200},machineType:"feed_mixer",durationMinutes:120,output:1000,outputUnit:"kg",product:"animal_feed",variableCost:75},
  {id:"paper_make",industries:["paper_mill"],label:"Papier herstellen",materials:{wood_chips:1000,water:3500},machineType:"paper_machine",durationMinutes:240,output:920,outputUnit:"kg",product:"paper_roll",variableCost:115},
  {id:"cardboard_make",industries:["paper_mill"],label:"Kartonage herstellen",materials:{wood_chips:1100,water:3000},machineType:"paper_machine",durationMinutes:250,output:1000,outputUnit:"Stk",product:"cardboard",variableCost:125}
 ],
 products:[{id:"wood_chips",industries:["sawmill"],label:"Holzhackschnitzel / Faserholz",unit:"kg"},{id:"cardboard",industries:["paper_mill"],label:"Kartonage",unit:"Stk"}],
 suppliers:[
  fallback("ai_industrial_water",["maltster","sugar_factory","paper_mill","food_chemicals","agri_chemicals"],"KI Wasser-/Prozessversorgung",["water"],{water:.012},24,4),
  fallback("ai_feed_grain",["feed_mill"],"KI Futtermittel-Getreidehandel",["corn","wheat","barley"],{corn:.28,wheat:.31,barley:.29},48,7),
  fallback("ai_sugar_beet",["sugar_factory"],"KI Rübenhandel",["sugar_beet"],{sugar_beet:.055},42,6),
  fallback("ai_paper_fiber",["paper_mill"],"KI Faserholzhandel",["wood_chips"],{wood_chips:.11},70,9),
  fallback("ai_packaging_inputs",["packaging_maker"],"KI Verpackungsgrundstoffe",["cardboard","paper_roll","plastic_granulate","softwood"],{cardboard:.32,paper_roll:.92,plastic_granulate:1.8,softwood:520},68,9),
  fallback("ai_food_chem_water",["food_chemicals"],"KI Prozesswasser",["water"],{water:.012},20,4),
  fallback("ai_agri_chem_water",["agri_chemicals"],"KI Prozesswasser",["water"],{water:.012},20,4)
 ]
});
