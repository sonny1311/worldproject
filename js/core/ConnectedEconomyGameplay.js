// WorldProject - verbindet UI, Lieferanten, Rezepte, Fuhrpark, Produktion und Missionen
import { EconomyGameplaySystem } from "./EconomyGameplaySystem.js";
import { FleetManagementSystem } from "./FleetManagementSystem.js";
import { FleetOperatingCostSystem, runFleetOperatingCostTest } from "./FleetOperatingCostSystem.js";
import { SupplierMarketSystem, runSupplierMarketTest } from "./SupplierMarketSystem.js";
import { MissionSystem, runMissionSystemTest } from "./MissionSystem.js";
import { BeverageRecipeCatalog, runBeverageRecipeTest } from "./BeverageRecipeCatalog.js";
import { EconomyDashboard } from "./EconomyDashboard.js";
import { AdvancedEconomySystem, runAdvancedEconomyTest } from "./AdvancedEconomySystem.js";

export class ConnectedEconomyGameplay {
    constructor(){
        this.economy=new EconomyGameplaySystem();
        this.advanced=new AdvancedEconomySystem();
        this.fleet=new FleetManagementSystem();
        this.fleetCosts=new FleetOperatingCostSystem();
        this.market=new SupplierMarketSystem();
        this.missions=new MissionSystem();
        this.salePrice=0.95;
    }

    ensureCompany(company){
        company.money ??= 50000;
        company.coins ??= 0;
        company.vehicles ??= [];
        company.inventory ??= {};
        company.finishedGoods ??= {};
        company.production ??= { capacity:1000, active:false };
        company.missions ??= [];
        company.completedMissions ??= [];
        this.advanced.ensureCompany(company);
        return company;
    }

    buyVehicle(company,type,price=0){ this.ensureCompany(company); return this.fleet.buyVehicle(company,type,{price}); }

    buyInput(company,itemId,amount,{transportMode="auto"}={}){
        this.ensureCompany(company);
        const offer=this.market.getBestOffer(itemId,amount);
        if(!offer) return {success:false,reason:"Kein passendes Lieferangebot"};
        const reserve=this.market.reserveOffer(offer.id,amount);
        if(!reserve.success) return reserve;
        const selection=this.advanced.chooseTransport(company,offer,amount);
        const chosenMode=transportMode==="auto"?selection.mode:transportMode;
        const vehicle=chosenMode==="own"?selection.vehicle:null;
        const transportCost=chosenMode==="own" ? Math.max(offer.distanceKm*0.25,10) : offer.estimatedTransportCost;
        const total=offer.materialCost+transportCost;
        const delivery=this.advanced.createSupplierDelivery(company,offer,amount,total,{transportMode:chosenMode,vehicle});
        if(!delivery.success){ offer.availableAmount+=amount; return delivery; }
        return {success:true,offer,order:delivery.order,transportMode:chosenMode,vehicle,transportCost,totalCost:total,delivered:false};
    }

    buyRecipeInputs(company,recipeId,batches=1){
        this.ensureCompany(company);
        const recipe=BeverageRecipeCatalog[recipeId];
        if(!recipe) return {success:false,reason:"Rezept unbekannt"};
        const ordered=[]; let materialCost=0; let transportCost=0;
        for(const [itemId,perBatch] of Object.entries(recipe.inputs)){
            const needed=perBatch*batches;
            const have=Number(company.inventory?.[itemId])||0;
            const alreadyIncoming=(company.supplierOrders||[]).filter(o=>o.itemId===itemId && !["delivered","cancelled"].includes(o.status)).reduce((s,o)=>s+(Number(o.amount)||0),0);
            const missing=Math.max(needed-have-alreadyIncoming,0);
            if(missing<=0) continue;
            const result=this.buyInput(company,itemId,missing);
            if(!result.success) return {success:false,reason:`Einkauf ${itemId} fehlgeschlagen: ${result.reason}`,ordered};
            materialCost+=result.offer.materialCost; transportCost+=result.transportCost; ordered.push({itemId,amount:missing,...result});
        }
        return {success:true,ordered,materialCost,transportCost,message:"Bestellungen aufgegeben - Ware wird erst nach Ankunft eingelagert."};
    }

    processTime(company, now=new Date()){
        this.ensureCompany(company);
        const deliveries=this.advanced.processSupplierDeliveries(company,now);
        const productions=this.advanced.processProduction(company,now);
        return {deliveries,productions};
    }

    fastForward(company,hours=24){ return this.processTime(company,new Date(Date.now()+Math.max(Number(hours)||0,0)*3600000)); }

    produce(company,recipeId,batches=1){
        this.ensureCompany(company);
        const recipe=BeverageRecipeCatalog[recipeId];
        if(!recipe) return {success:false,reason:"Rezept unbekannt"};
        const started=this.advanced.startProduction(company,recipeId,batches);
        if(started.success){
            const inputs=Object.entries(recipe.inputs||{});
            let estimatedMaterials=0;
            for(const [itemId,amount] of inputs){ const offer=this.market.getBestOffer(itemId,amount*batches); estimatedMaterials+=offer?.materialCost||0; }
            this.advanced.registerProductCost(company,recipeId,batches,estimatedMaterials,0,Math.max(60*batches,25));
        }
        return started;
    }

    getStorageStatus(company){ this.ensureCompany(company); return this.advanced.getStorageStatus(company); }
    expandStorage(company){ return this.advanced.expandStorage(company,10000,5000); }
    getMargin(company,productId="lager033_bottle",price=this.salePrice){ return this.advanced.getMargin(company,productId,price); }

    ensureMission(company){ return this.missions.getActiveMission(company) ?? this.missions.createNextMission(company); }

    deliverMission(company,amount){
        this.ensureCompany(company);
        this.processTime(company,new Date());
        const mission=this.ensureMission(company);
        const available=Number(company.finishedGoods?.[mission.productId])||0;
        const deliverable=Math.min(Math.max(Number(amount)||0,0),available);
        if(deliverable<=0) return {success:false,reason:"Keine passende Fertigware im Lager"};
        const result=this.missions.deliver(company,mission.id,deliverable);
        if(result.success){
            company.finishedGoods[mission.productId]-=result.accepted;
            const revenue=result.accepted*this.salePrice;
            company.money+=revenue;
            result.salesRevenue=revenue;
            result.margin=this.getMargin(company,mission.productId,this.salePrice);
            if(result.completed) this.missions.createNextMission(company);
        }
        return result;
    }

    applyTripCosts(company,vehicle,distanceKm){
        const result=this.fleetCosts.calculateTrip(vehicle,distanceKm);
        if(result.success) company.money-=result.totalOperatingCost;
        return result;
    }

    serviceVehicle(company,vehicle){ return this.fleetCosts.service(vehicle,company,1200); }

    openDashboard(company){
        this.ensureCompany(company);
        this.processTime(company,new Date());
        this.ensureMission(company);
        const dashboard=new EconomyDashboard({controller:this,company});
        dashboard.open();
        return dashboard;
    }
}

function createDemoCompany(){ return {name:"WorldProject Testbrauerei",money:200000,coins:0,vehicles:[],inventory:{},finishedGoods:{},production:{capacity:1000,active:false},missions:[],completedMissions:[]}; }

export function runConnectedEconomyGameplayTest(){
    const game=new ConnectedEconomyGameplay(); const company=createDemoCompany(); game.ensureCompany(company);
    const vehicle=game.buyVehicle(company,"truck18",35000);
    const supplies=game.buyRecipeInputs(company,"lager033",1);
    game.fastForward(company,24);
    const production=game.produce(company,"lager033",1);
    game.fastForward(company,48);
    const mission=game.ensureMission(company); mission.targetAmount=1000;
    const first=game.deliverMission(company,500); const second=game.deliverMission(company,500);
    const trip=vehicle.success?game.applyTripCosts(company,vehicle.vehicle,200):{success:false};
    const success=vehicle.success&&supplies.success&&production.success&&first.success&&second.success&&second.completed&&trip.success&&company.vehicles.length===1;
    console[success?"log":"error"](success?"✅ VERBUNDENER-WIRTSCHAFTS-TEST ERFOLGREICH":"❌ VERBUNDENER-WIRTSCHAFTS-TEST FEHLGESCHLAGEN",{company,vehicle,supplies,production,first,second,trip});
    return {success,company};
}

runBeverageRecipeTest(); runSupplierMarketTest(); runFleetOperatingCostTest(); runMissionSystemTest(); runAdvancedEconomyTest(); runConnectedEconomyGameplayTest();

const visibleGame=new ConnectedEconomyGameplay();
const fallbackCompany=createDemoCompany();
visibleGame.ensureMission(fallbackCompany);
window.worldEconomyGameplay={game:visibleGame,company:fallbackCompany};

function getCurrentCompany(){ return window.worldPlayerCompany || fallbackCompany; }
function mountEconomyButton(){
    if(document.getElementById("world-economy-button")) return;
    const button=document.createElement("button"); button.id="world-economy-button"; button.textContent="🏭 Wirtschaft";
    Object.assign(button.style,{position:"fixed",right:"18px",bottom:"18px",zIndex:"11000",border:"0",borderRadius:"10px",padding:"12px 16px",fontWeight:"800",cursor:"pointer",boxShadow:"0 5px 18px rgba(0,0,0,.35)"});
    button.addEventListener("click",()=>{ const company=getCurrentCompany(); window.worldEconomyGameplay.company=company; visibleGame.openDashboard(company); });
    document.body.append(button);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mountEconomyButton); else mountEconomyButton();