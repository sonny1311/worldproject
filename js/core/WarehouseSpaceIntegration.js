// WorldProject – Lagerplatz = ein Europaletten-Äquivalent.
// Bestände/Rezepte bleiben in echten Stück-, kg-, Liter- oder Set-Mengen.
import { WarehouseSystem, StorageZones } from './OperationalSupplyChainSystem.js';
import { worldContentRegistry } from './ContentRegistry.js';

export const EURO_PALLET=Object.freeze({label:'Europalette',lengthMm:1200,widthMm:800,areaSqm:.96});
const RULES=Object.freeze({
  caps:{packSize:20000,spacePerPack:1,label:'20.000 Kronkorken / Europalette'},
  crown_cap:{packSize:20000,spacePerPack:1,label:'20.000 Kronkorken / Europalette'},
  labels:{packSize:20000,spacePerPack:1,label:'20.000 Etiketten / Europalette'},
  label_033:{packSize:20000,spacePerPack:1,label:'20.000 Etiketten / Europalette'},
  labels_050:{packSize:20000,spacePerPack:1,label:'20.000 Etiketten / Europalette'},
  bottles:{packSize:300,spacePerPack:1,label:'300 Leerflaschen / Europalette'},
  bottle_033:{packSize:300,spacePerPack:1,label:'300 Leerflaschen / Europalette'},
  clean_bottles:{packSize:300,spacePerPack:1,label:'300 Leerflaschen / Europalette'},
  dirty_bottles:{packSize:300,spacePerPack:1,label:'300 Leerflaschen / Europalette'},
  bottles_050:{packSize:300,spacePerPack:1,label:'300 Leerflaschen / Europalette'},
  clean_bottles_050:{packSize:300,spacePerPack:1,label:'300 Leerflaschen / Europalette'},
  dirty_bottles_050:{packSize:300,spacePerPack:1,label:'300 Leerflaschen / Europalette'},
  malt:{packSize:750,spacePerPack:1,label:'ca. 750 kg Sackware / Europalette'},
  malt_kg:{packSize:750,spacePerPack:1,label:'ca. 750 kg Sackware / Europalette'},
  hops:{packSize:500,spacePerPack:1,label:'ca. 500 kg Hopfen / Europalette'},
  hops_kg:{packSize:500,spacePerPack:1,label:'ca. 500 kg Hopfen / Europalette'},
  yeast:{packSize:400,spacePerPack:1,label:'ca. 400 kg Hefegebinde / Europalette'},
  yeast_kg:{packSize:400,spacePerPack:1,label:'ca. 400 kg Hefegebinde / Europalette'},
  bottle_wash_chem:{packSize:600,spacePerPack:1,label:'ca. 600 kg Chemiegebinde / Europalette'},
  water:{packSize:1000,spacePerPack:1,label:'1.000 l IBC / Palettenstellplatz'},
  water_l:{packSize:1000,spacePerPack:1,label:'1.000 l IBC / Palettenstellplatz'},
  beer_bulk_pils:{packSize:1000,spacePerPack:1,label:'1.000 l Tank-/IBC-Äquivalent'},
  beer_bulk_lager:{packSize:1000,spacePerPack:1,label:'1.000 l Tank-/IBC-Äquivalent'},
  softwood:{packSize:1.5,spacePerPack:1,label:'ca. 1,5 m³ Holz / Stellplatz'},
  hardwood:{packSize:1.3,spacePerPack:1,label:'ca. 1,3 m³ Holz / Stellplatz'},
  plywood:{packSize:60,spacePerPack:1,label:'ca. 60 m² Plattenmaterial / Palette'},
  glue:{packSize:600,spacePerPack:1,label:'ca. 600 kg Leim / Palette'},
  screws:{packSize:120,spacePerPack:1,label:'ca. 120 Sets/Kartons / Palette'},
  varnish:{packSize:600,spacePerPack:1,label:'ca. 600 l Lack/Öl / Palette'},
  packaging:{packSize:500,spacePerPack:1,label:'ca. 500 Verpackungseinheiten / Palette'},
  seed_wheat:{packSize:750,spacePerPack:1,label:'ca. 750 kg Saatgut / Palette'},
  seed_barley:{packSize:750,spacePerPack:1,label:'ca. 750 kg Saatgut / Palette'},
  seed_corn:{packSize:700,spacePerPack:1,label:'ca. 700 kg Saatgut / Palette'},
  seed_rapeseed:{packSize:700,spacePerPack:1,label:'ca. 700 kg Saatgut / Palette'},
  seed_potato:{packSize:900,spacePerPack:1,label:'ca. 900 kg Pflanzkartoffeln / Palette'},
  fertilizer:{packSize:1000,spacePerPack:1,label:'1.000 kg Big-Bag / Palettenplatz'},
  animal_feed:{packSize:1000,spacePerPack:1,label:'1.000 kg Big-Bag / Palettenplatz'},
  straw:{packSize:450,spacePerPack:1,label:'ca. 450 kg Ballen / Stellplatz'},
  diesel:{packSize:1000,spacePerPack:1,label:'1.000 l Tank-/IBC-Äquivalent'}
});
const metaFor=id=>worldContentRegistry.get('materials',id)||worldContentRegistry.get('products',id)||{};
function inferredRule(id,meta={}){
  if(Number(meta.bottleSizeLiters)>0||/(_033|_050)$/.test(String(id)))return{packSize:600,spacePerPack:1,label:'30 Kisten × 20 Flaschen = 600 Flaschen / Europalette'};
  const unit=String(meta.unit||'').toLowerCase();
  if(unit.includes('flasche'))return{packSize:600,spacePerPack:1,label:'600 Flaschen / Europalette'};
  if(unit==='kg')return{packSize:750,spacePerPack:1,label:'ca. 750 kg / Europalette'};
  if(unit==='l')return{packSize:1000,spacePerPack:1,label:'ca. 1.000 l / Palettenstellplatz'};
  if(unit==='stk')return{packSize:250,spacePerPack:1,label:'ca. 250 Stück / Europalette'};
  return{packSize:1,spacePerPack:1,label:'1 Einheit / Palettenstellplatz'};
}
export function storageRule(materialId){
  const meta=metaFor(materialId);
  if(Number(meta.storageSpacePerUnit)>0)return{packSize:1,spacePerPack:Number(meta.storageSpacePerUnit),label:meta.storagePackLabel||null};
  if(Number(meta.storagePackSize)>0)return{packSize:Number(meta.storagePackSize),spacePerPack:Number(meta.storageSpacePerPack||1),label:meta.storagePackLabel||null};
  return RULES[materialId]||inferredRule(materialId,meta);
}
export function storageSpaceFor(materialId,quantity){const q=Math.max(0,Number(quantity)||0),r=storageRule(materialId);return q/r.packSize*r.spacePerPack;}
export function storagePackDescription(materialId){const r=storageRule(materialId);return r.label||null;}
export function storagePalletEquivalent(materialId,quantity){return storageSpaceFor(materialId,quantity);}

const proto=WarehouseSystem.prototype;
if(!proto.__worldRealisticWarehouseSpaceIntegrated){
  proto.__worldRealisticWarehouseSpaceIntegrated=true;
  proto.spaceFor=function(materialId,quantity){return storageSpaceFor(materialId,quantity);};
  proto.used=function(zone){return Object.entries(this.stock[zone]||{}).reduce((sum,[id,q])=>sum+this.spaceFor(id,q),0);};
  proto.free=function(zone){return Math.max(0,this.capacity(zone)-this.used(zone));};
  proto.overfilled=function(zone){return this.used(zone)>this.capacity(zone)+1e-9;};
  proto.canReceive=function(zone,quantity,materialId=null){const space=materialId?this.spaceFor(materialId,quantity):Math.max(0,Number(quantity)||0);return space>0&&!this.overfilled(zone)&&this.free(zone)+1e-9>=space;};
  proto.receive=function(order){if(!order||order.status!=='arrived')throw new Error('Lieferung ist noch nicht angekommen');const quantity=Number(order.quantity),material=String(order.material||''),zone=this.zoneFor(material);if(!Number.isFinite(quantity)||quantity<=0)throw new Error('Liefermenge muss größer als 0 sein');if(!metaFor(material).id&&!worldContentRegistry.get('materials',material))throw new Error('Lieferung hat keinen gültigen Rohstoff');if(!this.stock[zone])throw new Error(`Unbekannter Lagerbereich: ${zone}`);if(!this.canReceive(zone,quantity,material))throw new Error(this.overfilled(zone)?`${StorageZones[zone]?.label||zone} ist überbelegt; erst Bestand abbauen`:`Nicht genug Platz im ${StorageZones[zone]?.label||zone}`);this.stock[zone][material]=Number(this.stock[zone][material]||0)+quantity;order.status='stored';order.storedAt=Date.now();return{zone,quantity,spaceUsed:this.spaceFor(material,quantity)};};
  proto.addProduced=function(product,quantity){if(!product||typeof product!=='string')throw new Error('Produkt fehlt');const q=Number(quantity);if(!Number.isFinite(q)||q<=0)throw new Error('Produktionsmenge muss größer als 0 sein');const meta=metaFor(product),zone=meta.storageZone||'finished';if(!this.stock[zone])throw new Error(`Unbekannter Lagerbereich: ${zone}`);if(!this.canReceive(zone,q,product))throw new Error(this.overfilled(zone)?`${StorageZones[zone]?.label||zone} ist überbelegt`:`Nicht genug Platz im ${StorageZones[zone]?.label||zone}`);this.stock[zone][product]=Number(this.stock[zone][product]||0)+q;return{zone,quantity:q,spaceUsed:this.spaceFor(product,q)};};
  proto.addFinished=function(product,quantity){return this.addProduced(product,quantity);};
}

export function runWarehouseSpaceIntegrationTest(){
  const near=(a,b)=>Math.abs(a-b)<1e-9;
  if(!near(storageSpaceFor('caps',20000),1)||!near(storageSpaceFor('crown_cap',20000),1))throw new Error('20.000 Kronkorken müssen 1 Europalette belegen');
  if(!near(storageSpaceFor('bottles',300),1)||!near(storageSpaceFor('bottle_033',300),1))throw new Error('300 Leerflaschen müssen 1 Europalette belegen');
  if(!near(storageSpaceFor('yeast',1),.0025)||!near(storageSpaceFor('yeast_kg',1),.0025))throw new Error('1 kg Hefe darf keinen ganzen Lagerplatz belegen');
  if(!near(storageSpaceFor('beer_pils_033',600),1))throw new Error('600 fertige Getränkeflaschen müssen 1 Europalette belegen');
  const wh=new WarehouseSystem({raw:10,packaging:100,finished:10,cold:10});wh.stock.packaging.caps=20000;wh.stock.packaging.bottles=300;wh.stock.cold.yeast=1;if(!near(wh.used('packaging'),2))throw new Error('Palettenfaktor Verpackung fehlerhaft');if(!near(wh.used('cold'),.0025))throw new Error('Teilpaletten werden nicht korrekt gerechnet');return true;
}
if(typeof window!=='undefined')window.runWarehouseSpaceIntegrationTest=runWarehouseSpaceIntegrationTest;
