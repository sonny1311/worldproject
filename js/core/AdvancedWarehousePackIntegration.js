// WorldProject – gleicht die ältere Dashboard-Lagerrechnung an die operative Gebindelogik an.
// Bestände bleiben Stück/kg/l; nur der belegte Lagerplatz wird mit Packfaktoren berechnet.
import { AdvancedEconomySystem } from './AdvancedEconomySystem.js';

const PACK_SIZE=Object.freeze({
  caps:1000,crown_cap:1000,
  labels:1000,label_033:1000,labels_050:1000,label_050:1000,
  bottles:20,bottle_033:20,clean_bottles:20,dirty_bottles:20,
  bottles_050:20,bottle_050:20,clean_bottles_050:20,dirty_bottles_050:20
});
const PACKAGING_IDS=new Set(Object.keys(PACK_SIZE));

export function dashboardStorageUnits(itemId,quantity){
  const q=Math.max(0,Number(quantity)||0),pack=Math.max(1,Number(PACK_SIZE[itemId])||1);
  return q/pack;
}
export function dashboardPackInfo(itemId,quantity){
  const pack=Number(PACK_SIZE[itemId])||1,q=Math.max(0,Number(quantity)||0);
  return {packSize:pack,packs:q/pack,pieces:q,isPacked:pack>1};
}

const proto=AdvancedEconomySystem.prototype;
if(!proto.__worldAdvancedWarehousePacksIntegrated){
  proto.__worldAdvancedWarehousePacksIntegrated=true;
  proto.getStorageUsed=function(company){
    this.ensureCompany(company);
    const inventory=Object.entries(company.inventory||{}).reduce((sum,[id,q])=>sum+dashboardStorageUnits(id,q),0);
    const finished=Object.entries(company.finishedGoods||{}).reduce((sum,[id,q])=>sum+dashboardStorageUnits(id,q),0);
    return inventory+finished;
  };
  proto.getStorageAreas=function(company){
    this.ensureCompany(company);
    const inventory=Object.entries(company.inventory||{});
    const raw=inventory.filter(([id])=>!PACKAGING_IDS.has(id)).reduce((sum,[id,q])=>sum+dashboardStorageUnits(id,q),0);
    const packaging=inventory.filter(([id])=>PACKAGING_IDS.has(id)).reduce((sum,[id,q])=>sum+dashboardStorageUnits(id,q),0);
    const finished=Object.entries(company.finishedGoods||{}).reduce((sum,[id,q])=>sum+dashboardStorageUnits(id,q),0);
    const areas=company.storageAreas||{raw:{capacity:10000},packaging:{capacity:50000},finished:{capacity:50000}};
    const row=(used,capacity)=>({used,capacity:Number(capacity)||0,free:Math.max(0,(Number(capacity)||0)-used)});
    return {raw:row(raw,areas.raw?.capacity),packaging:row(packaging,areas.packaging?.capacity),finished:row(finished,areas.finished?.capacity)};
  };
}

export function runAdvancedWarehousePackIntegrationTest(){
  const sys=new AdvancedEconomySystem(),company={inventory:{yeast_kg:199.55,crown_cap:20000,bottle_033:20000},finishedGoods:{lager033_bottle:100},vehicles:[]};
  const status=sys.getStorageStatus(company),areas=sys.getStorageAreas(company);
  const expected=199.55+20+1000+100;
  if(Math.abs(status.used-expected)>1e-9)throw new Error(`Dashboard-Lager zählt Verpackung noch einzeln: ${status.used}`);
  if(Math.abs(areas.packaging.used-1020)>1e-9)throw new Error(`Verpackungslager zählt Gebinde falsch: ${areas.packaging.used}`);
  return true;
}
if(typeof window!=='undefined')window.runAdvancedWarehousePackIntegrationTest=runAdvancedWarehousePackIntegrationTest;
