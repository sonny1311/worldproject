// WorldProject - verbindet UI, Lieferanten, Rezepte, Fuhrpark und Missionen
import { EconomyGameplaySystem } from "./EconomyGameplaySystem.js";
import { FleetManagementSystem } from "./FleetManagementSystem.js";
import { FleetOperatingCostSystem, runFleetOperatingCostTest } from "./FleetOperatingCostSystem.js";
import { SupplierMarketSystem, runSupplierMarketTest } from "./SupplierMarketSystem.js";
import { MissionSystem, runMissionSystemTest } from "./MissionSystem.js";
import { BeverageRecipeCatalog, runBeverageRecipeTest } from "./BeverageRecipeCatalog.js";
import { EconomyDashboard } from "./EconomyDashboard.js";

export class ConnectedEconomyGameplay {
    constructor(){
        this.economy=new EconomyGameplaySystem();
        this.fleet=new FleetManagementSystem();
        this.fleetCosts=new FleetOperatingCostSystem();
        this.market=new SupplierMarketSystem();
        this.missions=new MissionSystem();
    }

    ensureCompany(company){
        company.money ??= 200000;
        company.coins ??= 0;
        company.vehicles ??= [];
        company.inventory ??= {};
        company.finishedGoods ??= {};
        company.production ??= { capacity:1000, active:false };
        company.missions ??= [];
        company.completedMissions ??= [];
        return company;
    }

    buyVehicle(company,type,price=0){
        this.ensureCompany(company);
        return this.fleet.buyVehicle(company,type,{price});
    }

    buyInput(company,itemId,amount){
        this.ensureCompany(company);
        const offer=this.market.getBestOffer(itemId,amount);
        if(!offer) return {success:false,reason:"Kein passendes Lieferangebot"};
        const transport=offer.estimatedTransportCost;
        const total=offer.materialCost+transport;
        if(company.money<total) return {success:false,reason:"Nicht genug Geld"};
        const reserve=this.market.reserveOffer(offer.id,amount);
        if(!reserve.success) return reserve;
        company.money-=total;
        this.economy.addStock(company,itemId,amount);
        return {success:true,offer,transportCost:transport,totalCost:total,delivered:true};
    }

    buyRecipeInputs(company,recipeId,batches=1){
        const recipe=BeverageRecipeCatalog[recipeId];
        if(!recipe) return {success:false,reason:"Rezept unbekannt"};
        const bought=[];
        for(const [itemId,perBatch] of Object.entries(recipe.inputs)){
            const needed=perBatch*batches;
            const have=Number(company.inventory?.[itemId])||0;
            const missing=Math.max(needed-have,0);
            if(missing<=0) continue;
            const result=this.buyInput(company,itemId,missing);
            if(!result.success) return {success:false,reason:`Einkauf ${itemId} fehlgeschlagen: ${result.reason}`,bought};
            bought.push({itemId,amount:missing,...result});
        }
        return {success:true,bought};
    }

    produce(company,recipeId,batches=1){
        this.ensureCompany(company);
        const recipe=BeverageRecipeCatalog[recipeId];
        if(!recipe) return {success:false,reason:"Rezept unbekannt"};
        return this.economy.produce(company,recipe,batches);
    }

    ensureMission(company){
        return this.missions.getActiveMission(company) ?? this.missions.createNextMission(company);
    }

    deliverMission(company,amount){
        this.ensureCompany(company);
        const mission=this.ensureMission(company);
        const available=Number(company.finishedGoods?.[mission.productId])||0;
        const deliverable=Math.min(Math.max(Number(amount)||0,0),available);
        if(deliverable<=0) return {success:false,reason:"Keine passende Fertigware im Lager"};
        const result=this.missions.deliver(company,mission.id,deliverable);
        if(result.success){
            company.finishedGoods[mission.productId]-=result.accepted;
            // Verkaufsumsatz klein halten: Missionbelohnung ist separat.
            const revenue=result.accepted*0.65;
            company.money+=revenue;
            result.salesRevenue=revenue;
            if(result.completed) this.missions.createNextMission(company);
        }
        return result;
    }

    applyTripCosts(company,vehicle,distanceKm){
        const result=this.fleetCosts.calculateTrip(vehicle,distanceKm);
        if(result.success) company.money-=result.totalOperatingCost;
        return result;
    }

    openDashboard(company){
        this.ensureCompany(company);
        this.ensureMission(company);
        const dashboard=new EconomyDashboard({controller:this,company});
        dashboard.open();
        return dashboard;
    }
}

function createDemoCompany(){
    return {
        name:"WorldProject Testbrauerei",
        money:200000,
        coins:0,
        vehicles:[],
        inventory:{},
        finishedGoods:{},
        production:{capacity:1000,active:false},
        missions:[],
        completedMissions:[]
    };
}

export function runConnectedEconomyGameplayTest(){
    const game=new ConnectedEconomyGameplay();
    const company=createDemoCompany();
    const vehicle=game.buyVehicle(company,"truck18",35000);
    const supplies=game.buyRecipeInputs(company,"lager033",1);
    const production=game.produce(company,"lager033",1);
    const mission=game.ensureMission(company);
    mission.targetAmount=1000;
    const first=game.deliverMission(company,500);
    const second=game.deliverMission(company,500);
    const trip=vehicle.success?game.applyTripCosts(company,vehicle.vehicle,200):{success:false};
    const success=vehicle.success&&supplies.success&&production.success&&first.success&&second.success&&second.completed&&trip.success&&company.vehicles.length===1&&vehicle.vehicle.odometerKm===200;
    console[success?"log":"error"](
        success?"✅ VERBUNDENER-WIRTSCHAFTS-TEST ERFOLGREICH":"❌ VERBUNDENER-WIRTSCHAFTS-TEST FEHLGESCHLAGEN",
        {company,vehicle,supplies,production,first,second,trip}
    );
    return {success,company};
}

runBeverageRecipeTest();
runSupplierMarketTest();
runFleetOperatingCostTest();
runMissionSystemTest();
runConnectedEconomyGameplayTest();

// Sichtbarer Testzugang. Der Button nutzt absichtlich eine eigene Testfirma,
// damit der bestehende Spielstand/Gründungsdialog nicht beschädigt wird.
const visibleGame=new ConnectedEconomyGameplay();
const visibleCompany=createDemoCompany();
visibleGame.ensureMission(visibleCompany);

window.worldEconomyGameplay={game:visibleGame,company:visibleCompany};

function mountEconomyButton(){
    if(document.getElementById("world-economy-button")) return;
    const button=document.createElement("button");
    button.id="world-economy-button";
    button.textContent="🏭 Wirtschaft testen";
    Object.assign(button.style,{position:"fixed",right:"18px",bottom:"18px",zIndex:"11000",border:"0",borderRadius:"10px",padding:"12px 16px",fontWeight:"800",cursor:"pointer",boxShadow:"0 5px 18px rgba(0,0,0,.35)"});
    button.addEventListener("click",()=>visibleGame.openDashboard(visibleCompany));
    document.body.append(button);
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mountEconomyButton);
else mountEconomyButton();
