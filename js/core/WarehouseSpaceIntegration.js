// WorldProject – Lagerplatz wird nach Gebinde/Volumen statt stumpf je Einzelstück berechnet.
// Bestände und Rezepte bleiben weiterhin in echten Stück-/kg-/Liter-Mengen.
import { WarehouseSystem, StorageZones } from './OperationalSupplyChainSystem.js';
import { worldContentRegistry } from './ContentRegistry.js';

const DEFAULT_PACKS=Object.freeze({
  caps:{packSize:1000,spacePerPack:1,label:'1.000er-Gebinde'},
  labels:{packSize:1000,spacePerPack:1,label:'1.000er-Gebinde'},
  labels_050:{packSize:1000,spacePerPack:1,label:'1.000er-Gebinde'},
  bottles:{packSize:20,spacePerPack:1,label:'20er-Flaschengebinde'},
  clean_bottles:{packSize:20,spacePerPack:1,label:'20er-Flaschengebinde'},
  dirty_bottles:{packSize:20,spacePerPack:1,label:'20er-Flaschengebinde'},
  bottles_050:{packSize:20,spacePerPack:1,label:'20er-Flaschengebinde'},
  clean_bottles_050:{packSize:20,spacePerPack:1,label:'20er-Flaschengebinde'},
  dirty_bottles_050:{packSize:20,spacePerPack:1,label:'20er-Flaschengebinde'}
});

export function storageRule(materialId){
  const meta=worldContentRegistry.get('materials',materialId)||{};
  if(Number(meta.storageSpacePerUnit)>0)return{packSize:1,spacePerPack:Number(meta.storageSpacePerUnit),label:meta.storagePackLabel||null};
  if(Number(meta.storagePackSize)>0)return{packSize:Number(meta.storagePackSize),spacePerPack:Number(meta.storageSpacePerPack||1),label:meta.storagePackLabel||null};
  return DEFAULT_PACKS[materialId]||{packSize:1,spacePerPack:1,label:null};
}
export function storageSpaceFor(materialId,quantity){
  const q=Math.max(0,Number(quantity)||0),r=storageRule(materialId);
  return q/r.packSize*r.spacePerPack;
}
export function storagePackDescription(materialId){const r=storageRule(materialId);return r.label||null;}

const proto=WarehouseSystem.prototype;
if(!proto.__worldRealisticWarehouseSpaceIntegrated){
  proto.__worldRealisticWarehouseSpaceIntegrated=true;
  proto.spaceFor=function(materialId,quantity){return storageSpaceFor(materialId,quantity);};
  proto.used=function(zone){return Object.entries(this.stock[zone]||{}).reduce((sum,[id,q])=>sum+this.spaceFor(id,q),0);};
  proto.free=function(zone){return Math.max(0,this.capacity(zone)-this.used(zone));};
  proto.overfilled=function(zone){return this.used(zone)>this.capacity(zone)+1e-9;};
  proto.canReceive=function(zone,quantity,materialId=null){const space=materialId?this.spaceFor(materialId,quantity):Math.max(0,Number(quantity)||0);return space>0&&!this.overfilled(zone)&&this.free(zone)+1e-9>=space;};
  proto.receive=function(order){
    if(!order||order.status!=='arrived')throw new Error('Lieferung ist noch nicht angekommen');
    const quantity=Number(order.quantity),material=String(order.material||''),zone=this.zoneFor(material);
    if(!Number.isFinite(quantity)||quantity<=0)throw new Error('Liefermenge muss größer als 0 sein');
    if(!worldContentRegistry.get('materials',material))throw new Error('Lieferung hat keinen gültigen Rohstoff');
    if(!this.stock[zone])throw new Error(`Unbekannter Lagerbereich: ${zone}`);
    if(!this.canReceive(zone,quantity,material))throw new Error(this.overfilled(zone)?`${StorageZones[zone]?.label||zone} ist überbelegt; erst Bestand abbauen`:`Nicht genug Platz im ${StorageZones[zone]?.label||zone}`);
    this.stock[zone][material]=Number(this.stock[zone][material]||0)+quantity;order.status='stored';order.storedAt=Date.now();return{zone,quantity,spaceUsed:this.spaceFor(material,quantity)};
  };
  proto.addProduced=function(product,quantity){
    if(!product||typeof product!=='string')throw new Error('Produkt fehlt');const q=Number(quantity);if(!Number.isFinite(q)||q<=0)throw new Error('Produktionsmenge muss größer als 0 sein');
    const zone=worldContentRegistry.get('materials',product)?.storageZone||'finished';if(!this.stock[zone])throw new Error(`Unbekannter Lagerbereich: ${zone}`);
    if(!this.canReceive(zone,q,product))throw new Error(this.overfilled(zone)?`${StorageZones[zone]?.label||zone} ist überbelegt`:`Nicht genug Platz im ${StorageZones[zone]?.label||zone}`);
    this.stock[zone][product]=Number(this.stock[zone][product]||0)+q;return{zone,quantity:q,spaceUsed:this.spaceFor(product,q)};
  };
  proto.addFinished=function(product,quantity){return this.addProduced(product,quantity);};
}

export function runWarehouseSpaceIntegrationTest(){
  if(storageSpaceFor('caps',20000)!==20)throw new Error('20.000 Kronkorken müssen 20 Lagerplätze belegen');
  if(storageSpaceFor('bottles',20000)!==1000)throw new Error('20.000 Flaschen müssen als 20er-Gebinde 1.000 Lagerplätze belegen');
  const wh=new WarehouseSystem({raw:10,packaging:100,finished:10,cold:10});wh.stock.packaging.caps=20000;
  if(Math.abs(wh.used('packaging')-20)>1e-9)throw new Error('Gebindefaktor wird im Lager nicht angewendet');
  return true;
}
if(typeof window!=='undefined')window.runWarehouseSpaceIntegrationTest=runWarehouseSpaceIntegrationTest;
