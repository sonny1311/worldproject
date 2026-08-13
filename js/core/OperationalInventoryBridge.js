// WorldProject - verbindet das neue operative Lager mit dem bestehenden Firmeninventar.
// So sehen Dashboard, alte Produktionslogik und Persistenz denselben Warenbestand.

const canonicalToLegacy={
  malt:"malt_kg",hops:"hops_kg",yeast:"yeast_kg",water:"water_l",
  bottles:"bottle_033",caps:"crown_cap",labels:"label_033",
  clean_bottles:"clean_bottles",bottle_wash_chem:"bottle_wash_chem",
  beer_bulk_pils:"beer_bulk_pils",beer_bulk_lager:"beer_bulk_lager"
};

function currentCompany(){
  return window.worldPlayerCompany||window.worldEconomyGameplay?.company||window.worldEngine?.company||null;
}

export function syncOperationalWarehouse(company=currentCompany()){
  const stock=company?.operationalSupplyState?.warehouseStock;
  if(!company||!stock)return 0;
  company.inventory??={};
  const totals={};
  for(const zone of Object.values(stock)){
    if(!zone||typeof zone!=="object")continue;
    for(const [id,value] of Object.entries(zone)){
      const amount=Number(value)||0;
      if(amount<=0)continue;
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
window.addEventListener("worldproject:company-activated",syncSoon);

// Falls die Datei erst nach dem Betrieb geladen wird.
syncSoon();
