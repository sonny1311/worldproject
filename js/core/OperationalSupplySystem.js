// WorldProject - operativer Einkauf -> Lieferung -> Lager -> Produktion
// Balancingwerte sind bewusst vorläufig und werden erst im Spieltest feinjustiert.

export const IndustryMaterials={
 brewery:["water","malt","hops","yeast","sugar","bottles","caps","labels","co2"],
 carpentry:["softwood","hardwood","plywood","mdf","glue","varnish","screws","fittings","packaging"],
 bakery:["flour","yeast","sugar","salt","butter","eggs","packaging"],
 dairy:["raw_milk","cultures","rennet","salt","packaging"],
 meat:["meat","spices","salt","packaging","cooling_supplies"]
};

export const WarehouseZones={
 raw:{label:"Rohstofflager",capacity:10000},
 packaging:{label:"Verpackungslager",capacity:5000},
 finished:{label:"Fertigwarenlager",capacity:10000},
 cooled:{label:"Kühllager",capacity:4000}
};

export function materialsForIndustry(industry){return [...(IndustryMaterials[industry]||[])];}
export function supplierPrice(basePrice,{market=1,demand=1,availability=1,quantity=1,discountTiers=[]}={}){
 let discount=0;for(const t of discountTiers.sort((a,b)=>a.min-b.min)){if(quantity>=t.min)discount=Math.max(discount,Number(t.discount||0));}
 return Math.max(0,basePrice*market*demand*(2-Math.max(.5,availability))*(1-discount));
}
export function compareSuppliers(material,quantity,suppliers=[]){return suppliers.filter(s=>s.materials?.includes(material)).map(s=>{const unit=supplierPrice(s.prices?.[material]||0,{market:s.market||1,demand:s.demand||1,availability:s.availability||1,quantity,discountTiers:s.discountTiers||[]});const transport=Number(s.transportCost||0);return {...s,material,quantity,unitPrice:unit,totalMaterial:unit*quantity,totalCost:unit*quantity+transport,etaHours:Number(s.etaHours||1),quality:Number(s.quality||1),reliability:Number(s.reliability||1)};}).sort((a,b)=>a.totalCost-b.totalCost);}

export class SupplyOrderBook{
 constructor(){this.orders=[];}
 create({companyId,material,quantity,supplier,transportMode="supplier",vehicleId=null}){if(!material||quantity<=0||!supplier)throw new Error("Ungültige Bestellung");const now=Date.now(),delayRisk=Math.max(0,1-Number(supplier.reliability||1));const delayed=Math.random()<delayRisk*.15;const etaHours=Number(supplier.etaHours||1)*(delayed?1.5:1);const o={id:`SO-${now}-${Math.random().toString(36).slice(2,7)}`,companyId,material,quantity,supplierId:supplier.id,quality:Number(supplier.quality||1),transportMode,vehicleId,status:"ordered",orderedAt:now,etaAt:now+etaHours*3600000,delayed,totalCost:Number(supplier.totalCost||0)};this.orders.push(o);return o;}
 update(now=Date.now()){for(const o of this.orders){if(["received","cancelled"].includes(o.status))continue;if(now>=o.etaAt)o.status="arrived";else if(o.status==="ordered")o.status="in_transit";}return this.orders;}
 byStatus(status){return this.orders.filter(o=>o.status===status);}
}

export class WarehouseSystem{
 constructor(zones={}){this.zones={};for(const[k,v]of Object.entries(WarehouseZones))this.zones[k]={...v,...zones[k],items:{...(zones[k]?.items||{})}};}
 zoneFor(material){if(["bottles","caps","labels","packaging"].includes(material))return "packaging";if(["raw_milk","meat","cooling_supplies"].includes(material))return "cooled";return "raw";}
 used(zone){return Object.values(this.zones[zone]?.items||{}).reduce((s,v)=>s+Number(v.quantity||0),0);}
 receive(order){if(order.status!=="arrived")throw new Error("Lieferung ist noch nicht angekommen");const z=this.zoneFor(order.material),zone=this.zones[z];if(this.used(z)+order.quantity>zone.capacity)throw new Error(`${zone.label} hat nicht genug Kapazität`);const old=zone.items[order.material]||{quantity:0,quality:0};const total=old.quantity+order.quantity;zone.items[order.material]={quantity:total,quality:total?((old.quantity*old.quality)+(order.quantity*order.quality))/total:order.quality};order.status="received";return {zone:z,item:zone.items[order.material]};}
 available(material){for(const z of Object.values(this.zones)){if(z.items[material])return Number(z.items[material].quantity||0);}return 0;}
 consume(requirements={}){for(const[m,q]of Object.entries(requirements))if(this.available(m)<q)throw new Error(`Fehlmenge ${m}: ${q-this.available(m)}`);for(const[m,q]of Object.entries(requirements)){let left=q;for(const z of Object.values(this.zones)){const it=z.items[m];if(!it||left<=0)continue;const take=Math.min(left,it.quantity);it.quantity-=take;left-=take;}}}
 addFinished(product,quantity,quality=1){const z=this.zones.finished;if(this.used("finished")+quantity>z.capacity)throw new Error("Fertigwarenlager voll");const old=z.items[product]||{quantity:0,quality};z.items[product]={quantity:old.quantity+quantity,quality};return z.items[product];}
}

export class ProductionPlanner{
 constructor({warehouse,machines=[]}={}){this.warehouse=warehouse;this.machines=machines;this.queue=[];}
 plan(recipe,batches=1){const requirements={};for(const[m,q]of Object.entries(recipe.materials||{}))requirements[m]=q*batches;const missing={};for(const[m,q]of Object.entries(requirements)){const a=this.warehouse.available(m);if(a<q)missing[m]=q-a;}const requiredMachines=recipe.machines||[];const unavailable=requiredMachines.filter(t=>!this.machines.some(m=>m.type===t&&m.status!=="broken"));return {recipe,batches,requirements,missing,unavailableMachines:unavailable,durationMinutes:Number(recipe.durationMinutes||0)*batches,cost:Number(recipe.variableCost||0)*batches,ready:Object.keys(missing).length===0&&unavailable.length===0};}
 enqueue(plan){if(!plan.ready)throw new Error("Produktionsauftrag noch nicht startbereit");const busyTypes=new Set(this.queue.filter(x=>x.status==="running").flatMap(x=>x.plan.recipe.machines||[]));if((plan.recipe.machines||[]).some(t=>busyTypes.has(t)))throw new Error("Benötigte Maschine ist bereits belegt");this.warehouse.consume(plan.requirements);const job={id:`PJ-${Date.now()}`,plan,status:"queued",createdAt:Date.now()};this.queue.push(job);return job;}
 startNext(){const job=this.queue.find(j=>j.status==="queued");if(!job)return null;job.status="running";job.startedAt=Date.now();job.finishAt=job.startedAt+job.plan.durationMinutes*60000;return job;}
 update(now=Date.now()){for(const j of this.queue){if(j.status==="running"&&now>=j.finishAt){j.status="finished";this.warehouse.addFinished(j.plan.recipe.product,j.plan.recipe.output*j.plan.batches,j.plan.recipe.quality||1);}}return this.queue;}
}

export function validateVehicleForPickup(vehicle,{weightKg=0,pallets=0,volumeM3=0}={}){const errors=[];if(Number(weightKg)>Number(vehicle?.payloadKg||0))errors.push("Nutzlast überschritten");if(Number(pallets)>Number(vehicle?.palletCapacity||0))errors.push("Palettenkapazität überschritten");if(Number(volumeM3)>Number(vehicle?.volumeM3||Infinity))errors.push("Ladevolumen überschritten");return {allowed:errors.length===0,errors};}

export function runOperationalSupplyTest(){const wh=new WarehouseSystem(),book=new SupplyOrderBook(),supplier={id:"S1",materials:["malt"],prices:{malt:1},quality:.95,reliability:1,etaHours:1,totalCost:100};const o=book.create({companyId:1,material:"malt",quantity:100,supplier});o.etaAt=0;book.update();wh.receive(o);const planner=new ProductionPlanner({warehouse:wh,machines:[{type:"brewhouse",status:"ready"}]});const p=planner.plan({product:"test_beer",materials:{malt:50},machines:["brewhouse"],durationMinutes:1,output:100},1);if(!p.ready)throw new Error("Produktionsplanung fehlerhaft");planner.enqueue(p);planner.startNext();planner.update(Date.now()+120000);if(wh.zones.finished.items.test_beer.quantity!==100)throw new Error("Fertigware fehlt");console.log("✅ EINKAUF-/LAGER-/PRODUKTIONSTEST ERFOLGREICH");}
