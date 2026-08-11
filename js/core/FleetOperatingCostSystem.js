// WorldProject - laufende Fuhrparkkosten und Verschleiss
import { TruckTypes } from "./TruckTypes.js";

export class FleetOperatingCostSystem {
    calculateTrip(vehicle, distanceKm, dieselPrice = 1.65) {
        if (!vehicle) return { success:false, reason:"Fahrzeug fehlt" };
        const def = vehicle.definition ?? TruckTypes[vehicle.type];
        if (!def) return { success:false, reason:"Fahrzeugdaten fehlen" };

        const km = Math.max(Number(distanceKm) || 0, 0);
        const consumption = Number(def.consumptionPer100Km) || 0;
        const liters = km / 100 * consumption;
        const fuelCost = liters * dieselPrice;
        const maintenancePerKm = vehicle.type === "semi40" ? 0.20 : vehicle.type === "truck18" ? 0.16 : 0.11;
        const maintenanceCost = km * maintenancePerKm;
        const wearPercent = km / 2500;

        vehicle.odometerKm = (Number(vehicle.odometerKm) || 0) + km;
        vehicle.condition = Math.max((Number(vehicle.condition) || 100) - wearPercent, 0);

        if (typeof vehicle.fuelLiters === "number") {
            vehicle.fuelLiters = Math.max(vehicle.fuelLiters - liters, 0);
        }

        return {
            success:true,
            distanceKm: km,
            liters,
            fuelCost,
            maintenanceCost,
            wearPercent,
            totalOperatingCost: fuelCost + maintenanceCost,
            conditionAfter: vehicle.condition,
            odometerKm: vehicle.odometerKm
        };
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
    const vehicle = { type:"truck18", definition:TruckTypes.truck18, odometerKm:0, condition:100, fuelLiters:300, ownership:"owned" };
    const system = new FleetOperatingCostSystem();
    const trip = system.calculateTrip(vehicle,500);
    const monthly = system.calculateMonthly(vehicle);
    const success = trip.success && trip.liters === 120 && trip.totalOperatingCost > trip.fuelCost && monthly.total > 0 && vehicle.condition < 100;
    console[success ? "log" : "error"](
        success ? "✅ FUHRPARKKOSTEN-TEST ERFOLGREICH" : "❌ FUHRPARKKOSTEN-TEST FEHLGESCHLAGEN",
        { trip, monthly }
    );
    return { success, trip, monthly };
}
