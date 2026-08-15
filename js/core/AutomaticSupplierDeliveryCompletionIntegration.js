// ORVUNO – Lieferungen nach Erreichen der ETA automatisch ins Lager buchen.
// Es gibt fuer normale Lieferantenbestellungen keinen manuellen "Einsammeln"-Schritt mehr.
import { AdvancedEconomySystem } from './AdvancedEconomySystem.js';

const ACTIVE=new Set(['ordered','in_transit','waiting_storage','delayed']);
const economy=new AdvancedEconomySystem();
const num=v=>Number.isFinite(Number(v))?Number(v):0;

function company(){return window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null;}
function effectiveEta(order={}){
 const live=order.liveTraffic;
 const liveEta=live?.verifiedLive===true?num(live?.route?.eta||order.trafficEta):0;
 if(liveEta>0)return liveEta;
 return num(new Date(order.arrivalAt||order.eta||order.arriveAt||0).getTime());
}
function due(order,now=Date.now()){return ACTIVE.has(String(order?.status||'').toLowerCase())&&effectiveEta(order)>0&&effectiveEta(order)<=now;}

export function completeDueSupplierDeliveries(c=company(),now=Date.now()){
 if(!c)return[];
 economy.ensureCompany(c);
 const completed=[];
 for(const order of c.supplierOrders||[]){
  if(!due(order,now))continue;
  const amount=Math.max(0,Number(order.amount||order.quantity)||0);
  const itemId=order.itemId||order.material;
  if(!itemId||amount<=0)continue;
  if(!economy.canStore(c,amount)){order.status='waiting_storage';continue;}
  c.inventory[itemId]=(Number(c.inventory[itemId])||0)+amount;
  order.status='delivered';
  order.deliveredAt=new Date(now);
  order.autoReceived=true;
  order.receiptMode='automatic';
  const vehicle=c.vehicles?.find(v=>String(v.id)===String(order.vehicleId));
  if(vehicle)vehicle.status='available';
  completed.push(order);
 }
 if(completed.length){
  window.dispatchEvent(new CustomEvent('world:game-state-dirty'));
  window.dispatchEvent(new CustomEvent('world:supplier-deliveries-auto-received',{detail:{count:completed.length,orders:completed}}));
 }
 return completed;
}

// Auch der normale Wirtschafts-Tick nutzt die HERE-ETA, damit Live-Verkehr und Wareneingang
// nie gegeneinander laufen.
if(!AdvancedEconomySystem.prototype.__automaticArrivalIntegrated){
 const original=AdvancedEconomySystem.prototype.processSupplierDeliveries;
 AdvancedEconomySystem.prototype.processSupplierDeliveries=function(c,now=new Date()){
  const result=original.call(this,c,now);
  completeDueSupplierDeliveries(c,new Date(now).getTime());
  return result;
 };
 AdvancedEconomySystem.prototype.__automaticArrivalIntegrated=true;
}

function tick(){try{completeDueSupplierDeliveries();}catch(error){console.error('Automatischer Wareneingang fehlgeschlagen',error);}}
if(typeof window!=='undefined'){
 window.worldAutomaticSupplierDelivery={complete:completeDueSupplierDeliveries};
 setInterval(tick,5000);
 for(const ev of ['world:traffic-updated','world:game-resumed','worldproject:company-switched','world:user-login','world:access-granted'])window.addEventListener(ev,()=>setTimeout(tick,50));
 setTimeout(tick,500);
}

export function runAutomaticSupplierDeliveryCompletionTest(){
 const c={money:0,inventory:{},finishedGoods:{},vehicles:[],supplierOrders:[{id:'old',itemId:'labels',amount:100,status:'in_transit',arrivalAt:new Date(Date.now()-60000)}]};
 completeDueSupplierDeliveries(c,Date.now());
 if(c.inventory.labels!==100||c.supplierOrders[0].status!=='delivered'||!c.supplierOrders[0].autoReceived)throw new Error('Faellige Lieferung wurde nicht automatisch eingebucht');
 const before=c.inventory.labels;completeDueSupplierDeliveries(c,Date.now());if(c.inventory.labels!==before)throw new Error('Lieferung wurde doppelt eingebucht');
 return true;
}
