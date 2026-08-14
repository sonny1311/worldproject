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
  const expected=1+(20000/300);
  if(Math.abs(used-expected)>1e-9)throw new Error(`Gebindelager falsch: erwartet ${expected}, erhalten ${used}`);
  if(Math.abs(warehouse.spaceFor('caps',20000)-1)>1e-9)throw new Error('20.000 Kronkorken müssen 1 Europalette belegen');
  if(Math.abs(warehouse.spaceFor('bottles',300)-1)>1e-9)throw new Error('300 Leerflaschen müssen 1 Europalette belegen');
  return true;
}

applyWarehouseSpaceRuntimeGuard();
if(typeof window!=='undefined')window.runWarehouseSpaceRuntimeGuardTest=runWarehouseSpaceRuntimeGuardTest;
