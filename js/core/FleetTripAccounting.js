// WorldProject - reproduzierbare Fahrtenabrechnung fuer eigene Fahrzeuge.
import { TruckTypes } from "./TruckTypes.js";
import { VehicleFuelPlanner } from "./VehicleFuelPlanner.js";

function definitionFor(vehicle){return vehicle?.definition||TruckTypes[vehicle?.type||vehicle?.vehicleType]||null;}
function nonNegative(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:0;}
export function tripCapacity(vehicle,cargo={}){
 const def=definitionFor(vehicle)||vehicle||{},payload=Math.max(0,Number(def.maxGrossWeightKg||0)-Number(def.emptyWeightKg||0))||Number(def.payloadKg||vehicle?.payloadKg||0),pallets=Number(def.maxPallets??vehicle?.palletCapacity??0),volume=Number(def.maxVolumeM3??vehicle?.volumeM3??0),weight=nonNegative(cargo.weightKg),cp=nonNegative(cargo.pallets),cv=nonNegative(cargo.volumeM3);
 const byWeight=weight>0?(payload>0?Math.ceil(weight/payload):Infinity):1,byPallets=cp>0?(pallets>0?Math.ceil(cp/pallets):Infinity):1,byVolume=cv>0?(volume>0?Math.ceil(cv/volume):Infinity):1,trips=Math.max(1,byWeight,byPallets,byVolume);
 return{ok:Number.isFinite(trips),trips,payloadKg:payload,maxPallets:pallets,maxVolumeM3:volume,byWeight,byPallets,byVolume};
}
export function executeFleetTrip(vehicle,{cargo={},distanceKm=0,dieselPrice=1.65,wearPer1000Km=.8,allowAutoRefuel=true}={}){
 if(!vehicle)throw new Error("Fahrzeug fehlt");if(["broken","maintenance","workshop_required","sold"].includes(vehicle.status))throw new Error("Fahrzeug ist nicht einsatzbereit");
 const def=definitionFor(vehicle);if(!def)throw new Error("Fahrzeugdaten fehlen");const capacity=tripCapacity(vehicle,cargo);if(!capacity.ok)throw new Error("Ladung kann mit diesem Fahrzeug nicht transportiert werden");
 const oneWay=Math.max(0,Number(distanceKm)||0),totalKm=oneWay*2*capacity.trips,planner=new VehicleFuelPlanner(),fuel=planner.calculate({vehicleType:def.id,distanceKm:totalKm,startingFuelLiters:vehicle.fuelLiters??vehicle.currentFuelLiters??null});if(!fuel.success)throw new Error(fuel.reason||"Kraftstoffplanung fehlgeschlagen");
 const startFuel=Number(vehicle.fuelLiters??vehicle.currentFuelLiters??fuel.startingFuelLiters)||0;if(fuel.fuelNeededLiters>startFuel&&!allowAutoRefuel)throw new Error("Nicht genug Kraftstoff");
 const tank=Number(def.fuelTankCapacityLiters)||0,totalPurchased=Math.max(0,fuel.fuelNeededLiters-startFuel),finalFuel=Math.max(0,Math.min(tank,startFuel+totalPurchased-fuel.fuelNeededLiters));vehicle.fuelLiters=finalFuel;vehicle.currentFuelLiters=finalFuel;vehicle.odometerKm=(Number(vehicle.odometerKm)||0)+totalKm;vehicle.condition=Math.max(0,Math.min(100,Number(vehicle.condition??100)-totalKm/1000*Math.max(0,Number(wearPer1000Km)||0)));
 if(vehicle.condition<=25)vehicle.status="workshop_required";else vehicle.status="available";
 return{success:true,trips:capacity.trips,totalKm,fuelNeededLiters:fuel.fuelNeededLiters,fuelPurchasedLiters:totalPurchased,refuelStops:fuel.refuelStops,refuelTimeHours:fuel.refuelTimeHours,fuelCost:totalPurchased*Math.max(0,Number(dieselPrice)||0),condition:vehicle.condition,odometerKm:vehicle.odometerKm,remainingFuelLiters:finalFuel,capacity};
}
export function runFleetTripAccountingTest(){const vehicle={id:1,type:"truck75",status:"available",fuelLiters:20,odometerKm:1000,condition:100},trip=executeFleetTrip(vehicle,{cargo:{weightKg:5000,pallets:20,volumeM3:40},distanceKm:100,allowAutoRefuel:true});if(!trip.success||trip.trips!==2||trip.totalKm!==400||trip.fuelNeededLiters<=0||trip.fuelPurchasedLiters<=0||vehicle.odometerKm!==1400||!(vehicle.condition<100))throw new Error("Fahrtenabrechnung fehlerhaft");let blocked=false;try{executeFleetTrip({type:"truck75",status:"broken"},{distanceKm:10});}catch{blocked=true;}if(!blocked)throw new Error("Defektes Fahrzeug wurde zugelassen");let fuelBlocked=false;try{executeFleetTrip({type:"truck75",status:"available",fuelLiters:0},{distanceKm:100,allowAutoRefuel:false});}catch{fuelBlocked=true;}if(!fuelBlocked)throw new Error("Fahrt ohne Kraftstoff wurde zugelassen");console.log("✅ FLEET-TRIP-ACCOUNTING-TEST ERFOLGREICH");return{success:true};}
