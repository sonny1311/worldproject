// WorldProject - Regressionstest fuer den kompletten operativen Warenkreislauf.
// Absichtlich ohne UI-Abhaengigkeit, damit Einkauf/Lieferung/Lager/Produktion
// auch waehrend paralleler UI-Entwicklung stabil geprueft werden koennen.
import "../content/ContentBootstrap.js";
import { SupplyOrderSystem, WarehouseSystem, ProductionPlanner, quoteSupplier } from "./OperationalSupplyChainSystem.js";
import { worldContentRegistry } from "./ContentRegistry.js";

function assert(condition,message){if(!condition)throw new Error(message);}
function expectThrow(fn,message){let threw=false;try{fn();}catch{threw=true;}assert(threw,message);}
function clone(value){return JSON.parse(JSON.stringify(value));}

export function runOperationalSupplyChainRegressionTest(){
 const checks=[];
 const check=(name,fn)=>{fn();checks.push(name);};
 const company={id:"regression-brewery",branchKey:"brewery",industry:"Getraenke",type:"Brauerei",money:100000};
 const supplier=worldContentRegistry.get("suppliers","brew_malt_regional");
 assert(supplier,"Regressionstest: Brauerei-Lieferant fehlt im Content");
 check("01 Lieferantenangebot ist gueltig",()=>{const q=quoteSupplier(supplier,"malt",500);assert(q.totalCost>0&&q.quantity===500,"Lieferantenangebot fehlerhaft");});
 check("02 Nullmenge wird abgelehnt",()=>expectThrow(()=>quoteSupplier(supplier,"malt",0),"Nullmenge wurde akzeptiert"));
 check("03 negative Menge wird abgelehnt",()=>expectThrow(()=>quoteSupplier(supplier,"malt",-1),"Negative Menge wurde akzeptiert"));
 check("04 NaN-Menge wird abgelehnt",()=>expectThrow(()=>quoteSupplier(supplier,"malt",NaN),"NaN-Menge wurde akzeptiert"));
 check("05 unbekanntes Material wird abgelehnt",()=>expectThrow(()=>quoteSupplier(supplier,"materials.undefined",10),"materials.undefined wurde akzeptiert"));
 const orders=new SupplyOrderSystem();
 const order=orders.createOrder({company,supplier,material:"malt",quantity:500,now:1000});
 check("06 Bestellung besitzt stabile ETA",()=>{assert(Number.isFinite(order.eta)&&order.eta>order.createdAt,"ETA fehlt");});
 check("07 Lieferung wechselt zu unterwegs",()=>{orders.advance(order.createdAt+1);assert(order.status==="in_transit","Status wurde nicht unterwegs");});
 check("08 Lieferung kommt nach ETA an",()=>{orders.advance(order.eta);assert(order.status==="arrived","Status wurde nicht angekommen");});
 // 750 Einheiten Kapazitaet: Nach 500 Einheiten Bestand passen noch exakt 250 hinein; 251 muessen scheitern.
 const warehouse=new WarehouseSystem({raw:750,packaging:1000,finished:1000,cold:1000});
 check("09 Wareneingang bucht exakt einmal",()=>{warehouse.receive(order);assert(warehouse.stock.raw.malt===500&&order.status==="stored","Wareneingang falsch");});
 check("10 doppelter Wareneingang wird blockiert",()=>{expectThrow(()=>warehouse.receive(order),"Doppelter Wareneingang wurde akzeptiert");assert(warehouse.stock.raw.malt===500,"Doppelter Wareneingang hat Bestand veraendert");});
 check("11 Lagergrenze wird eingehalten",()=>{const full={status:"arrived",material:"malt",quantity:251};expectThrow(()=>warehouse.receive(full),"Ueberfuellung wurde akzeptiert");assert(warehouse.stock.raw.malt===500,"Ueberfuellung hat Bestand veraendert");});
 check("12 negative Lagerbewegung ist unmoeglich",()=>{const r=warehouse.consume({malt:501});assert(!r.ok&&warehouse.stock.raw.malt===500,"Bestand wurde negativ");});
 check("13 JSON-Roundtrip behaelt Lieferstatus",()=>{const restored=clone({orders:orders.orders,stock:warehouse.stock});assert(restored.orders[0].status==="stored"&&restored.stock.raw.malt===500,"Persistenz-Roundtrip falsch");});
 check("14 Reload erzeugt keine zweite Gutschrift",()=>{const restoredOrder=clone(order),restoredWarehouse=new WarehouseSystem({raw:750,packaging:1000,finished:1000,cold:1000});restoredWarehouse.stock=clone(warehouse.stock);expectThrow(()=>restoredWarehouse.receive(restoredOrder),"Reload erlaubte doppelte Einlagerung");assert(restoredWarehouse.stock.raw.malt===500,"Reload verdoppelte Bestand");});
 const machine={id:1,type:"brewhouse",status:"available",busy:false,capacity:1000};
 const planner=new ProductionPlanner({warehouse,machines:[machine]});
 const recipe={id:"regression_beer",product:"regression_beer_bulk",materials:{malt:100},machineType:"brewhouse",durationMinutes:60,output:1000,variableCost:50};
 check("15 Planung verbraucht keine Ware",()=>{const before=warehouse.stock.raw.malt,p=planner.planForOutput(recipe,1000);assert(p.requirements.malt===100&&warehouse.stock.raw.malt===before,"Planung hat Ware verbraucht");});
 const queued=planner.queueForOutput(recipe,1000,2000);
 check("16 Queue reserviert noch keine Ware",()=>{assert(queued.status==="queued"&&warehouse.stock.raw.malt===500,"Queue hat Bestand veraendert");});
 check("17 Produktionsstart zieht exakt Bedarf ab",()=>{const j=planner.startQueued(queued.id,3000);assert(j&&warehouse.stock.raw.malt===400,"Falscher Rohstoffverbrauch beim Start");});
 check("18 Doppelklick auf Start verbraucht nicht doppelt",()=>{const before=warehouse.stock.raw.malt,again=planner.startQueued(queued.id,3001);assert(again===false&&warehouse.stock.raw.malt===before,"Doppelstart hat erneut Rohstoffe verbraucht");});
 check("19 laufende Charge kann nicht folgenlos storniert werden",()=>{assert(planner.cancel(queued.id)===false,"Laufende Charge wurde storniert");});
 check("20 Fertigware landet exakt im Fertiglager",()=>{planner.advance(queued.finishAt);assert(queued.status==="finished"&&warehouse.stock.finished.regression_beer_bulk===1000,"Fertigware falsch eingelagert");});
 warehouse.stock.finished.beer_bulk_pils=500;warehouse.stock.packaging.bottles=1000;warehouse.stock.packaging.caps=1000;warehouse.stock.packaging.labels=1000;
 const filler={id:2,type:"filling_line",status:"available",busy:false,capacity:1200};planner.machines.push(filler);
 const fill={id:"regression_fill",product:"regression_pils_033",materials:{beer_bulk_pils:330,bottles:1000,caps:1000,labels:1000},machineType:"filling_line",durationMinutes:60,output:1000,productionStage:"bottling",bottleSizeLiters:.33};
 check("21 100 Liter ergeben 304 Flaschen",()=>{const p=planner.planForVolume(fill,100);assert(p.bottleCount===304,"Flaschenanzahl falsch");});
 check("22 Abfuellbedarf skaliert mit Flaschenzahl",()=>{const p=planner.planForVolume(fill,100);assert(Math.abs(p.requirements.beer_bulk_pils-100.32)<.0001&&p.requirements.bottles===304&&p.requirements.caps===304&&p.requirements.labels===304,"Abfuellmaterial falsch skaliert");});
 const fillJob=planner.queueForVolume(fill,100,4000);
 check("23 Abfuellstart zieht Verpackung exakt ab",()=>{const before={b:warehouse.stock.packaging.bottles,c:warehouse.stock.packaging.caps,l:warehouse.stock.packaging.labels,beer:warehouse.stock.finished.beer_bulk_pils};assert(planner.startQueued(fillJob.id,5000),"Abfuellauftrag startet nicht");assert(warehouse.stock.packaging.bottles===before.b-304&&warehouse.stock.packaging.caps===before.c-304&&warehouse.stock.packaging.labels===before.l-304&&Math.abs(warehouse.stock.finished.beer_bulk_pils-(before.beer-100.32))<.0001,"Verpackungsverbrauch falsch");});
 check("24 Abfuell-Doppelklick bleibt idempotent",()=>{const before=warehouse.stock.packaging.bottles;assert(planner.startQueued(fillJob.id,5001)===false&&warehouse.stock.packaging.bottles===before,"Abfuellung wurde doppelt gestartet");});
 check("25 kompletter Smoke-Test endet mit Fertigware",()=>{planner.advance(fillJob.finishAt);assert(fillJob.status==="finished"&&warehouse.stock.finished.regression_pils_033===304,"Smoke-Test erzeugte keine korrekte Fertigware");});
 console.log("✅ OPERATIONAL-SUPPLY-CHAIN-REGRESSION 25/25 ERFOLGREICH",{checks});return{success:true,checks};
}