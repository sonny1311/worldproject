// WorldProject - operativer Kern: Einkauf -> Lieferung -> Lager -> Produktion
// Balancingwerte sind vorlaeufig und werden im spaeteren Spieltest angepasst.

export const IndustryMaterials={
 brewery:["malt","hops","yeast","water","bottles","caps","labels"],
 carpenter:["softwood","hardwood","plywood","glue","screws","varnish","packaging"],
 bakery:["flour","yeast","sugar","salt","butter","packaging"],
 butcher:["meat","spices","salt","packaging","labels"]
};

export const StorageZones={raw:{label:"Rohstofflager"},packaging:{label:"Verpackungslager"},finished:{label:"Fertigwarenlager"},cold:{label:"Kuehllager"}};
export const OrderStatuses={ordered:"Bestellt",in_transit:"Unterwegs",arrived:"Angekommen",stored:"Eingelagert",delayed:"Verspaetet",cancelled:"Storniert"};

export function materialsForIndustry(industry=""){return [...(IndustryMaterials[industry]||[])];}
export function supplierAllowed(company,supplier){const allowed=new Set(materialsForIndustry(company?.industry));return (supplier?.materials||[]).some(x=>allowed.has(x));}
export function marketPrice(basePrice,{demand=1,availability=1,seed=1}={}){const fluctuation=.94+((Math.abs(Number(seed)||1)%13)/100);return Math.max(.01,Number(basePrice||0)*Math.max(.75,Number(demand||1))/Math.max(.65,Number(availability||1))*fluctuation);}
export function quantityDiscount(quantity=0){const q=Number(quantity||0);if(q>=10000)return .10;if(q>=5000)return .07;if(q>=1000)return .04;if(q>=250)return .02;return 0;}
export function contractDiscount(contract){if(!contract)return 0;return Math.min(.12,Math.max(0,Number(contract.discount||0)));}
export function quoteSupplier(supplier,material,quantity,{seed=1,contract=null,transportMode="supplier"}={}){if(!(supplier.materials||[]).includes(material))throw new Error("Lieferant fuehrt diesen Rohstoff nicht");const base=Number(supplier.prices?.[material]||supplier.basePrice||0),discount=Math.max(quantityDiscount(quantity),contractDiscount(contract)),unit=marketPrice(base,{demand:supplier.demand||1,availability:supplier.availability||1,seed});const goods=unit*quantity*(1-discount),delivery=transportMode==="supplier"?Number(supplier.deliveryBase||0)+Number(supplier.distanceKm||0)*Number(supplier.deliveryPerKm||0):0;return {supplierId:supplier.id,material,quantity,unitPrice:unit,discount,goodsCost:goods,deliveryCost:delivery,totalCost:goods+delivery,distanceKm:Number(supplier.distanceKm||0),deliveryHours:Number(supplier.deliveryHours||1),quality:Number(supplier.quality||1),reliability:Number(supplier.reliability||1)};}

export function vehicleCanCarry(vehicle,{weightKg=0,volumeM3=0,pallets=0}={}){if(!vehicle)return {ok:false,reasons:["Kein Fahrzeug ausgewaehlt"]};const reasons=[];if(Number(vehicle.payloadKg||vehicle.payload||0)<weightKg)reasons.push("Nutzlast zu gering");if(Number(vehicle.volumeM3||Infinity)<volumeM3)reasons.push("Volumen zu gering");if(Number(vehicle.palletCapacity||vehicle.pallets||Infinity)<pallets)reasons.push("Zu wenig Palettenplaetze");return {ok:!reasons.length,reasons};}

export class SupplierContractSystem{
 constructor(){this.contracts=[];this.seq=1;}
 create({supplierId,material,minQuantity,discount=.03,durationDays=30}){const c={id:this.seq++,supplierId,material,minQuantity:Number(minQuantity||0),discount:Number(discount||0),durationDays:Number(durationDays||30),startedAt:Date.now(),active:true};this.contracts.push(c);return c;}
 activeFor(supplierId,material){return this.contracts.find(c=>c.active&&c.supplierId===supplierId&&c.material===material)||null;}
}

export class SupplyOrderSystem{
 constructor({contracts=null}={}){this.orders=[];this.seq=1;this.contracts=contracts;}
 createOrder({company,supplier,material,quantity,transportMode="supplier",vehicle=null,cargo={weightKg:0,volumeM3:0,pallets:0},now=Date.now()}){const contract=this.contracts?.activeFor(supplier.id,material)||null;if(contract&&quantity<contract.minQuantity)throw new Error("Mindestabnahme des Liefervertrags nicht erreicht");if(transportMode==="own"){const fit=vehicleCanCarry(vehicle,cargo);if(!fit.ok)throw new Error(`Fahrzeug ungeeignet: ${fit.reasons.join(", ")}`);}const quote=quoteSupplier(supplier,material,quantity,{seed:this.seq,contract,transportMode});const reliability=Math.max(0,Math.min(1,quote.reliability));const delayHours=reliability>=.98?0:Math.round((1-reliability)*24);const order={id:this.seq++,companyId:company?.id||company?.serverCompanyId,supplierId:supplier.id,material,quantity,quote,contractId:contract?.id||null,transportMode,vehicleId:vehicle?.id||null,cargo,status:"ordered",createdAt:now,eta:now+(quote.deliveryHours+delayHours)*3600000,plannedEta:now+quote.deliveryHours*3600000};this.orders.push(order);return order;}
 advance(now=Date.now()){for(const o of this.orders){if(o.status==="ordered")o.status="in_transit";if(o.status==="in_transit"&&now>o.plannedEta&&now<o.eta)o.status="delayed";if(["in_transit","delayed"].includes(o.status)&&now>=o.eta)o.status="arrived";}return this.orders;}
 byStatus(status){return this.orders.filter(o=>o.status===status);}
 summary(){const out={};for(const key of Object.keys(OrderStatuses))out[key]=this.byStatus(key).length;return out;}
}

export class WarehouseSystem{
 constructor(capacities={raw:10000,packaging:10000,finished:10000,cold:0}){this.capacities={...capacities};this.stock={raw:{},packaging:{},finished:{},cold:{}};}
 zoneFor(material){return ["bottles","caps","labels","packaging"].includes(material)?"packaging":"raw";}
 used(zone){return Object.values(this.stock[zone]||{}).reduce((a,b)=>a+Number(b||0),0);}
 free(zone){return Math.max(0,Number(this.capacities[zone]||0)-this.used(zone));}
 receive(order){if(order.status!=="arrived")throw new Error("Lieferung ist noch nicht angekommen");const z=this.zoneFor(order.material),free=this.free(z);if(free<order.quantity)throw new Error(`Nicht genug Platz im ${StorageZones[z].label}`);this.stock[z][order.material]=Number(this.stock[z][order.material]||0)+order.quantity;order.status="stored";return {zone:z,quantity:order.quantity};}
 has(requirements={}){const missing={};for(const[m,q]of Object.entries(requirements)){const z=this.zoneFor(m),have=Number(this.stock[z]?.[m]||0);if(have<q)missing[m]=q-have;}return {ok:!Object.keys(missing).length,missing};}
 consume(requirements={}){const check=this.has(requirements);if(!check.ok)return check;for(const[m,q]of Object.entries(requirements)){const z=this.zoneFor(m);this.stock[z][m]-=q;}return {ok:true,missing:{}};}
 addFinished(product,quantity){const free=this.free("finished");if(free<quantity)throw new Error("Fertigwarenlager ist voll");this.stock.finished[product]=Number(this.stock.finished[product]||0)+quantity;}
 overview(){return Object.fromEntries(Object.keys(StorageZones).map(z=>[z,{used:this.used(z),free:this.free(z),capacity:Number(this.capacities[z]||0),stock:{...(this.stock[z]||{})}}]));}
}

export class ProductionPlanner{
 constructor({warehouse,machines=[]}={}){this.warehouse=warehouse;this.machines=machines;this.queue=[];this.seq=1;}
 plan(recipe,batches=1){const n=Math.max(1,Number(batches||1)),requirements={};for(const[m,q]of Object.entries(recipe.materials||{}))requirements[m]=q*n;const stock=this.warehouse.has(requirements),machine=this.machines.find(x=>x.type===recipe.machineType);const estimatedCost=(Number(recipe.variableCost||0)*n);return {recipeId:recipe.id,batches:n,requirements,durationMinutes:Number(recipe.durationMinutes||0)*n,output:Number(recipe.output||0)*n,estimatedCost,machineAvailable:!!machine&&!machine.busy,missing:stock.missing,ready:stock.ok&&!!machine&&!machine.busy};}
 start(recipe,batches=1,now=Date.now()){const p=this.plan(recipe,batches);if(!p.ready)throw new Error(Object.keys(p.missing).length?`Rohstoffe fehlen: ${JSON.stringify(p.missing)}`:"Benoetigte Maschine nicht frei");this.warehouse.consume(p.requirements);const machine=this.machines.find(x=>x.type===recipe.machineType);machine.busy=true;const job={id:this.seq++,recipe,plan:p,machine,status:"running",startedAt:now,finishAt:now+p.durationMinutes*60000};this.queue.push(job);return job;}
 advance(now=Date.now()){for(const j of this.queue){if(j.status==="running"&&now>=j.finishAt){j.status="finished";j.machine.busy=false;this.warehouse.addFinished(j.recipe.product,j.plan.output);}}return this.queue;}
}

export function runOperationalSupplyChainTest(){const company={id:1,industry:"brewery"},supplier={id:1,materials:["malt"],prices:{malt:1},distanceKm:30,deliveryBase:20,deliveryPerKm:.5,deliveryHours:2,quality:.95,reliability:.98};const contracts=new SupplierContractSystem(),orders=new SupplyOrderSystem({contracts}),warehouse=new WarehouseSystem(),contract=contracts.create({supplierId:1,material:"malt",minQuantity:500,discount:.03}),vehicle={id:7,payloadKg:12000,volumeM3:40,palletCapacity:18};const order=orders.createOrder({company,supplier,material:"malt",quantity:500,transportMode:"own",vehicle,cargo:{weightKg:500,volumeM3:2,pallets:1},now:0});orders.advance(order.eta);warehouse.receive(order);const planner=new ProductionPlanner({warehouse,machines:[{id:1,type:"brewhouse",busy:false}]});const recipe={id:"beer",product:"beer",materials:{malt:100},machineType:"brewhouse",durationMinutes:60,output:1000,variableCost:80};const job=planner.start(recipe,1,0);planner.advance(job.finishAt);if(warehouse.stock.finished.beer!==1000||order.contractId!==contract.id)throw new Error("Supply-Chain-Test fehlgeschlagen");console.log("✅ OPERATIVER LIEFERKETTEN-/PRODUKTIONSTEST ERFOLGREICH",{order,job,orderSummary:orders.summary(),warehouse:warehouse.overview()});return true;}
