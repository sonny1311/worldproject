// ============================================
// TransportVehicleCostIntegration.js
// WorldProject
//
// Verbindet die Giga-Kostenrechnung mit den
// echten Fahrzeugdaten aus TruckTypes.
//
// Der normale 40-t-Sattelzug liefert seinen
// Verbrauch aus TruckTypes.semi40.
// Der Giga-Aufschlag von +20 % bleibt in
// TransportCostCalculator.compareNormalAndGiga().
// Fahrer- und Mautkosten werden nicht erhoeht.
// ============================================

import {
    TruckTypes
} from "./TruckTypes.js";

import {
    TransportCostCalculator
} from "./TransportCostCalculator.js";


const originalCompareNormalAndGiga =
    TransportCostCalculator
        .prototype
        .compareNormalAndGiga;


if (
    typeof originalCompareNormalAndGiga ===
        "function" &&
    TransportCostCalculator
        .prototype
        .__vehicleDataIntegrationActive !==
        true
) {

    TransportCostCalculator
        .prototype
        .compareNormalAndGiga =
        function (
            options = {}
        ) {

            const vehicleConsumption =
                Number(
                    TruckTypes
                        ?.semi40
                        ?.consumptionPer100Km
                );


            const normalConsumptionPer100Km =
                Number.isFinite(
                    vehicleConsumption
                ) &&
                vehicleConsumption > 0

                    ? vehicleConsumption

                    : this.settings
                        .defaultConsumptionPer100Km;


            return originalCompareNormalAndGiga
                .call(
                    this,
                    {
                        ...options,
                        normalConsumptionPer100Km
                    }
                );
        };


    TransportCostCalculator
        .prototype
        .__vehicleDataIntegrationActive =
        true;
}


// ============================================
// Integrationstest
//
// Prueft:
// - normaler Sattelzug: 29 l/100 km
// - Giga: +20 % = 34,8 l/100 km
// - identische Fahrer-/Mautkosten je Fahrt
// ============================================

export function runTransportVehicleCostIntegrationTest() {

    const calculator =
        new TransportCostCalculator();


    const result =
        calculator
            .compareNormalAndGiga({

                distanceKm:
                    100,

                normalTrips:
                    3,

                gigaTrips:
                    1,

                optimizedNormalTrips:
                    1,

                coinsRequired:
                    1
            });


    const normalConsumption =
        result
            ?.normal
            ?.consumptionPer100Km;


    const gigaConsumption =
        result
            ?.optimized
            ?.gigaConsumptionPer100Km;


    const normalTrip =
        result
            ?.normal
            ?.tripDetails;


    const gigaTrip =
        result
            ?.optimized
            ?.gigaTripDetails;


    const success =

        normalConsumption ===
            29 &&

        Math.abs(
            gigaConsumption -
            34.8
        ) < 0.000001 &&

        normalTrip
            ?.driverCost ===
            gigaTrip
                ?.driverCost &&

        normalTrip
            ?.tollCost ===
            gigaTrip
                ?.tollCost &&

        result
            ?.coinsRequired ===
            1 &&

        result
            ?.savedTrips ===
            1 &&

        result
            ?.savings >
            0;


    if (
        success
    ) {

        console.log(
            "✅ FAHRZEUGDATEN-KOSTENTEST ERFOLGREICH",
            {
                normalConsumptionPer100Km:
                    normalConsumption,

                gigaConsumptionPer100Km:
                    gigaConsumption,

                driverCostUnchanged:
                    true,

                tollCostUnchanged:
                    true,

                savings:
                    result.savings
            }
        );
    }

    else {

        console.error(
            "❌ FAHRZEUGDATEN-KOSTENTEST FEHLGESCHLAGEN",
            {
                normalConsumption,
                gigaConsumption,
                normalTrip,
                gigaTrip,
                result
            }
        );
    }


    return {
        success,
        result
    };
}


runTransportVehicleCostIntegrationTest();
