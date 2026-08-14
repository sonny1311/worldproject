// WorldProject – vereinheitlicht die alte Economy-Lagerrechnung mit der realistischen Palettenplatzlogik.
// Verhindert, dass z. B. 20.000 Kronkorken als 20.000 Lagerplätze zählen.
import { AdvancedEconomySystem } from './AdvancedEconomySystem.js';
import { storageSpaceFor } from './WarehouseSpaceIntegration.js';

const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const packIds=new Set(['bottle_033','crown_cap','label_033']);

if(!AdvancedEconomySystem.prototype.__worldPalletWarehouseBridge){
  AdvancedEconomySystem.prototype.__worldPalletWarehouseBridge=true;

  AdvancedEconomySystem.prototype.getStorageUsed=function(company){
    this.ensureCompany(company);
    let used=0;
    for(const [id,q] of Object.entries(company.inventory||{}))used+=storageSpaceFor(id,q);
    for(const [id,q] of Object.entries(company.finishedGoods||{}))used+=storageSpaceFor(id,q);
    return used;
  };

  AdvancedEconomySystem.prototype.getStorageStatus=function(company){
    this.ensureCompany(company);
    const used=this.getStorageUsed(company),capacity=Math.max(n(company.storageState?.capacityUnits),0),free=Math.max(0,capacity-used);
    return{used,capacity,free,full:capacity>0&&used>=capacity-1e-9,percent:capacity>0?used/capacity*100:100,unit:'Palettenplätze'};
  };

  AdvancedEconomySystem.prototype.getStorageAreas=function(company){
    this.ensureCompany(company);
    const rawEntries=[],packEntries=[];
    for(const [id,q] of Object.entries(company.inventory||{}))(packIds.has(id)?packEntries:rawEntries).push([id,q]);
    const raw=rawEntries.reduce((s,[id,q])=>s+storageSpaceFor(id,q),0),packaging=packEntries.reduce((s,[id,q])=>s+storageSpaceFor(id,q),0),finished=Object.entries(company.finishedGoods||{}).reduce((s,[id,q])=>s+storageSpaceFor(id,q),0);
    const make=(used,capacity)=>({used,capacity:n(capacity),free:Math.max(0,n(capacity)-used),full:n(capacity)>0&&used>=n(capacity)-1e-9,unit:'Palettenplätze'});
    return{raw:make(raw,company.storageAreas?.raw?.capacity),packaging:make(packaging,company.storageAreas?.packaging?.capacity),finished:make(finished,company.storageAreas?.finished?.capacity)};
  };

  AdvancedEconomySystem.prototype.canStore=function(company,amount,materialId=null){
    const need=materialId?storageSpaceFor(materialId,amount):Math.max(n(amount),0);
    return need<=this.getStorageStatus(company).free+1e-9;
  };

  // Neue Lieferungen prüfen ihren tatsächlichen Palettenbedarf, nicht die Stückzahl.
  const originalCreateSupplierDelivery=AdvancedEconomySystem.prototype.createSupplierDelivery;
  AdvancedEconomySystem.prototype.createSupplierDelivery=function(company,offer,amount,totalCost,options={}){
    this.ensureCompany(company);
    if(!this.canStore(company,amount,offer?.itemId))return{success:false,reason:'Lager hat nicht genug freien Platz'};
    // Originalprüfung würde ohne Material-ID wieder Stückzahlen verwenden. Für diesen Aufruf wird nur die bereits
    // korrekt geprüfte Menge freigegeben; danach ist die normale Methode wieder aktiv.
    const ownCanStore=this.canStore;
    this.canStore=()=>true;
    try{return originalCreateSupplierDelivery.call(this,company,offer,amount,totalCost,options);}
    finally{this.canStore=ownCanStore;}
  };

  // Bei Ankunft ebenfalls den Materialtyp berücksichtigen.
  const originalProcess=AdvancedEconomySystem.prototype.processSupplierDeliveries;
  AdvancedEconomySystem.prototype.processSupplierDeliveries=function(company,now=new Date()){
    this.ensureCompany(company);
    const ownCanStore=this.canStore;
    this.canStore=(c,amount)=>{
      const current=(c?.supplierOrders||[]).find(o=>['ordered','in_transit','waiting_storage'].includes(o.status)&&Number(o.amount)===Number(amount)&&new Date(o.arrivalAt)<=now);
      return ownCanStore.call(this,c,amount,current?.itemId||null);
    };
    try{return originalProcess.call(this,company,now);}
    finally{this.canStore=ownCanStore;}
  };
}

export function runLegacyEconomyWarehouseSpaceBridgeTest(){
  const s=new AdvancedEconomySystem(),c={inventory:{crown_cap:20000,bottle_033:20000,yeast_kg:200},finishedGoods:{beer_bulk_lager:100},storageState:{capacityUnits:25000},storageAreas:{raw:{capacity:10000},packaging:{capacity:10000},finished:{capacity:10000}}};
  const status=s.getStorageStatus(c),areas=s.getStorageAreas(c);
  if(status.full)throw new Error('Bestand wird im alten Economy-System fälschlich als voll gerechnet');
  if(Math.abs(areas.packaging.used-(1+20000/300))>.001)throw new Error('Verpackung wird nicht in Palettenplätzen gerechnet');
  if(!s.canStore(c,20000,'crown_cap'))throw new Error('20.000 Kronkorken müssen als 1 Palettenplatz angenommen werden können');
  return true;
}
if(typeof window!=='undefined')window.runLegacyEconomyWarehouseSpaceBridgeTest=runLegacyEconomyWarehouseSpaceBridgeTest;
