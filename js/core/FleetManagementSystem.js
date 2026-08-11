// WorldProject - Fuhrpark und Fahrzeugbesitz
import { Truck } from "./Truck.js";
import { TruckTypes } from "./TruckTypes.js";

export class FleetManagementSystem {
    ensureCompany(company) {
        if (!Array.isArray(company.vehicles)) company.vehicles = [];
        return company.vehicles;
    }

    buyVehicle(company, vehicleType, { price = 0, name = null, licensePlate = null } = {}) {
        const def = TruckTypes[vehicleType];
        if (!def) return { success:false, reason:"Unbekannter Fahrzeugtyp" };
        if ((Number(company.money)||0) < price) return { success:false, reason:"Nicht genug Geld" };
        const truck = new Truck(vehicleType, { name: name || def.name });
        truck.licensePlate = licensePlate || `WP-${Math.floor(1000 + Math.random()*9000)}`;
        truck.odometerKm = 0;
        truck.fuelLiters = Number(def.fuelTankCapacityLiters)||0;
        truck.condition = 100;
        truck.ownership = "owned";
        truck.purchasePrice = price;
        truck.status = "available";
        this.ensureCompany(company).push(truck);
        company.money -= price;
        return { success:true, vehicle:truck };
    }

    leaseVehicle(company, vehicleType, { monthlyRate = 0, name = null } = {}) {
        const result = this.buyVehicle(company, vehicleType, { price:0, name });
        if (!result.success) return result;
        result.vehicle.ownership = "leased";
        result.vehicle.monthlyLeaseRate = monthlyRate;
        return result;
    }

    getAvailable(company, vehicleType = null) {
        return this.ensureCompany(company).filter(v => v.status === "available" && (!vehicleType || v.type === vehicleType));
    }

    reserve(company, vehicleType) {
        const vehicle = this.getAvailable(company, vehicleType)[0];
        if (!vehicle) return { success:false, reason:"Kein eigenes freies Fahrzeug dieser Klasse" };
        vehicle.status = "reserved";
        return { success:true, vehicle };
    }

    release(vehicle) { if (vehicle) vehicle.status = "available"; }
    addDistance(vehicle, km) { if (vehicle) vehicle.odometerKm = (Number(vehicle.odometerKm)||0) + Math.max(Number(km)||0,0); }
}

export function runFleetManagementTest() {
    const company={money:100000,vehicles:[]};
    const fleet=new FleetManagementSystem();
    const bought=fleet.buyVehicle(company,"truck18",{price:50000,licensePlate:"WP-1800"});
    const reserved=fleet.reserve(company,"truck18");
    const blocked=fleet.reserve(company,"truck18");
    const success=bought.success && reserved.success && !blocked.success && company.money===50000 && reserved.vehicle.fuelLiters===300;
    console[success?"log":"error"](success?"✅ FUHRPARK-TEST ERFOLGREICH":"❌ FUHRPARK-TEST FEHLGESCHLAGEN",{bought,reserved,blocked});
    return {success};
}