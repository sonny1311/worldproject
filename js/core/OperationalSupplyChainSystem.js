// WorldProject - operativer Kern: Einkauf -> Lieferung -> Lager -> Produktion
// Balancingwerte sind vorlaeufig und werden im spaeteren Spieltest angepasst.

export const IndustryMaterials={
 brewery:["malt","hops","yeast","water","bottles","caps","labels"],
 carpenter:["softwood","hardwood","plywood","glue","screws","varnish","packaging"],
 bakery:["flour","yeast","sugar","salt","butter","packaging"],
 butcher:["meat","spices","salt","packaging","labels"]
};

export const StorageZones={raw:{label:"Rohstofflager"},packaging:{label:"Verpackungslager"},finished:{label:"Fertigwarenlager"},cold:{label:"Kuehllager"}};

export function materialsForIndustry(industry=""){return [...(IndustryMaterials[industry]||[])];}
export function supplierAllowed(company,supplier){const allowed=new Set(materialsForIndustry(company?.industry));return (supplier?.materials||[]).some(x=>allowed.has(x));}
export function marketPrice(basePrice,{demand=1,availability=1,seed=1}={}){const fluctuation=.94+((Math.abs(Number(seed)||1)%13)/100);return Math.max(.01,Number(basePrice||0)*Math.max(.75,Number(demand||1))/Math.max(.65,Number(availability||1))*fluctuation);}
export function quantityDiscount(quantity=0){const q=Number(quantity||0);if(q>=10000)return .10;if(q>=5000)return .07;if(q>=1000)return .04;if(q>=250)return .02;return 0;}
export function quoteSupplier(supplier,material,quantity,{seed=1}={}){if(!(supplier.materials||[]).includes(material))throw new Error("Lieferant fuehrt diesen Rohstoff nicht");const base=Number(supplier.prices?.[material]||supplier.basePrice||0),discount=quantityDiscount(quantity),unit=marketPrice(base,{demand:supplier.demand||1,availability:supplier.availability||1,seed});const goods=unit*quantity*(1-discount),delivery=Number(supplier.deliveryBase||0)+Number(supplier.distanceKm||0)*Number(supplier.deliveryPerKm||0);return {supplierId:supplier.id,material,quantity,unitPrice:unit,discount,goodsCost:goods,deliveryCost:delivery,totalCost:goods+delivery,distanceKm:Number(supplier.distanceKm||0),deliveryHours:Number(supplier.deliveryHours||1),quality:Number(supplier.quality||1),reliability:Number(supplier.reliability||1)};}

export class SupplyOrderSystem{
 constructor(){this.orders=[];this.seq=1;}
 createOrder({company,supplier,material,quantity,transportMode="supplier",vehicle=null,now=Date.now()}){const quote=quoteSupplier(supplier,material,quantity,{seed:this.seq});if(transportMode==="own"&&!vehicle)throw new Error("Fuer Eigenabholung muss ein Fahrzeug gewaehlt werden");const order={id:this.seq++,companyId:company?.id||company?.serverCompanyId,supplierId:supplier.id,material,quantity,quote,transportMode,vehicleId:vehicle?.id||null,status:"ordered",createdAt:now,eta:now+quote.deliveryHours*3600000};this.orders.push(order);return order;}
 advance(now=Date.now()){for(const o of this.orders){if(o.status==="ordered")o.status="in_transit";if(o.status==="in_transit"&&now>=o.eta)o.status="arrived";}return this.orders;}
 byStatus(status){return this.orders.filter(o=>o.status===status);}
}

export class WarehouseSystem{
 constructor(capacities={raw:10000,packaging:10000,finished:10000,cold:0}){this.capacities={...capacities};this.stock={raw:{},packaging:{},finished:{},cold:{}};}
 zoneFor(material){return ["bottles","caps","labels","packaging"].includes(material)?"packaging":"raw";}
 used(zone){return Object.values(this.stock[zone]||{}).reduce((a,b)=>a+Number(b||0),0);}
 receive(order){if(order.status!=="arrived")throw new Error("Lieferung ist noch nicht angekommen");const z=this.zoneFor(order.material),free=Number(this.capacities[z]||0)-this.used(z);if(free<order.quantity)throw new Error(`Nicht genug Platz im ${StorageZones[z].label}`);this.stock[z][order.material]=Number(this.stock[z][order.material]||0)+order.quantity;order.status="stored";return {zone:z,quantity:order.quantity};}
 has(requirements={}){const missing={};for(const[m,q]of Object.entries(requirements)){const z=this.zoneFor(m),have=Number(this.stock[z]?.[m]||0);if(have<q)missing[m]=q-have;}return {ok:!Object.keys(missing).length,missing};}
 consume(requirements={}){const check=this.has(requirements);if(!check.ok)return check;for(const[m,q]of Object.entries(requirements)){const z=this.zoneFor(m);this.stock[z][m]-=q;}return {ok:true,missing:{}};}
 addFinished(product,quantity){const free=Number(this.capacities.finished||0)-this.used("finished");if(free<quantity)throw new Error("Fertigwarenlager ist voll");this.stock.finished[product]=Number(this.stock.finished[product]||0)+quantity;}
}

export class ProductionPlanner{
 constructor({warehouse,machines=[]}={}){this.warehouse=warehouse;this.machines=machines;this.queue=[];this.seq=1;}
 plan(recipe,batches=1){const n=Math.max(1,Number(batches||1)),requirements={};for(const[m,q]of Object.entries(recipe.materials||{}))requirements[m]=q*n;const stock=this.warehouse.has(requirements),machine=this.machines.find(x=>x.type===recipe.machineType);return {recipeId:recipe.id,batches:n,requirements,durationMinutes:Number(recipe.durationMinutes||0)*n,output:Number(recipe.output||0)*n,machineAvailable:!!machine&&!machine.busy,missing:stock.missing,ready:stock.ok&&!!machine&&!machine.busy};}
 start(recipe,batches=1,now=Date.now()){const p=this.plan(recipe,batches);if(!p.ready)throw new Error(Object.keys(p.missing).length?`Rohstoffe fehlen: ${JSON.stringify(p.missing)}`:"Benötigte Maschine nicht frei");this.warehouse.consume(p.requirements);const machine=this.machines.find(x=>x.type===recipe.machineType);machine.busy=true;const job={id:this.seq++,recipe,plan:p,machine,status:"running",finishAt:now+p.durationMinutes*60000};this.queue.push(job);return job;}
 advance(now=Date.now()){for(const j of this.queue){if(j.status==="running"&&now>=j.finishAt){j.status="finished";j.machine.busy=false;this.warehouse.addFinished(j.recipe.product,j.plan.output);}}return this.queue;}
}

export function runOperationalSupplyChainTest(){const company={id:1,industry:"brewery"},supplier={id:1,materials:["malt"],prices:{malt:1},distanceKm:30,deliveryBase:20,deliveryPerKm:.5,deliveryHours:2,quality:.95,reliability:.98};const orders=new SupplyOrderSystem(),warehouse=new WarehouseSystem(),order=orders.createOrder({company,supplier,material:"malt",quantity:500,now:0});orders.advance(order.eta);warehouse.receive(order);const planner=new ProductionPlanner({warehouse,machines:[{id:1,type:"brewhouse",busy:false}]});const recipe={id:"beer",product:"beer",materials:{malt:100},machineType:"brewhouse",durationMinutes:60,output:1000};const job=planner.start(recipe,1,0);planner.advance(job.finishAt);if(warehouse.stock.finished.beer!==1000)throw new Error("Supply-Chain-Test fehlgeschlagen");console.log("✅ OPERATIVER LIEFERKETTEN-/PRODUKTIONSTEST ERFOLGREICH",{order,job});return true;}
