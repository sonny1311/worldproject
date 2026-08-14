// WorldProject – Laufzeitwache für die Gebinde-/Lagerplatzberechnung.
// Sichert die realistische Lagerbelegung auch dann ab, wenn andere Integrationen später Prototypen erweitern.
import { WarehouseSystem } from './OperationalSupplyChainSystem.js';
import { storageSpaceFor } from './WarehouseSpaceIntegration.js';

export function applyWarehouseSpaceRuntimeGuard(){
  const proto=WarehouseSystem.prototype;
  proto.spaceFor=function(materialId,quantity){return storageSpaceFor(materialId,quantity);};
  proto.used=function(zone){return Object.entries(this.stock?.[zone]||{}).reduce((sum,[id,quantity])=>sum+this.spaceFor(id,quantity),0);};
  proto.free=function(zone){return Math.max(0,Number(this.capacity(zone)||0)-this.used(zone));};
  proto.overfilled=function(zone){return this.used(zone)>Number(this.capacity(zone)||0)+1e-9;};
  proto.canReceive=function(zone,quantity,materialId=null){
    const q=Math.max(0,Number(quantity)||0);
    const space=materialId?this.spaceFor(materialId,q):q;
    return space>0&&!this.overfilled(zone)&&this.free(zone)+1e-9>=space;
  };
  return true;
}

export function runWarehouseSpaceRuntimeGuardTest(){
  applyWarehouseSpaceRuntimeGuard();
  const warehouse=new WarehouseSystem({raw:100,packaging:5000,finished:100,cold:100});
  warehouse.stock.packaging.caps=20000;
  warehouse.stock.packaging.bottles=20000;
  const used=warehouse.used('packaging');
  if(Math.abs(used-1020)>1e-9)throw new Error(`Gebindelager falsch: erwartet 1.020, erhalten ${used}`);
  if(Math.abs(warehouse.spaceFor('caps',20000)-20)>1e-9)throw new Error('Kronkorken werden nicht als 1.000er-Gebinde gezählt');
  if(Math.abs(warehouse.spaceFor('bottles',20000)-1000)>1e-9)throw new Error('Flaschen werden nicht als 20er-Gebinde gezählt');
  return true;
}

applyWarehouseSpaceRuntimeGuard();
if(typeof window!=='undefined')window.runWarehouseSpaceRuntimeGuardTest=runWarehouseSpaceRuntimeGuardTest;
