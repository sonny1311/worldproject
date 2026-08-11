// ============================================
// TransportFuelTimeIntegration.js
// WorldProject
//
// Erweitert die bestehende Giga-Kostenrechnung
// um Reichweite, Tankstopps und Tankzeit.
// ============================================

import {
    TruckTypes
} from "./TruckTypes.js";

import {
    TransportCostCalculator
} from "./TransportCostCalculator.js";

import {
    VehicleFuelPlanner,
    runVehicleFuelPlannerTest
} from "./VehicleFuelPlanner.js";


const fuelPlanner =
    new VehicleFuelPlanner();


const originalCompareNormalAndGiga =
    TransportCostCalculator
        .prototype
        .compareNormalAndGiga;


if (
    typeof originalCompareNormalAndGiga === "function" &&
    TransportCostCalculator
        .prototype
        .__fuelTimeIntegrationActive !== true
) {

    TransportCostCalculator
        .prototype
        .compareNormalAndGiga =
        function (options = {}) {

            const normalConsumption =
                TruckTypes.semi40
                    .consumptionPer100Km;

            const result =
                originalCompareNormalAndGiga
                    .call(
                        this,
                        {
                            ...options,
                            normalConsumptionPer100Km:
                                normalConsumption
                        }
                    );

            const addFuelStopTime = (
                tripDetails,
                vehicleType
            ) => {

                if (!tripDetails) {
                    return null;
                }

                const fuelPlan =
                    fuelPlanner.calculate({
                        vehicleType,
                        distanceKm:
                            tripDetails.totalKm
                    });

                if (!fuelPlan.success) {
                    return fuelPlan;
                }

                const additionalDriverCost =
                    fuelPlan.refuelTimeHours *
                    this.settings.driverCostPerHour;

                tripDetails.refuelStops =
                    fuelPlan.refuelStops;

                tripDetails.refuelTimeHours =
                    fuelPlan.refuelTimeHours;

                tripDetails.refuelTimeMinutes =
                    fuelPlan.refuelTimeHours * 60;

                tripDetails.tankCapacityLiters =
                    fuelPlan.tankCapacityLiters;

                tripDetails.rangeKm =
                    fuelPlan.rangeKm;

                tripDetails.driverHours +=
                    fuelPlan.refuelTimeHours;

                tripDetails.driverCost +=
                    additionalDriverCost;

                tripDetails.totalCost +=
                    additionalDriverCost;

                return fuelPlan;
            };


            const normalFuelPlan =
                addFuelStopTime(
                    result.normal.tripDetails,
                    "semi40"
                );

            const gigaFuelPlan =
                addFuelStopTime(
                    result.optimized.gigaTripDetails,
                    "giga"
                );


            result.normal.costPerTrip =
                result.normal
                    .tripDetails
                    .totalCost;

            result.normal.totalCost =
                result.normal.costPerTrip *
                result.normal.trips;


            result.optimized.normalCost =
                result.normal.costPerTrip *
                result.optimized.normalTrips;

            result.optimized.gigaCost =
                result.optimized
                    .gigaTripDetails
                    .totalCost *
                result.optimized.gigaTrips;

            result.optimized.totalCost =
                result.optimized.normalCost +
                result.optimized.gigaCost;


            result.savings =
                result.normal.totalCost -
                result.optimized.totalCost;

            result.savingsPercent =
                result.normal.totalCost > 0
                    ? result.savings /
                        result.normal.totalCost *
                        100
                    : 0;

            result.recommended =
                result.savings > 0 &&
                result.optimized.gigaTrips > 0;

            result.normal.fuelPlan =
                normalFuelPlan;

            result.optimized.gigaFuelPlan =
                gigaFuelPlan;

            return result;
        };


    TransportCostCalculator
        .prototype
        .__fuelTimeIntegrationActive =
        true;
}


export function runTransportFuelTimeIntegrationTest() {

    const calculator =
        new TransportCostCalculator();

    const result =
        calculator.compareNormalAndGiga({
            distanceKm: 2000,
            normalTrips: 3,
            gigaTrips: 1,
            optimizedNormalTrips: 1,
            coinsRequired: 1
        });

    const success =
        result.normal
            .consumptionPer100Km === 29 &&
        Math.abs(
            result.optimized
                .gigaConsumptionPer100Km -
            34.8
        ) < 0.000001 &&
        result.normal
            .tripDetails
            .tankCapacityLiters === 1000 &&
        result.normal
            .tripDetails
            .refuelStops === 1 &&
        result.optimized
            .gigaTripDetails
            .refuelStops === 1 &&
        result.normal
            .tripDetails
            .refuelTimeMinutes === 18 &&
        result.optimized
            .gigaTripDetails
            .refuelTimeMinutes === 18;

    if (success) {
        console.log(
            "✅ TANKZEIT-KOSTENTEST ERFOLGREICH",
            {
                normal: result.normal.tripDetails,
                giga: result.optimized.gigaTripDetails
            }
        );
    } else {
        console.error(
            "❌ TANKZEIT-KOSTENTEST FEHLGESCHLAGEN",
            result
        );
    }

    return {
        success,
        result
    };
}


runVehicleFuelPlannerTest();
runTransportFuelTimeIntegrationTest();
