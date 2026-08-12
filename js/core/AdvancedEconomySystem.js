// WorldProject - erweiterter Wirtschaftskreislauf
// Lager, Produktionszeit, Lieferzeiten, Markt, Kunden, Kosten und Reporting.
import { BeverageRecipeCatalog } from "./BeverageRecipeCatalog.js";
import { TruckTypes } from "./TruckTypes.js";
import { getIndustryProfile, setupProgress } from "./IndustryCatalog.js";

export const CoinStoreCatalog = [
    { id:"coins50", coins:50, label:"50 Coins", priceEUR:1.99 },
    { id:"coins120", coins:120, label:"120 Coins", priceEUR:3.99 },
    { id:"coins300", coins:300, label:"300 Coins", priceEUR:8.99 }
];

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
        company.storageAreas ??= { raw:{capacity:10000}, packaging:{capacity:50000}, finished:{capacity:50000} };
        company.productionState ??= { slots: this.defaultProductionSlots };
        company.costAccounting ??= { productCosts: {}, priceHistory: {} };
        company.salesPrices ??= {};
        company.competitorHistory ??= {};
        company.customerOrders ??= [];
        company.completedCustomerOrders ??= [];
        company.financialLog ??= [];
        company.coinLedger ??= [];
        company.coins ??= 0;

        const explicitSetup=company.setupPhase||company.setup_phase;
        if(explicitSetup){
            company.setupPhase=explicitSetup;
            company.productionMachines ??= [];
            if(company.setupPhase==="operating" && company.productionMachines.length===0 && getIndustryProfile(company).recipes?.length){
                const hasFiller=(company.buildingState?.equipment||[]).some(x=>(x.id||x)==="filling_line");
                if(hasFiller) company.productionMachines.push({id:"line1",name:"Abfülllinie 1",capacityPerBatch:1000,speedMultiplier:1,condition:100,status:"available",upgradeLevel:1});
            }
        }else{
            // Alte Tests/Demos bleiben kompatibel. Echte Spielerbetriebe besitzen setupPhase.
            company.productionMachines ??= [{id:"line1",name:"Abfülllinie 1",capacityPerBatch:1000,speedMultiplier:1,condition:100,status:"available",upgradeLevel:1}];
        }
        return company;
    }

    canOperate(company){ this.ensureCompany(company); return !company.setupPhase || company.setupPhase==="operating"; }

    record(company,type,amount,details={}) {
        this.ensureCompany(company);
        company.financialLog.push({id:Date.now()+Math.random(),time:new Date(),type,amount:Number(amount)||0,details});
    }

    getStorageUsed(company) {
        this.ensureCompany(company);
        return Object.values(company.inventory).reduce((s,v)=>s+(Number(v)||0),0)+Object.values(company.finishedGoods).reduce((s,v)=>s+(Number(v)||0),0);
    }

    getStorageStatus(company) {
        const used=this.getStorageUsed(company),capacity=Math.max(Number(company.storageState.capacityUnits)||0,0);
        return {used,capacity,free:Math.max(capacity-used,0),full:capacity>0&&used>=capacity,percent:capacity>0?used/capacity*100:100};
    }

    getStorageAreas(company){
        this.ensureCompany(company);
        const profile=getIndustryProfile(company),packIds=["bottle_033","crown_cap","label_033"];
        const rawIds=(profile.allowedItems||[]).filter(id=>!packIds.includes(id));
        const raw=rawIds.reduce((s,id)=>s+(Number(company.inventory[id])||0),0),packaging=packIds.reduce((s,id)=>s+(Number(company.inventory[id])||0),0),finished=Object.values(company.finishedGoods).reduce((s,v)=>s+(Number(v)||0),0);
        return {raw:{used:raw,capacity:company.storageAreas.raw.capacity,free:Math.max(company.storageAreas.raw.capacity-raw,0)},packaging:{used:packaging,capacity:company.storageAreas.packaging.capacity,free:Math.max(company.storageAreas.packaging.capacity-packaging,0)},finished:{used:finished,capacity:company.storageAreas.finished.capacity,free:Math.max(company.storageAreas.finished.capacity-finished,0)}};
    }

    canStore(company,amount){return Math.max(Number(amount)||0,0)<=this.getStorageStatus(company).free;}
    expandStorage(company,additionalUnits=10000,cost=5000){this.ensureCompany(company);if((Number(company.money)||0)<cost)return{success:false,reason:"Nicht genug Geld"};company.money-=cost;company.storageState.capacityUnits+=additionalUnits;this.record(company,"storage_expansion",-cost,{additionalUnits});return{success:true,...this.getStorageStatus(company)};}

    activeProductions(company,now=new Date()){this.processProduction(company,now);return company.productionQueue.filter(p=>p.status==="running");}

    startProduction(company,recipeId,batches=1,inputCosts={}){
        this.ensureCompany(company);
        if(!this.canOperate(company))return{success:false,reason:"Der Betrieb ist noch in der Einrichtungsphase"};
        const profile=getIndustryProfile(company),recipe=BeverageRecipeCatalog[recipeId];
        if(!recipe)return{success:false,reason:"Rezept unbekannt"};
        if(profile.recipes?.length && !profile.recipes.includes(recipeId))return{success:false,reason:"Dieses Produkt gehört nicht zu diesem Gewerbe"};
        if(this.activeProductions(company).length>=Math.max(Number(company.productionState.slots)||1,1))return{success:false,reason:"Alle Produktionslinien sind belegt"};
        const missing=[];for(const[id,perBatch]of Object.entries(recipe.inputs||{})){const needed=perBatch*batches,have=Number(company.inventory[id])||0;if(have<needed)missing.push({id,needed,have,missing:needed-have});}
        if(missing.length)return{success:false,reason:`Rohstoffe fehlen: ${missing.map(x=>`${x.id} ${x.missing}`).join(", ")}`,missing};
        const output=(Number(recipe.outputAmount)||0)*batches;if(!this.canStore(company,output))return{success:false,reason:"Lager voll - Fertigware kann nicht eingelagert werden"};
        const machine=company.productionMachines.find(m=>m.status==="available"&&m.condition>20);if(!machine)return{success:false,reason:"Keine passende Produktionsmaschine vorhanden"};
        for(const[id,perBatch]of Object.entries(recipe.inputs||{}))company.inventory[id]-=perBatch*batches;
        const minutes=Math.max(Number(recipe.productionMinutes)||30,1)*batches/(machine.speedMultiplier||1),startedAt=new Date();machine.status="producing";
        const order={id:Date.now()+Math.random(),recipeId,batches,status:"running",machineId:machine.id,startedAt,completeAt:new Date(startedAt.getTime()+minutes*60000),outputId:recipe.outputId,outputAmount:output,productionMinutes:minutes,inputCosts:{...inputCosts}};
        company.productionQueue.push(order);return{success:true,order,machine};
    }

    queueProduction(company,recipeId,batches=1){this.ensureCompany(company);if(!this.canOperate(company))return{success:false,reason:"Betrieb noch nicht produktionsbereit"};const recipe=BeverageRecipeCatalog[recipeId];if(!recipe)return{success:false,reason:"Rezept unbekannt"};const order={id:Date.now()+Math.random(),recipeId,batches,status:"queued",createdAt:new Date()};company.productionQueue.push(order);return{success:true,order};}
    startNextQueued(company){this.ensureCompany(company);const queued=company.productionQueue.find(x=>x.status==="queued");if(!queued)return{success:false,reason:"Keine Charge in Warteschlange"};company.productionQueue=company.productionQueue.filter(x=>x!==queued);return this.startProduction(company,queued.recipeId,queued.batches);}

    processProduction(company,now=new Date()){
        this.ensureCompany(company);const completed=[];
        for(const order of company.productionQueue){if(order.status!=="running"||new Date(order.completeAt)>now)continue;order.status="completed";order.completedAt=new Date(now);company.finishedGoods[order.outputId]=(Number(company.finishedGoods[order.outputId])||0)+order.outputAmount;const machine=company.productionMachines.find(m=>m.id===order.machineId);if(machine){machine.status="available";machine.condition=Math.max((Number(machine.condition)||100)-Math.max(order.batches,1)*0.8,0);}company.productionHistory.push(order);completed.push(order);}return completed;
    }

    upgradeMachine(company,machineId){this.ensureCompany(company);const m=company.productionMachines.find(x=>x.id===machineId);if(!m)return{success:false,reason:"Maschine fehlt"};const cost=10000*m.upgradeLevel;if(company.money<cost)return{success:false,reason:"Nicht genug Geld"};company.money-=cost;m.upgradeLevel++;m.speedMultiplier=1+(m.upgradeLevel-1)*0.15;this.record(company,"machine_upgrade",-cost,{machineId});return{success:true,machine:m,cost};}

    createSupplierDelivery(company,offer,amount,totalCost,{transportMode="external",vehicle=null}={}){
        this.ensureCompany(company);if(!this.canStore(company,amount))return{success:false,reason:"Lager hat nicht genug freien Platz"};if((Number(company.money)||0)<totalCost)return{success:false,reason:"Nicht genug Geld"};
        const now=new Date(),hours=Math.max(Number(offer.deliveryHours)||1,0.25);const order={id:Date.now()+Math.random(),offerId:offer.id,supplierName:offer.supplierName,itemId:offer.itemId,amount,totalCost,status:"ordered",transportMode,vehicleId:vehicle?.id??null,orderedAt:now,departAt:new Date(now.getTime()+15*60000),arrivalAt:new Date(now.getTime()+hours*3600000)};
        company.money-=totalCost;this.record(company,"supplier_order",-totalCost,{itemId:offer.itemId,amount,supplier:offer.supplierName});if(vehicle)vehicle.status="reserved";company.supplierOrders.push(order);return{success:true,order};
    }

    processSupplierDeliveries(company,now=new Date()){
        this.ensureCompany(company);const delivered=[];
        for(const order of company.supplierOrders){if(order.status==="ordered"&&new Date(order.departAt)<=now){order.status="in_transit";const v=company.vehicles.find(x=>x.id===order.vehicleId);if(v)v.status="driving";}if(["ordered","in_transit","waiting_storage"].includes(order.status)&&new Date(order.arrivalAt)<=now){if(!this.canStore(company,order.amount)){order.status="waiting_storage";continue;}company.inventory[order.itemId]=(Number(company.inventory[order.itemId])||0)+order.amount;order.status="delivered";order.deliveredAt=new Date(now);delivered.push(order);const v=company.vehicles.find(x=>x.id===order.vehicleId);if(v)v.status="available";}}return delivered;
    }

    chooseTransport(company){this.ensureCompany(company);const own=company.vehicles.find(v=>v.status==="available");if(!own)return{mode:"external",vehicle:null,reason:"Kein eigenes freies Fahrzeug"};const def=own.definition??TruckTypes[own.type];if(!def)return{mode:"external",vehicle:null,reason:"Fahrzeugdaten fehlen"};return{mode:"own",vehicle:own,reason:"Eigenes Fahrzeug verfügbar"};}
    updateVehicleStatus(vehicle){if(!vehicle)return null;const condition=Number(vehicle.condition??100);if(condition<=25)vehicle.status="workshop_required";else if(condition<=45&&vehicle.status==="available")vehicle.status="maintenance_due";return vehicle.status;}
    serviceVehicle(company,vehicle,cost=1200){if(!vehicle)return{success:false,reason:"Fahrzeug fehlt"};if((Number(company.money)||0)<cost)return{success:false,reason:"Nicht genug Geld"};company.money-=cost;vehicle.condition=100;vehicle.status="available";this.record(company,"vehicle_service",-cost,{vehicleId:vehicle.id});return{success:true,vehicle,cost};}

    registerProductCost(company,recipeId,batches,materialCost,transportCost=0,productionOverhead=0){this.ensureCompany(company);const recipe=BeverageRecipeCatalog[recipeId];if(!recipe)return null;const units=(Number(recipe.outputAmount)||1)*Math.max(Number(batches)||1,1),total=(Number(materialCost)||0)+(Number(transportCost)||0)+(Number(productionOverhead)||0),record={recipeId,totalCost:total,units,costPerUnit:units>0?total/units:0,materialCost,transportCost,productionOverhead,updatedAt:new Date()};company.costAccounting.productCosts[recipe.outputId]=record;return record;}
    calculateDetailedProductionCost({recipeId,batches=1,supplierComparisonByItem={},energyPerBatch=38,staffPerBatch=72,machineWearPerBatch=24,transportCost=0}={}){const recipe=BeverageRecipeCatalog[recipeId];if(!recipe)return{success:false,reason:"Rezept unbekannt"};let ingredients=0;const detail={};for(const[itemId,qty]of Object.entries(recipe.inputs)){const unit=supplierComparisonByItem[itemId]?.effectiveUnitPrice??supplierComparisonByItem[itemId]?.unitPrice??0,cost=unit*qty*batches;detail[itemId]={quantity:qty*batches,unitPrice:unit,cost};ingredients+=cost;}const energy=energyPerBatch*batches,staff=staffPerBatch*batches,machineWear=machineWearPerBatch*batches,total=ingredients+energy+staff+machineWear+transportCost,units=recipe.outputAmount*batches;return{success:true,recipeId,batches,ingredients,energy,staff,machineWear,transportCost,total,units,costPerUnit:units?total/units:0,detail};}
    getMargin(company,productId,salePrice){this.ensureCompany(company);const cost=Number(company.costAccounting.productCosts?.[productId]?.costPerUnit)||0,price=Math.max(Number(salePrice)||0,0);return{costPerUnit:cost,salePrice:price,marginPerUnit:price-cost,marginPercent:price>0?(price-cost)/price*100:0,profitable:price>cost};}

    getSupplierComparison(market,itemId,amount,company=null){const qty=Math.max(Number(amount)||0,0);return market.getOffers(itemId,company).map(o=>{const minOrder=Number(o.minimumOrder)||1,orderAmount=Math.max(qty,minOrder),tiers=o.quantityDiscounts||[{min:50000,discount:0.08},{min:10000,discount:0.05},{min:1000,discount:0.025}],tier=tiers.find(t=>orderAmount>=t.min),discount=tier?.discount||0,effectiveUnitPrice=o.unitPrice*(1-discount),materialCost=effectiveUnitPrice*orderAmount,transportCost=market.estimateTransportCost(o,orderAmount);return{...o,requestedAmount:qty,orderAmount,minOrder,discount,discountPercent:discount*100,effectiveUnitPrice,materialCost,transportCost,totalCost:materialCost+transportCost,reliability:Number(o.reliability??0.95)};}).filter(x=>x.availableAmount>=x.orderAmount).sort((a,b)=>a.totalCost-b.totalCost);}

    setSalePrice(company,productId,price){this.ensureCompany(company);const p=Math.max(Number(price)||0,0);company.salesPrices[productId]=p;company.costAccounting.priceHistory[productId]??=[];company.costAccounting.priceHistory[productId].push({time:new Date(),price:p});return{success:true,productId,price:p};}
    getCompetitorMarket(productId="lager033_bottle"){const base=productId.includes("pils")?0.92:0.88;return[{name:"Regionalbraeu",price:base,marketShare:0.32},{name:"Stadtbrauerei",price:base+0.08,marketShare:0.24},{name:"Discount Brew",price:base-0.10,marketShare:0.19}];}
    demandAtPrice(productId,price){const competitors=this.getCompetitorMarket(productId),avg=competitors.reduce((s,x)=>s+x.price,0)/competitors.length,p=Math.max(Number(price)||avg,0.01),ratio=p/avg,demandIndex=Math.max(0.15,Math.min(1.8,1.25-(ratio-1)*1.4));return{productId,price:p,competitorAverage:avg,demandIndex,estimatedDailyUnits:Math.round(1200*demandIndex)};}

    createCustomerOrder(company,{productId="lager033_bottle",amount=1000,unitPrice=null,dueHours=72,customer="Getränkemarkt"}={}){this.ensureCompany(company);if(!this.canOperate(company))return{success:false,reason:"Betrieb noch nicht eröffnet"};const profile=getIndustryProfile(company);if(profile.products?.length&&!profile.products.includes(productId))return{success:false,reason:"Dieser Auftrag passt nicht zum Gewerbe"};const market=this.demandAtPrice(productId,unitPrice??company.salesPrices[productId]??0.89),price=unitPrice??Math.round(market.competitorAverage*100)/100,order={id:Date.now()+Math.random(),customer,productId,amount,delivered:0,unitPrice:price,status:"open",createdAt:new Date(),dueAt:new Date(Date.now()+dueHours*3600000)};company.customerOrders.push(order);return{success:true,order};}
    deliverCustomerOrder(company,orderId,amount){this.ensureCompany(company);const o=company.customerOrders.find(x=>x.id===orderId);if(!o)return{success:false,reason:"Kundenauftrag fehlt"};const available=Number(company.finishedGoods[o.productId])||0,remaining=o.amount-o.delivered,qty=Math.min(Math.max(Number(amount)||0,0),available,remaining);if(qty<=0)return{success:false,reason:"Keine lieferbare Ware"};company.finishedGoods[o.productId]-=qty;o.delivered+=qty;const revenue=qty*o.unitPrice;company.money+=revenue;this.record(company,"customer_sale",revenue,{orderId:o.id,qty});if(o.delivered>=o.amount){o.status="completed";o.completedAt=new Date();company.completedCustomerOrders.push(o);}return{success:true,accepted:qty,revenue,completed:o.status==="completed",order:o};}
    createReport(company,hours=168){this.ensureCompany(company);const since=Date.now()-hours*3600000,rows=company.financialLog.filter(x=>new Date(x.time).getTime()>=since),income=rows.filter(x=>x.amount>0).reduce((s,x)=>s+x.amount,0),costs=-rows.filter(x=>x.amount<0).reduce((s,x)=>s+x.amount,0);return{hours,income,costs,profit:income-costs,openSupplierOrders:company.supplierOrders.filter(x=>x.status!=="delivered").length,queuedProduction:company.productionQueue.filter(x=>!["completed"].includes(x.status)).length,openCustomerOrders:company.customerOrders.filter(x=>x.status==="open").length};}
    rewardMilestone(company,reason="mission",coins=1){this.ensureCompany(company);const amount=Math.max(Math.floor(Number(coins)||0),0);company.coins+=amount;company.coinLedger.push({time:new Date(),amount,reason});return{success:true,coinsAwarded:amount,balance:company.coins};}
    spendCoins(company,amount,reason){this.ensureCompany(company);const n=Math.max(Math.floor(Number(amount)||0),0);if(company.coins<n)return{success:false,reason:"Nicht genügend Coins"};company.coins-=n;company.coinLedger.push({time:new Date(),amount:-n,reason});return{success:true,spent:n,balance:company.coins};}
}

export function runAdvancedEconomyTest(){
    const s=new AdvancedEconomySystem({defaultStorageCapacity:5000});
    const c={money:100000,inventory:{malt_kg:100,hops_kg:2,yeast_kg:2,water_l:1000,bottle_033:1000,crown_cap:1000,label_033:1000},finishedGoods:{lager033_bottle:500},vehicles:[],productionState:{slots:1},coins:0};
    s.ensureCompany(c);s.setSalePrice(c,"lager033_bottle",0.99);const p=s.startProduction(c,"lager033",1),blocked=s.startProduction(c,"lager033",1),done=s.processProduction(c,new Date(Date.now()+24*3600000)),cost=s.registerProductCost(c,"lager033",1,420,80,100),cust=s.createCustomerOrder(c,{amount:300,unitPrice:1.05}),del=s.deliverCustomerOrder(c,cust.order.id,300),report=s.createReport(c,999999);
    const success=p.success&&!blocked.success&&done.length===1&&cost.costPerUnit>0&&del.success&&c.coins===0&&report.income>0;
    console[success?"log":"error"](success?"✅ ADVANCED-ECONOMY-TEST ERFOLGREICH":"❌ ADVANCED-ECONOMY-TEST FEHLGESCHLAGEN",{p,blocked,done,cost,del,report});return{success};
}
