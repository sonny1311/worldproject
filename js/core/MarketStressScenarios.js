// WorldProject – reproduzierbare Markt-Stressprofile.
export const MarketStressScenarios={price_crash:{demand:.75,sellPrice:.65,inputCost:1.05,energy:1},raw_material_shock:{demand:1,inputCost:1.8,energy:1.15,sellPrice:1.05},demand_boom:{demand:1.8,inputCost:1.15,energy:1.05,sellPrice:1.2},early_population:{demand:1,npcLiquidity:1.5,competition:.65,sellPrice:1}};
export function marketStressScenario(id){return{id,...(MarketStressScenarios[id]||{})};}
if(typeof window!=='undefined')window.worldMarketStressScenarios=MarketStressScenarios;
