// ============================================
// VehicleFuelPlanner.js
// WorldProject
//
// Berechnet Reichweite, Tankstopps und Tankzeit
// fuer die Fahrzeugklassen aus TruckTypes.
// ============================================

import {
    TruckTypes
} from "./TruckTypes.js";


export class VehicleFuelPlanner {

    getDefinition(vehicleType) {
        return TruckTypes[vehicleType] ?? null;
    }


    calculate({
        vehicleType,
        distanceKm = 0,
        startingFuelLiters = null
    } = {}) {

        const definition =
            this.getDefinition(vehicleType);

        if (!definition) {
            return {
                success: false,
                reason: "Unbekannter Fahrzeugtyp"
            };
        }

        const consumptionPer100Km =
            Number(definition.consumptionPer100Km) || 0;

        const tankCapacityLiters =
            Number(definition.fuelTankCapacityLiters) || 0;

        const refuelTimeMinutes =
            Number(definition.refuelTimeMinutes) || 0;

        const safeDistanceKm =
            Math.max(Number(distanceKm) || 0, 0);

        const fuelNeededLiters =
            safeDistanceKm / 100 *
            consumptionPer100Km;

        const startFuel =
            startingFuelLiters === null
                ? tankCapacityLiters
                : Math.min(
                    Math.max(Number(startingFuelLiters) || 0, 0),
                    tankCapacityLiters
                );

        let refuelStops = 0;

        if (
            tankCapacityLiters > 0 &&
            fuelNeededLiters > startFuel
        ) {
            const additionalFuelNeeded =
                fuelNeededLiters - startFuel;

            refuelStops =
                Math.ceil(
                    additionalFuelNeeded /
                    tankCapacityLiters
                );
        }

        const refuelTimeHours =
            refuelStops *
            refuelTimeMinutes /
            60;

        const rangeKm =
            consumptionPer100Km > 0
                ? tankCapacityLiters /
                    consumptionPer100Km *
                    100
                : 0;

        return {
            success: true,
            vehicleType,
            vehicleName: definition.name,
            distanceKm: safeDistanceKm,
            consumptionPer100Km,
            tankCapacityLiters,
            startingFuelLiters: startFuel,
            fuelNeededLiters,
            rangeKm,
            refuelStops,
            refuelTimeMinutesPerStop: refuelTimeMinutes,
            refuelTimeHours
        };
    }
}


export function runVehicleFuelPlannerTest() {

    const planner =
        new VehicleFuelPlanner();

    const semi40 =
        planner.calculate({
            vehicleType: "semi40",
            distanceKm: 4000
        });

    const truck18 =
        planner.calculate({
            vehicleType: "truck18",
            distanceKm: 2000
        });

    const van =
        planner.calculate({
            vehicleType: "van",
            distanceKm: 1500
        });

    const success =
        semi40.success === true &&
        semi40.tankCapacityLiters === 1000 &&
        semi40.consumptionPer100Km === 29 &&
        semi40.refuelStops === 1 &&
        truck18.tankCapacityLiters === 300 &&
        truck18.refuelStops === 1 &&
        van.tankCapacityLiters === 100 &&
        van.refuelStops === 1;

    if (success) {
        console.log(
            "✅ FAHRZEUG-/TANKTEST ERFOLGREICH",
            {
                semi40,
                truck18,
                van
            }
        );
    } else {
        console.error(
            "❌ FAHRZEUG-/TANKTEST FEHLGESCHLAGEN",
            {
                semi40,
                truck18,
                van
            }
        );
    }

    return {
        success,
        semi40,
        truck18,
        van
    };
}
