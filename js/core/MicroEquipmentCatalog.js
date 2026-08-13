// WorldProject - kleine/gebrauchte Starterausstattung fuer Mikrogruendungen.
// Die professionelle Branchenausstattung bleibt fuer Wachstum und Kapazitaet bestehen.
const ITEMS={
 Brauerei:[
  {id:'micro_brew_kettle',name:'Kleine Brauanlage 30–50 l',price:2200,room:'production',capacity:50,replaces:['brew_kettle']},
  {id:'micro_fermenter',name:'Kleiner Gärbehälter',price:650,room:'production',capacity:60,replaces:['fermenter']},
  {id:'manual_bottle_filler',name:'Manueller Gegendruckfüller',price:450,room:'production',capacity:80,replaces:['filling_line']}
 ],
 Getränkehersteller:[
  {id:'micro_mixing_tank',name:'Kleiner Mischtank',price:950,room:'production',capacity:80,replaces:['mixing_tank']},
  {id:'manual_bottle_filler',name:'Manueller Flaschenfüller',price:350,room:'production',capacity:80,replaces:['filling_line']}
 ],
 Mineralbrunnen:[
  {id:'micro_water_filter',name:'Kleine Wasserfilteranlage',price:1200,room:'production',capacity:100,replaces:['water_treatment']},
  {id:'manual_bottle_filler',name:'Manueller Flaschenfüller',price:350,room:'production',capacity:80,replaces:['filling_line']}
 ],
 Schreinerei:[
  {id:'jobsite_table_saw',name:'Baumarkt-Tischkreissäge',price:650,room:'workshop',capacity:1,replaces:['panel_saw']},
  {id:'portable_planer',name:'Kleiner Dickenhobel',price:550,room:'workshop',capacity:1,replaces:['planer']},
  {id:'starter_workbench',name:'Werkbank',price:350,room:'workshop',capacity:1,replaces:['workbench']},
  {id:'shop_vacuum',name:'Werkstattsauger',price:220,room:'workshop',capacity:1,replaces:['dust_extractor']}
 ],
 Tischlerei:[
  {id:'jobsite_table_saw',name:'Baumarkt-Tischkreissäge',price:650,room:'workshop',capacity:1,replaces:['panel_saw']},
  {id:'portable_planer',name:'Kleiner Dickenhobel',price:550,room:'workshop',capacity:1,replaces:['planer']},
  {id:'starter_workbench',name:'Werkbank',price:350,room:'workshop',capacity:1,replaces:['workbench']},
  {id:'shop_vacuum',name:'Werkstattsauger',price:220,room:'workshop',capacity:1,replaces:['dust_extractor']}
 ],
 Bäckerei:[
  {id:'starter_oven',name:'Kleiner Gewerbe-Backofen',price:1800,room:'production',capacity:40,replaces:['bakery_oven']},
  {id:'starter_mixer',name:'Kleine Teigknetmaschine',price:650,room:'production',capacity:20,replaces:['dough_mixer']},
  {id:'starter_bakery_table',name:'Edelstahl-Arbeitstisch',price:300,room:'production',capacity:1,replaces:['bakery_worktable']}
 ],
 Metzgerei:[
  {id:'starter_fridge',name:'Gewerbekühlschrank',price:950,room:'storage',capacity:250,replaces:['cold_room']},
  {id:'starter_meat_grinder',name:'Kleiner Fleischwolf/Kutter',price:700,room:'production',capacity:25,replaces:['meat_cutter']},
  {id:'starter_butcher_table',name:'Edelstahl-Arbeitstisch',price:320,room:'production',capacity:1,replaces:['butcher_table']}
 ],
 Lebensmittelhersteller:[
  {id:'starter_food_mixer',name:'Kleiner Produktionsmischer',price:900,room:'production',capacity:40,replaces:['food_mixer']},
  {id:'manual_pack_station',name:'Manueller Verpackungsplatz',price:450,room:'production',capacity:100,replaces:['food_packaging']}
 ],
 Landwirtschaftsbetrieb:[
  {id:'used_compact_tractor',name:'Gebrauchter Kleintraktor',price:8500,room:'yard',capacity:1,replaces:['tractor']},
  {id:'used_cultivator',name:'Kleines gebrauchtes Bodenbearbeitungsgerät',price:2200,room:'yard',capacity:1,replaces:['cultivator']},
  {id:'small_seeder',name:'Kleine Sämaschine',price:2800,room:'yard',capacity:1,replaces:['seeder']},
  {id:'farm_shed',name:'Einfache Scheune / Lagerfläche',price:3500,room:'storage',capacity:80,replaces:['farm_storage']}
 ],
 Tierhaltung:[
  {id:'small_barn_setup',name:'Kleine Stalleinrichtung',price:3800,room:'production',capacity:15,replaces:['animal_barn']},
  {id:'small_feed_store',name:'Kleines Futterlager',price:1200,room:'storage',capacity:30,replaces:['feed_storage']}
 ],
 Obstbau:[
  {id:'used_orchard_tractor',name:'Gebrauchter Klein-/Schmalspurtraktor',price:7800,room:'yard',capacity:1,replaces:['orchard_tractor']},
  {id:'fruit_shed',name:'Kleine Obstlager-Scheune',price:2400,room:'storage',capacity:60,replaces:['fruit_storage']}
 ],
 Maschinenbau:[
  {id:'manual_mill',name:'Kleine gebrauchte Fräsmaschine',price:4800,room:'production',capacity:1,replaces:['cnc_mill']},
  {id:'starter_assembly_bench',name:'Montagewerkbank',price:650,room:'production',capacity:1,replaces:['assembly_station']},
  {id:'engine_hoist',name:'Werkstatt-Motorkran',price:550,room:'production',capacity:1,replaces:['workshop_crane']}
 ],
 Metallverarbeitung:[
  {id:'small_metal_saw',name:'Kleine Metallbandsäge',price:1200,room:'production',capacity:1,replaces:['metal_saw']},
  {id:'starter_welder',name:'MIG/MAG-Schweißgerät',price:900,room:'production',capacity:1,replaces:['welder']},
  {id:'manual_bender',name:'Manuelle Biegemaschine',price:650,room:'production',capacity:1,replaces:['press_brake']}
 ],
 Kunststoffverarbeitung:[
  {id:'small_injection_machine',name:'Kleine gebrauchte Spritzgießmaschine',price:6500,room:'production',capacity:1,replaces:['injection_machine']},
  {id:'small_material_dryer',name:'Kleiner Granulattrockner',price:850,room:'production',capacity:1,replaces:['material_dryer']}
 ],
 Einzelhandel:[
  {id:'used_shop_shelves',name:'Gebrauchte Ladenregale',price:1200,room:'sales',capacity:1,replaces:['shop_shelves']},
  {id:'starter_pos',name:'Einfaches Kassensystem',price:450,room:'sales',capacity:1,replaces:['pos_system']}
 ],
 Großhandel:[
  {id:'starter_warehouse_racks',name:'Gebrauchte Lagerregale',price:2200,room:'storage',capacity:1,replaces:['warehouse_racks']},
  {id:'manual_pallet_truck',name:'Handhubwagen',price:450,room:'storage',capacity:1,replaces:['forklift']}
 ],
 Onlinehandel:[
  {id:'starter_packing_table',name:'Einfacher Packtisch',price:350,room:'production',capacity:1,replaces:['packing_stations']},
  {id:'starter_storage_racks',name:'Gebrauchte Lagerregale',price:900,room:'storage',capacity:1,replaces:['warehouse_racks']},
  {id:'starter_shop_pc',name:'PC mit Shopsystem',price:750,room:'office',capacity:1,replaces:['shop_it']}
 ]
};
export function microEquipmentFor(companyOrType){const type=typeof companyOrType==='string'?companyOrType:companyOrType?.type||companyOrType?.company_type;return (ITEMS[type]||[]).map(x=>({...x,micro:true,used:true}));}
export function requiredMicroEquipmentFor(companyOrType){return microEquipmentFor(companyOrType).filter(x=>x.required!==false);}
export function microEquipmentCoverage(company={}){const owned=company?.buildingState?.equipment||company?.building_state?.equipment||[];const ids=new Set(owned.flatMap(x=>{const row=typeof x==='string'?{id:x}:x||{};return [row.id,row.type,row.equipmentId].filter(Boolean);}));const required=requiredMicroEquipmentFor(company);const missing=required.filter(item=>!ids.has(item.id)&&!(item.replaces||[]).some(id=>ids.has(id)));return{required,missing,complete:required.length>0&&missing.length===0,percent:required.length?Math.round((required.length-missing.length)/required.length*100):0};}
export function runMicroEquipmentTest(){const rows=Object.keys(ITEMS).map(type=>{const items=microEquipmentFor(type),price=items.reduce((s,x)=>s+x.price,0);return{type,price,count:items.length,ok:items.length>0&&price<50000};});const success=rows.every(x=>x.ok);console[success?'log':'error'](success?'✅ MIKROAUSSTATTUNGSTEST ERFOLGREICH':'❌ MIKROAUSSTATTUNGSTEST FEHLGESCHLAGEN',rows);return{success,rows};}
if(typeof window!=='undefined'){window.microEquipmentFor=microEquipmentFor;window.runMicroEquipmentTest=runMicroEquipmentTest;}
