// WorldProject - verbindet das neue operative Lager mit dem bestehenden Firmeninventar.
// So sehen Dashboard, alte Produktionslogik und Persistenz denselben Warenbestand.

const canonicalToLegacy={
  malt:"malt_kg",hops:"hops_kg",yeast:"yeast_kg",water:"water_l",
  bottles:"bottle_033",caps:"crown_cap",labels:"label_033",
  clean_bottles:"clean_bottles",bottle_wash_chem:"bottle_wash_chem",
  beer_bulk_pils:"beer_bulk_pils",beer_bulk_lager:"beer_bulk_lager"
};
const legacyToCanonical=Object.fromEntries(Object.entries(canonicalToLegacy).map(([canonical,legacy])=>[legacy,canonical]));

function currentCompany(){
  return window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null;
}

function zoneFor(material){
  if(["bottles","clean_bottles","bottles_050","clean_bottles_050","caps","labels","labels_050"].includes(material))return "packaging";
  if(["yeast"].includes(material))return "cold";
  if(["beer_bulk_pils","beer_bulk_lager"].includes(material))return "finished";
  return "raw";
}

function normalizeMaterial(id){return legacyToCanonical[id]||id;}

function totalOperationalStock(stock){
  let total=0;
  for(const zone of Object.values(stock||{}))for(const value of Object.values(zone||{}))total+=Math.max(0,Number(value)||0);
  return total;
}

// Reparatur fuer alte Spielstaende: Fruehere Wareneingaenge konnten bereits als
// "delivered/stored" markiert sein, ohne dass warehouseStock mitgespeichert wurde.
// Nur wenn das operative Lager komplett leer ist, wird einmal aus bestaetigten
// Lieferungen rekonstruiert. Dadurch werden bestehende Lagerbestaende nicht additiv
// verdoppelt.
export function recoverConfirmedDeliveries(company=currentCompany()){
  if(!company)return 0;
  company.operationalSupplyState??={};
  const state=company.operationalSupplyState;
  state.warehouseStock??={raw:{},packaging:{},finished:{},cold:{}};
  for(const zone of ["raw","packaging","finished","cold"])state.warehouseStock[zone]??={};
  if(state.confirmedDeliveryStockRecovered||totalOperationalStock(state.warehouseStock)>0)return 0;

  const recovered=new Map();
  const add=(rawMaterial,rawQuantity)=>{
    const material=normalizeMaterial(rawMaterial);
    const quantity=Math.max(0,Number(rawQuantity)||0);
    if(!material||material==="undefined"||material==="materials.undefined"||quantity<=0)return;
    recovered.set(material,(recovered.get(material)||0)+quantity);
  };

  // Neue operative Bestellungen, bei denen Wareneingang bereits bestaetigt war.
  for(const order of state.orders||[]){
    if(order&&order.status==="stored")add(order.material||order.itemId,order.quantity??order.amount);
  }
  // Alte Lieferlogik verwendete "delivered" fuer bereits eingelagert/bestaetigt.
  for(const order of company.supplierOrders||[]){
    if(order&&["delivered","stored"].includes(order.status))add(order.itemId||order.material,order.amount??order.quantity);
  }

  let changed=0;
  for(const [material,quantity] of recovered){
    const zone=zoneFor(material);
    state.warehouseStock[zone][material]=Number(state.warehouseStock[zone][material]||0)+quantity;
    changed++;
  }
  state.confirmedDeliveryStockRecovered=true;
  if(changed){
    console.log("✅ BESTÄTIGTE ALTLIEFERUNGEN INS LAGER REKONSTRUIERT",Object.fromEntries(recovered));
    window.dispatchEvent(new CustomEvent("world:game-state-dirty",{detail:{reason:"recover-confirmed-deliveries"}}));
  }
  return changed;
}

export function syncOperationalWarehouse(company=currentCompany()){
  if(!company)return 0;
  recoverConfirmedDeliveries(company);
  const stock=company?.operationalSupplyState?.warehouseStock;
  if(!stock)return 0;
  company.inventory??={};
  const totals={};
  for(const zone of Object.values(stock)){
    if(!zone||typeof zone!=="object")continue;
    for(const [id,value] of Object.entries(zone)){
      const amount=Number(value)||0;
      const target=canonicalToLegacy[id]||id;
      totals[target]=(totals[target]||0)+amount;
    }
  }
  let changed=0;
  for(const [id,value] of Object.entries(totals)){
    if(Number(company.inventory[id]||0)!==value){company.inventory[id]=value;changed++;}
  }
  return changed;
}

function syncSoon(){queueMicrotask(()=>{const changed=syncOperationalWarehouse();if(changed)console.log("✅ OPERATIVES LAGER SYNCHRONISIERT",{changed});});}

window.addEventListener("world:game-state-dirty",syncSoon);
window.addEventListener("worldproject:company-loaded",syncSoon);
window.addEventListener("worldproject:company-founded",syncSoon);
window.addEventListener("worldproject:company-switched",syncSoon);
window.addEventListener("worldproject:company-activated",syncSoon);

// Falls die Datei erst nach dem Betrieb geladen wird.
syncSoon();
