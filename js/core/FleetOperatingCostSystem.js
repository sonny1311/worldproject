// WorldProject - laufende Fuhrparkkosten, Tank und Verschleiss
import { TruckTypes } from "./TruckTypes.js";

export class FleetOperatingCostSystem {
    getDefinition(vehicle) { return vehicle?.definition ?? TruckTypes[vehicle?.type] ?? null; }

    refuel(vehicle, liters=null, dieselPrice=1.65) {
        const def=this.getDefinition(vehicle);
        if(!vehicle || !def) return {success:false,reason:"Fahrzeugdaten fehlen"};
        const capacity=Number(def.fuelTankCapacityLiters)||0;
        const current=Math.max(Number(vehicle.fuelLiters)||0,0);
        const wanted=liters===null ? capacity-current : Math.max(Number(liters)||0,0);
        const filled=Math.min(wanted,Math.max(capacity-current,0));
        vehicle.status="refueling";
        vehicle.fuelLiters=current+filled;
        vehicle.status="available";
        return {success:true,liters:filled,cost:filled*dieselPrice,fuelAfter:vehicle.fuelLiters,capacity};
    }

    calculateTrip(vehicle, distanceKm, dieselPrice = 1.65) {
        if (!vehicle) return { success:false, reason:"Fahrzeug fehlt" };
        const def = this.getDefinition(vehicle);
        if (!def) return { success:false, reason:"Fahrzeugdaten fehlen" };
        if (["workshop","workshop_required"].includes(vehicle.status)) return {success:false,reason:"Fahrzeug ist nicht einsatzbereit"};

        const km = Math.max(Number(distanceKm) || 0, 0);
        const consumption = Number(def.consumptionPer100Km) || 0;
        const liters = km / 100 * consumption;
        const capacity=Number(def.fuelTankCapacityLiters)||0;
        let refuelCost=0;
        let refueledLiters=0;
        const currentFuel=typeof vehicle.fuelLiters==="number"?vehicle.fuelLiters:capacity;
        if(currentFuel<liters){
            const r=this.refuel(vehicle,null,dieselPrice);
            if(r.success){refuelCost=r.cost;refueledLiters=r.liters;}
        }

        vehicle.status="driving";
        const fuelCost = liters * dieselPrice;
        const maintenancePerKm = vehicle.type === "semi40" ? 0.20 : vehicle.type === "truck18" ? 0.16 : 0.11;
        const maintenanceCost = km * maintenancePerKm;
        const wearPercent = km / 2500;
        vehicle.odometerKm = (Number(vehicle.odometerKm) || 0) + km;
        vehicle.condition = Math.max((Number(vehicle.condition) || 100) - wearPercent, 0);
        vehicle.fuelLiters=Math.max((Number(vehicle.fuelLiters)||0)-liters,0);

        if(vehicle.condition<=25) vehicle.status="workshop_required";
        else if(vehicle.condition<=45) vehicle.status="maintenance_due";
        else vehicle.status="available";

        return { success:true,distanceKm:km,liters,fuelCost,refueledLiters,refuelCost,maintenanceCost,wearPercent,totalOperatingCost:fuelCost+maintenanceCost+refuelCost,conditionAfter:vehicle.condition,odometerKm:vehicle.odometerKm,fuelAfter:vehicle.fuelLiters,statusAfter:vehicle.status };
    }

    service(vehicle, company, cost=1200) {
        if(!vehicle) return {success:false,reason:"Fahrzeug fehlt"};
        if((Number(company?.money)||0)<cost) return {success:false,reason:"Nicht genug Geld"};
        company.money-=cost; vehicle.status="workshop"; vehicle.condition=100; vehicle.status="available";
        return {success:true,cost,conditionAfter:100,statusAfter:"available"};
    }

    calculateMonthly(vehicle) {
        if (!vehicle) return { success:false, reason:"Fahrzeug fehlt" };
        const type = vehicle.type;
        const insurance = type === "semi40" ? 850 : type === "truck18" ? 540 : type === "truck12" ? 420 : 220;
        const tax = type === "semi40" ? 180 : type === "truck18" ? 120 : 80;
        const lease = vehicle.ownership === "leased" ? Number(vehicle.monthlyLeaseRate) || 0 : 0;
        return { success:true, insurance, tax, lease, total: insurance + tax + lease };
    }
}

export function runFleetOperatingCostTest() {
    const vehicle = { type:"truck18", definition:TruckTypes.truck18, odometerKm:0, condition:100, fuelLiters:20, ownership:"owned",status:"available" };
    const company={money:10000};
    const system = new FleetOperatingCostSystem();
    const trip = system.calculateTrip(vehicle,500);
    const monthly = system.calculateMonthly(vehicle);
    const service=system.service(vehicle,company,500);
    const success = trip.success && trip.liters === 120 && trip.refueledLiters>0 && monthly.total > 0 && service.success && vehicle.condition===100;
    console[success ? "log" : "error"](success ? "✅ FUHRPARKKOSTEN-TEST ERFOLGREICH" : "❌ FUHRPARKKOSTEN-TEST FEHLGESCHLAGEN",{ trip, monthly,service });
    return { success, trip, monthly,service };
}