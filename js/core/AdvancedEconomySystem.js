// WorldProject - erweiterter Wirtschaftskreislauf
// Lagerkapazitaet, Produktionszeit, Lieferzeiten, Transport, Kosten und Margen.
import { BeverageRecipeCatalog } from "./BeverageRecipeCatalog.js";
import { TruckTypes } from "./TruckTypes.js";

export class AdvancedEconomySystem {
    constructor({ defaultStorageCapacity = 25000, defaultProductionSlots = 1 } = {}) {
        this.defaultStorageCapacity = defaultStorageCapacity;
        this.defaultProductionSlots = defaultProductionSlots;
    }

    ensureCompany(company) {
        company.inventory ??= {};
        company.finishedGoods ??= {};
        company.vehicles ??= [];
        company.supplierOrders ??= [];
        company.productionQueue ??= [];
        company.productionHistory ??= [];
        company.sales ??= [];
        company.storageState ??= { capacityUnits: this.defaultStorageCapacity };
        company.productionState ??= { slots: this.defaultProductionSlots };
        company.costAccounting ??= { productCosts: {}, priceHistory: {} };
        return company;
    }

    getStorageUsed(company) {
        this.ensureCompany(company);
        const raw = Object.values(company.inventory).reduce((s,v)=>s+(Number(v)||0),0);
        const finished = Object.values(company.finishedGoods).reduce((s,v)=>s+(Number(v)||0),0);
        return raw + finished;
    }

    getStorageStatus(company) {
        const used = this.getStorageUsed(company);
        const capacity = Math.max(Number(company.storageState.capacityUnits)||0,0);
        return { used, capacity, free: Math.max(capacity-used,0), full: capacity>0 && used>=capacity, percent: capacity>0 ? used/capacity*100 : 100 };
    }

    canStore(company, amount) {
        const s=this.getStorageStatus(company);
        return Math.max(Number(amount)||0,0) <= s.free;
    }

    expandStorage(company, additionalUnits=10000, cost=5000) {
        this.ensureCompany(company);
        if((Number(company.money)||0)<cost) return {success:false,reason:"Nicht genug Geld"};
        company.money-=cost;
        company.storageState.capacityUnits += additionalUnits;
        return {success:true,...this.getStorageStatus(company)};
    }

    activeProductions(company, now=new Date()) {
        this.processProduction(company, now);
        return company.productionQueue.filter(p=>p.status==="running");
    }

    startProduction(company, recipeId, batches=1, inputCosts={}) {
        this.ensureCompany(company);
        const recipe=BeverageRecipeCatalog[recipeId];
        if(!recipe) return {success:false,reason:"Rezept unbekannt"};
        const slots=Math.max(Number(company.productionState.slots)||1,1);
        if(this.activeProductions(company).length>=slots) return {success:false,reason:"Alle Produktionslinien sind belegt"};
        for(const [id,perBatch] of Object.entries(recipe.inputs||{})) {
            const needed=perBatch*batches;
            if((Number(company.inventory[id])||0)<needed) return {success:false,reason:`Rohstoff fehlt: ${id}`};
        }
        const output=(Number(recipe.outputAmount)||0)*batches;
        if(!this.canStore(company,output)) return {success:false,reason:"Lager voll - Fertigware kann nicht eingelagert werden"};
        for(const [id,perBatch] of Object.entries(recipe.inputs||{})) company.inventory[id]-=perBatch*batches;
        const minutes=Math.max(Number(recipe.productionMinutes)||30,1)*batches;
        const startedAt=new Date();
        const order={id:Date.now()+Math.random(),recipeId,batches,status:"running",startedAt,completeAt:new Date(startedAt.getTime()+minutes*60000),outputId:recipe.outputId,outputAmount:output,productionMinutes:minutes,inputCosts:{...inputCosts}};
        company.productionQueue.push(order);
        return {success:true,order};
    }

    processProduction(company, now=new Date()) {
        this.ensureCompany(company);
        const completed=[];
        for(const order of company.productionQueue) {
            if(order.status!=="running" || new Date(order.completeAt)>now) continue;
            order.status="completed";
            order.completedAt=new Date(now);
            company.finishedGoods[order.outputId]=(Number(company.finishedGoods[order.outputId])||0)+order.outputAmount;
            company.productionHistory.push(order);
            completed.push(order);
        }
        return completed;
    }

    createSupplierDelivery(company, offer, amount, totalCost, { transportMode="external", vehicle=null }={}) {
        this.ensureCompany(company);
        if(!this.canStore(company,amount)) return {success:false,reason:"Lager hat nicht genug freien Platz"};
        if((Number(company.money)||0)<totalCost) return {success:false,reason:"Nicht genug Geld"};
        const now=new Date();
        const hours=Math.max(Number(offer.deliveryHours)||1,0.25);
        const order={id:Date.now()+Math.random(),offerId:offer.id,itemId:offer.itemId,amount,totalCost,status:"ordered",transportMode,vehicleId:vehicle?.id??null,orderedAt:now,departAt:new Date(now.getTime()+15*60000),arrivalAt:new Date(now.getTime()+hours*3600000)};
        company.money-=totalCost;
        if(vehicle) vehicle.status="reserved";
        company.supplierOrders.push(order);
        return {success:true,order};
    }

    processSupplierDeliveries(company, now=new Date()) {
        this.ensureCompany(company);
        const delivered=[];
        for(const order of company.supplierOrders) {
            if(order.status==="ordered" && new Date(order.departAt)<=now) {
                order.status="in_transit";
                const vehicle=company.vehicles.find(v=>v.id===order.vehicleId);
                if(vehicle) vehicle.status="driving";
            }
            if((order.status==="ordered" || order.status==="in_transit") && new Date(order.arrivalAt)<=now) {
                if(!this.canStore(company,order.amount)) { order.status="waiting_storage"; continue; }
                company.inventory[order.itemId]=(Number(company.inventory[order.itemId])||0)+order.amount;
                order.status="delivered"; order.deliveredAt=new Date(now); delivered.push(order);
                const vehicle=company.vehicles.find(v=>v.id===order.vehicleId);
                if(vehicle) vehicle.status="available";
            }
        }
        return delivered;
    }

    chooseTransport(company, offer, amount) {
        this.ensureCompany(company);
        const own=company.vehicles.find(v=>v.status==="available");
        if(!own) return { mode:"external", vehicle:null, reason:"Kein eigenes freies Fahrzeug" };
        const def=own.definition??TruckTypes[own.type];
        if(!def) return { mode:"external", vehicle:null, reason:"Fahrzeugdaten fehlen" };
        return { mode:"own", vehicle:own, reason:"Eigenes Fahrzeug verfuegbar" };
    }

    updateVehicleStatus(vehicle) {
        if(!vehicle) return null;
        const condition=Number(vehicle.condition??100);
        if(condition<=25) vehicle.status="workshop_required";
        else if(condition<=45 && vehicle.status==="available") vehicle.status="maintenance_due";
        return vehicle.status;
    }

    serviceVehicle(company, vehicle, cost=1200) {
        if(!vehicle) return {success:false,reason:"Fahrzeug fehlt"};
        if((Number(company.money)||0)<cost) return {success:false,reason:"Nicht genug Geld"};
        company.money-=cost; vehicle.condition=100; vehicle.status="available";
        return {success:true,vehicle,cost};
    }

    registerProductCost(company, recipeId, batches, materialCost, transportCost=0, productionOverhead=0) {
        this.ensureCompany(company);
        const recipe=BeverageRecipeCatalog[recipeId];
        if(!recipe) return null;
        const units=(Number(recipe.outputAmount)||1)*Math.max(Number(batches)||1,1);
        const total=(Number(materialCost)||0)+(Number(transportCost)||0)+(Number(productionOverhead)||0);
        const record={recipeId,totalCost:total,units,costPerUnit:units>0?total/units:0,materialCost,transportCost,productionOverhead,updatedAt:new Date()};
        company.costAccounting.productCosts[recipe.outputId]=record;
        return record;
    }

    getMargin(company, productId, salePrice) {
        this.ensureCompany(company);
        const cost=Number(company.costAccounting.productCosts?.[productId]?.costPerUnit)||0;
        const price=Math.max(Number(salePrice)||0,0);
        return {costPerUnit:cost,salePrice:price,marginPerUnit:price-cost,marginPercent:price>0?(price-cost)/price*100:0,profitable:price>cost};
    }
}

export function runAdvancedEconomyTest(){
    const s=new AdvancedEconomySystem({defaultStorageCapacity:5000});
    const c={money:100000,inventory:{malt_kg:100,hops_kg:2,yeast_kg:2,water_l:1000,bottle_033:1000,crown_cap:1000,label_033:1000},finishedGoods:{},vehicles:[],productionState:{slots:1}};
    s.ensureCompany(c);
    const p=s.startProduction(c,"lager033",1);
    const blocked=s.startProduction(c,"lager033",1);
    const done=s.processProduction(c,new Date(Date.now()+24*3600000));
    const margin=s.registerProductCost(c,"lager033",1,420,80,100);
    const success=p.success&&!blocked.success&&done.length===1&&(c.finishedGoods.lager033_bottle||0)===1000&&margin.costPerUnit>0;
    console[success?"log":"error"](success?"✅ ERWEITERTER-WIRTSCHAFTS-TEST ERFOLGREICH":"❌ ERWEITERTER-WIRTSCHAFTS-TEST FEHLGESCHLAGEN",{p,blocked,done,margin,storage:s.getStorageStatus(c)});
    return {success};
}