// WorldProject - verbindet das neue operative Lager mit dem bestehenden Firmeninventar.
// Das operative Lager ist die Source of Truth; Legacy-IDs existieren nur noch als Kompatibilitaetsansicht.

export const CANONICAL_TO_LEGACY_MATERIAL={
  malt:"malt_kg",hops:"hops_kg",yeast:"yeast_kg",water:"water_l",
  bottles:"bottle_033",bottles_050:"bottle_050",caps:"crown_cap",labels:"label_033",labels_050:"label_050",
  clean_bottles:"clean_bottles",clean_bottles_050:"clean_bottles_050",bottle_wash_chem:"bottle_wash_chem",
  beer_bulk_pils:"beer_bulk_pils",beer_bulk_lager:"beer_bulk_lager",
  // Fertigprodukte: alte Economy-/Auftrags-IDs werden zentral auf die operativen IDs abgebildet.
  beer_lager_033:"lager033_bottle",beer_pils_033:"pils033_bottle",
  beer_lager_050:"lager050_bottle",beer_pils_050:"pils050_bottle"
};
export const LEGACY_TO_CANONICAL_MATERIAL=Object.fromEntries(Object.entries(CANONICAL_TO_LEGACY_MATERIAL).map(([canonical,legacy])=>[legacy,canonical]));
// Weitere historisch verwendete Kurzformen. Alle Leser sollen denselben kanonischen Bestand sehen.
Object.assign(LEGACY_TO_CANONICAL_MATERIAL,{
  lager033:"beer_lager_033",pils033:"beer_pils_033",
  "lager033 bottle":"beer_lager_033","pils033 bottle":"beer_pils_033"
});

function currentCompany(){return window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null;}

export function operationalZoneFor(material){
  const id=canonicalMaterialId(material);
  if(["bottles","clean_bottles","bottles_050","clean_bottles_050","caps","labels","labels_050"].includes(id))return "packaging";
  if(id==="yeast")return "cold";
  if(["beer_bulk_pils","beer_bulk_lager","beer_lager_033","beer_pils_033","beer_lager_050","beer_pils_050"].includes(id))return "finished";
  return "raw";
}
export function canonicalMaterialId(id){return LEGACY_TO_CANONICAL_MATERIAL[id]||id;}
export function legacyMaterialId(id){const canonical=canonicalMaterialId(id);return CANONICAL_TO_LEGACY_MATERIAL[canonical]||canonical;}

function totalOperationalStock(stock){let total=0;for(const zone of Object.values(stock||{}))for(const value of Object.values(zone||{}))total+=Math.max(0,Number(value)||0);return total;}
function orderIdentity(order){return String(order?.legacyId??order?.sourceOrderId??order?.id??`${order?.supplierId||order?.offerId||"supplier"}:${order?.material||order?.itemId||"item"}:${order?.createdAt||order?.orderedAt||"time"}`);}
function ensureWarehouseStock(company){if(!company)return null;company.operationalSupplyState??={};const state=company.operationalSupplyState;state.warehouseStock??={raw:{},packaging:{},finished:{},cold:{}};for(const zone of ["raw","packaging","finished","cold"])state.warehouseStock[zone]??={};return state.warehouseStock;}

export function operationalStockAmount(company,material){const stock=company?.operationalSupplyState?.warehouseStock;if(!stock)return null;const canonical=canonicalMaterialId(material);let total=0;for(const zone of Object.values(stock))if(zone&&typeof zone==='object')for(const[id,value]of Object.entries(zone))if(canonicalMaterialId(id)===canonical)total+=Math.max(0,Number(value)||0);return total;}
export function consumeOperationalStock(company,material,quantity){const stock=company?.operationalSupplyState?.warehouseStock;if(!stock)return null;let left=Math.max(0,Number(quantity)||0);if(left<=0)return{success:true,consumed:0,remaining:0};const canonical=canonicalMaterialId(material),available=operationalStockAmount(company,canonical)||0;if(available+1e-9<left)return{success:false,consumed:0,remaining:left,available};const requested=left;for(const zone of Object.values(stock)){if(!zone||typeof zone!=='object')continue;for(const[id,value]of Object.entries(zone)){if(left<=1e-9)break;if(canonicalMaterialId(id)!==canonical)continue;const have=Math.max(0,Number(value)||0),take=Math.min(have,left);if(take>0){zone[id]=have-take;left-=take;}}if(left<=1e-9)break;}syncOperationalWarehouse(company);return{success:left<=1e-9,consumed:requested-left,remaining:left,available};}
export function addOperationalStock(company,material,quantity,{zone=null}={}){const stock=ensureWarehouseStock(company);if(!stock)return{success:false,added:0};const q=Math.max(0,Number(quantity)||0),canonical=canonicalMaterialId(material),target=zone||operationalZoneFor(canonical);stock[target]??={};stock[target][canonical]=Math.max(0,Number(stock[target][canonical])||0)+q;syncOperationalWarehouse(company);return{success:true,added:q,zone:target,material:canonical};}

// Alte Spielstaende konnten bestaetigte Wareneingaenge besitzen, ohne warehouseStock.
// Die Rekonstruktion laeuft nur einmal und dedupliziert operative + migrierte Legacy-Orders.
export function recoverConfirmedDeliveries(company=currentCompany()){
  if(!company)return 0;
  const stock=ensureWarehouseStock(company),state=company.operationalSupplyState;
  if(state.confirmedDeliveryStockRecovered||totalOperationalStock(stock)>0)return 0;

  const recovered=new Map(),seen=new Set();
  const addOrder=(order,rawMaterial,rawQuantity)=>{
    const key=orderIdentity(order);if(seen.has(key))return;seen.add(key);
    const material=canonicalMaterialId(rawMaterial),quantity=Math.max(0,Number(rawQuantity)||0);
    if(!material||material==="undefined"||material==="materials.undefined"||quantity<=0)return;
    recovered.set(material,(recovered.get(material)||0)+quantity);
  };

  for(const order of state.orders||[]){if(order&&order.status==="stored")addOrder(order,order.material||order.itemId,order.quantity??order.amount);}
  for(const order of company.supplierOrders||[]){
    if(!order||!["delivered","stored"].includes(order.status))continue;
    const legacyKey=String(order.id??order.legacyId??"");
    if(legacyKey&&seen.has(legacyKey))continue;
    addOrder(order,order.itemId||order.material,order.amount??order.quantity);
  }

  let changed=0;
  for(const [material,quantity] of recovered){const zone=operationalZoneFor(material);stock[zone][material]=Number(stock[zone][material]||0)+quantity;changed++;}
  state.confirmedDeliveryStockRecovered=true;
  state.confirmedDeliveryStockRecoveredAt=Date.now();
  if(changed){console.log("✅ BESTÄTIGTE ALTLIEFERUNGEN INS LAGER REKONSTRUIERT",Object.fromEntries(recovered));window.dispatchEvent(new CustomEvent("world:game-state-dirty",{detail:{reason:"recover-confirmed-deliveries"}}));}
  return changed;
}

export function syncOperationalWarehouse(company=currentCompany()){
  if(!company)return 0;
  recoverConfirmedDeliveries(company);
  const stock=company?.operationalSupplyState?.warehouseStock;if(!stock)return 0;
  company.inventory??={};
  const totals={},explicitCanonical=new Set();
  for(const zone of Object.values(stock)){
    if(!zone||typeof zone!=="object")continue;
    for(const [id,value] of Object.entries(zone)){
      const canonical=canonicalMaterialId(id),amount=Math.max(0,Number(value)||0),target=legacyMaterialId(canonical);
      explicitCanonical.add(canonical);totals[target]=(totals[target]||0)+amount;
    }
  }
  let changed=0;
  for(const [id,value] of Object.entries(totals)){if(Number(company.inventory[id]||0)!==value){company.inventory[id]=value;changed++;}}
  for(const canonical of explicitCanonical){const legacy=legacyMaterialId(canonical);if(!(legacy in totals)&&Number(company.inventory[legacy]||0)!==0){company.inventory[legacy]=0;changed++;}}
  return changed;
}

export function operationalWarehouseKpis(company=currentCompany()){
  const state=company?.operationalSupplyState||{},stock=state.warehouseStock||{},capacities={raw:10000,packaging:10000,finished:10000,cold:0,...(state.baseCapacities||{})};
  const names=[...new Set(["raw","packaging","finished","cold",...Object.keys(capacities),...Object.keys(stock)])];
  const zones=names.map(zone=>{const used=Object.values(stock[zone]||{}).reduce((sum,value)=>sum+Math.max(0,Number(value)||0),0),capacity=Math.max(0,Number(capacities[zone])||0);return{zone,used,capacity,free:Math.max(0,capacity-used),utilization:capacity?used/capacity:0};});
  const stockPositions=Object.values(stock).reduce((sum,zone)=>sum+Object.values(zone||{}).filter(value=>(Number(value)||0)>0).length,0);
  const reserved=Array.isArray(company?.warehouse?.reservations)?company.warehouse.reservations.filter(x=>x?.status==="active").reduce((sum,x)=>sum+Math.max(0,Number(x.quantity)||0),0):0;
  return{zones,lots:stockPositions,stockPositions,reserved,criticalZones:zones.filter(x=>x.utilization>=.9).map(x=>x.zone)};
}

function syncSoon(){queueMicrotask(()=>{const changed=syncOperationalWarehouse();if(changed)console.log("✅ OPERATIVES LAGER SYNCHRONISIERT",{changed});});}
window.addEventListener("world:game-state-dirty",syncSoon);
window.addEventListener("worldproject:company-loaded",syncSoon);
window.addEventListener("worldproject:company-founded",syncSoon);
window.addEventListener("worldproject:company-switched",syncSoon);
window.addEventListener("worldproject:company-activated",syncSoon);
syncSoon();