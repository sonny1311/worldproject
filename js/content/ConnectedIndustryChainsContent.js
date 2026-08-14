// WorldProject - durchgaengige Spieler-Wirtschaftsketten fuer Grundversorgung und Verarbeitung.
// KI-Lieferanten bleiben nur als Rueckfallversorgung; diese Inhalte machen die Zwischenstufen selbst spielbar.
import { registerWorldContent } from "../core/ContentRegistry.js";

const m=(id,label,unit="kg",storageZone="raw")=>({id,label,unit,storageZone});
const p=(id,industries,label,unit="kg",sellable=true)=>({id,industries,label,unit,sellable});
const r=(id,industries,label,materials,machineType,durationMinutes,output,product,variableCost,outputUnit="kg")=>({id,industries,label,materials,machineType,durationMinutes,output,product,variableCost,outputUnit});
const s=(id,industries,label,materials,prices,distanceKm=60,deliveryHours=8)=>({id,industries,label,materials,prices,distanceKm,deliveryBase:40,deliveryPerKm:.48,deliveryHours,quality:.94,reliability:.96,sourceType:"ai",fallbackOnly:true});

export const ConnectedIndustryChainsContent={
 materials:[
  m("forest_seedlings","Forstsetzlinge","Stk"),m("roundwood_soft","Nadel-Rundholz","m3"),m("roundwood_hard","Laub-Rundholz","m3"),
  m("wheat","Weizen"),m("barley","Gerste"),m("sugar_beet","Zuckerrueben"),m("raw_hops","Hopfen"),m("flour_wheat","Weizenmehl"),m("malt","Malz"),m("sugar","Zucker"),
  m("raw_milk","Rohmilch","l","cold"),m("butter","Butter","kg","cold"),m("cream","Sahne","l","cold"),m("eggs","Eier","Stk","cold"),
  m("cattle","Rinder","Stk","cold"),m("pigs","Schweine","Stk","cold"),m("beef","Rindfleisch","kg","cold"),m("pork","Schweinefleisch","kg","cold"),
  m("feed_grain","Futtergetreide"),m("animal_feed","Tierfutter"),m("salt","Salz"),m("spice_mix","Gewuerzmischung"),
  m("silica_sand","Quarzsand"),m("soda_ash","Soda"),m("limestone","Kalkstein"),m("glass_bottle_033","Getraenkeflasche 0,33 l","Stk","packaging"),m("glass_bottle_050","Getraenkeflasche 0,50 l","Stk","packaging"),
  m("steel_coil","Stahlcoil"),m("steel_sheet","Stahlblech"),m("steel_bar","Stahlprofil"),m("crown_cap","Kronkorken","Stk","packaging"),
  m("wood_pulp","Holzzellstoff"),m("paper_roll","Papierrolle"),m("cardboard","Kartonage","Stk","packaging"),m("printing_ink","Druckfarbe","l"),m("label_033","Etikett 0,33 l","Stk","packaging"),m("label_050","Etikett 0,50 l","Stk","packaging"),
  m("plastic_feedstock","Kunststoff-Rohstoff"),m("plastic_granulate","Kunststoffgranulat"),m("citric_acid","Zitronensaeure"),m("beverage_flavour","Getraenkearoma","l"),m("bottle_wash_chem","Flaschenwaschmittel"),m("fertilizer","Duenger"),
  m("bakery_bag","Baeckertuete","Stk","packaging"),m("meat_packaging","Fleischverpackung","Stk","packaging"),m("shipping_box","Versandkarton","Stk","packaging"),m("fruit_crate","Obstkiste","Stk","packaging")
 ],
 recipes:[
  r("forestry_softwood",["forestry"],"Nadelwald bewirtschaften",{forest_seedlings:120,diesel:35},"forestry_harvester",720,90,"roundwood_soft",160,"m3"),
  r("forestry_hardwood",["forestry"],"Laubwald bewirtschaften",{forest_seedlings:100,diesel:40},"forestry_harvester",840,65,"roundwood_hard",190,"m3"),
  r("saw_softwood",["sawmill"],"Nadelholz saegen",{roundwood_soft:20},"sawmill_line",150,15,"softwood",110,"m3"),
  r("saw_hardwood",["sawmill"],"Hartholz saegen",{roundwood_hard:15},"sawmill_line",170,10,"hardwood",135,"m3"),
  r("mill_wheat",["mill"],"Weizen mahlen",{wheat:1000},"grain_mill",90,780,"flour_wheat",62),
  r("malt_barley",["maltster"],"Gerste vermalzen",{barley:1000,water:850},"malting_line",480,800,"malt",145),
  r("grow_hops",["hops_farm"],"Hopfen anbauen",{fertilizer:90,diesel:45},"hop_harvester",900,650,"raw_hops",180),
  r("refine_sugar",["sugar_factory"],"Zuckerrueben raffinieren",{sugar_beet:1000,water:300},"sugar_line",240,150,"sugar",90),
  r("feed_mix",["feed_mill"],"Tierfutter mischen",{feed_grain:800,wheat:150,barley:150},"feed_mixer",120,1000,"animal_feed",75),
  r("dairy_butter",["dairy"],"Butter herstellen",{raw_milk:1000},"dairy_line",180,42,"butter",85),
  r("dairy_cream",["dairy"],"Sahne herstellen",{raw_milk:1000},"dairy_line",120,110,"cream",60,"l"),
  r("slaughter_beef",["slaughterhouse"],"Rind verarbeiten",{cattle:10},"slaughter_line",240,2600,"beef",420),
  r("slaughter_pork",["slaughterhouse"],"Schwein verarbeiten",{pigs:20},"slaughter_line",210,1600,"pork",310),
  r("glass_033",["glassworks"],"0,33-l-Flaschen herstellen",{silica_sand:700,soda_ash:180,limestone:120},"glass_furnace",180,3500,"glass_bottle_033",210,"Stk"),
  r("glass_050",["glassworks"],"0,50-l-Flaschen herstellen",{silica_sand:720,soda_ash:180,limestone:120},"glass_furnace",180,2800,"glass_bottle_050",220,"Stk"),
  r("steel_sheet_make",["steelworks"],"Stahlblech walzen",{steel_coil:1000},"rolling_mill",210,940,"steel_sheet",130),
  r("steel_bar_make",["steelworks"],"Stahlprofile walzen",{steel_coil:1000},"rolling_mill",220,925,"steel_bar",140),
  r("caps_make",["closures"],"Kronkorken fertigen",{steel_sheet:120},"cap_press",120,50000,"crown_cap",180,"Stk"),
  r("paper_make",["paper_mill"],"Papier herstellen",{wood_pulp:1000,water:3500},"paper_machine",240,920,"paper_roll",115),
  r("labels_033_make",["label_print"],"0,33-l-Etiketten drucken",{paper_roll:90,printing_ink:8},"label_press",100,50000,"label_033",150,"Stk"),
  r("labels_050_make",["label_print"],"0,50-l-Etiketten drucken",{paper_roll:105,printing_ink:9},"label_press",105,50000,"label_050",165,"Stk"),
  r("packaging_make",["packaging_maker"],"Verpackungen herstellen",{cardboard:1000,paper_roll:250},"packaging_line",160,1000,"shipping_box",95,"Stk"),
  r("plastic_granulate_make",["polymer"],"Kunststoffgranulat herstellen",{plastic_feedstock:1000},"polymer_line",220,930,"plastic_granulate",165),
  r("food_chemicals",["food_chemicals"],"Getraenkegrundstoffe herstellen",{water:500},"chemical_mixer",180,200,"citric_acid",110),
  r("fertilizer_make",["agri_chemicals"],"Duenger herstellen",{water:200},"fertilizer_line",180,1000,"fertilizer",120)
 ],
 products:[
  p("roundwood_soft",["forestry"],"Nadel-Rundholz","m3"),p("roundwood_hard",["forestry"],"Laub-Rundholz","m3"),p("softwood",["sawmill"],"Nadel-Schnittholz","m3"),p("hardwood",["sawmill"],"Hartholz","m3"),
  p("flour_wheat",["mill"],"Weizenmehl"),p("malt",["maltster"],"Malz"),p("raw_hops",["hops_farm"],"Hopfen"),p("sugar",["sugar_factory"],"Zucker"),p("animal_feed",["feed_mill"],"Tierfutter"),
  p("butter",["dairy"],"Butter"),p("cream",["dairy"],"Sahne","l"),p("beef",["slaughterhouse"],"Rindfleisch"),p("pork",["slaughterhouse"],"Schweinefleisch"),
  p("glass_bottle_033",["glassworks"],"Getraenkeflasche 0,33 l","Stk"),p("glass_bottle_050",["glassworks"],"Getraenkeflasche 0,50 l","Stk"),p("steel_sheet",["steelworks"],"Stahlblech"),p("steel_bar",["steelworks"],"Stahlprofil"),p("crown_cap",["closures"],"Kronkorken","Stk"),p("paper_roll",["paper_mill"],"Papierrolle"),p("label_033",["label_print"],"Etikett 0,33 l","Stk"),p("label_050",["label_print"],"Etikett 0,50 l","Stk"),p("shipping_box",["packaging_maker"],"Versandkarton","Stk"),p("plastic_granulate",["polymer"],"Kunststoffgranulat"),p("citric_acid",["food_chemicals"],"Zitronensaeure"),p("fertilizer",["agri_chemicals"],"Duenger")
 ],
 suppliers:[
  s("ai_forest_inputs",["forestry"],"KI Forstbedarf",["forest_seedlings","diesel"],{forest_seedlings:.42,diesel:1.45},38,6),
  s("ai_mill_wheat",["mill"],"KI Getreidehandel",["wheat"],{wheat:.31},52,7),s("ai_malt_barley",["maltster"],"KI Getreidehandel",["barley"],{barley:.29},52,7),
  s("ai_hops_inputs",["hops_farm"],"KI Agrarbedarf",["fertilizer","diesel"],{fertilizer:.55,diesel:1.45},41,6),
  s("ai_sawmill_logs",["sawmill"],"KI Forsthandel",["roundwood_soft","roundwood_hard"],{roundwood_soft:95,roundwood_hard:150},74,9),
  s("ai_dairy_milk",["dairy"],"KI Milchhandel",["raw_milk"],{raw_milk:.39},31,5),s("ai_slaughter_animals",["slaughterhouse"],"KI Viehhandel",["cattle","pigs"],{cattle:980,pigs:145},45,7),
  s("ai_glass_raw",["glassworks"],"KI Glasrohstoffe",["silica_sand","soda_ash","limestone"],{silica_sand:.08,soda_ash:.32,limestone:.06},88,11),
  s("ai_steel_raw",["steelworks"],"KI Stahlgrundstoff",["steel_coil"],{steel_coil:.84},105,13),s("ai_cap_sheet",["closures"],"KI Stahlhandel",["steel_sheet"],{steel_sheet:1.28},78,9),
  s("ai_print_raw",["label_print"],"KI Druckbedarf",["paper_roll","printing_ink"],{paper_roll:.92,printing_ink:4.8},48,7),s("ai_polymer_raw",["polymer"],"KI Polymergrundstoff",["plastic_feedstock"],{plastic_feedstock:1.12},96,12)
 ]
};
registerWorldContent(ConnectedIndustryChainsContent);
