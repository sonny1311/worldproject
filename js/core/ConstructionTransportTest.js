// ============================================
// ConstructionTransportTest.js
// WorldProject
//
// Integrationstest:
// Gebäude → Baustelle → LKW → Transport
// ============================================

import {
    Building
} from "./Building.js";

import {
    BuildingTypes
} from "./BuildingTypes.js";

import {
    Construction
} from "./Construction.js";

import {
    Truck
} from "./Truck.js";

import {
    TransportOptimization
} from "./TransportOptimization.js";
import {
    TransportCostCalculator
} from "./TransportCostCalculator.js";


// ============================================
// Test starten
// ============================================

export function runConstructionTransportTest() {

    console.log(
        "======================================"
    );

    console.log(
        "BAUSTELLEN-/TRANSPORTTEST"
    );

    console.log(
        "======================================"
    );


    // ========================================
    // 1. Gebäudetyp automatisch auswählen
    // ========================================

    const buildingType =
        Object.keys(
            BuildingTypes
        )[0];


    if (!buildingType) {

        console.error(
            "❌ Kein Gebäudetyp vorhanden."
        );

        return false;
    }


    console.log(
        "Gebäudetyp:",
        buildingType
    );


    // ========================================
    // 2. Gebäude erzeugen
    // ========================================

    const building =
        new Building(

            buildingType,

            "Testgebäude",

            100
        );


    console.log(
        "✅ Gebäude erzeugt:",
        building
    );


    // ========================================
    // 3. Baustelle erzeugen
    // ========================================

    const construction =
        new Construction(

            building,

            30
        );


    console.log(
        "✅ Baustelle erzeugt"
    );


    console.log(
        "Baustellenstatus:",
        construction.status
    );


    console.log(
        "Materialbedarf:",
        construction.materials.required
    );


    console.log(
        "Fehlendes Material:",
        construction.materials.missing
    );


    // ========================================
    // 4. Echten 40-t-Sattelzug erzeugen
    // ========================================

    const truck =
        new Truck(
            "semi40",
            {
                name:
                    "Test 40-Tonner"
            }
        );


    console.log(
        "======================================"
    );

    console.log(
        "LKW-DATEN"
    );


    console.log(
        "LKW:",
        truck.name
    );


    console.log(
        "Zulässiges Gesamtgewicht:",
        truck.capacity.maxGrossWeightKg,
        "kg"
    );


    console.log(
        "Leergewicht:",
        truck.capacity.emptyWeightKg,
        "kg"
    );


    console.log(
        "Nutzlast:",
        truck.getMaxPayloadKg(),
        "kg"
    );


    console.log(
        "Palettenplätze:",
        truck.capacity.maxPallets
    );


    // ========================================
    // 5. Grundwerte prüfen
    // ========================================

    const payloadCorrect =
        truck.getMaxPayloadKg() ===
        25000;


    const palletsCorrect =
        truck.capacity.maxPallets ===
        33;


    if (
        payloadCorrect
    ) {

        console.log(
            "✅ Nutzlast korrekt: 25.000 kg"
        );

    } else {

        console.error(
            "❌ Nutzlast falsch:",
            truck.getMaxPayloadKg()
        );
    }


    if (
        palletsCorrect
    ) {

        console.log(
            "✅ Palettenkapazität korrekt: 33"
        );

    } else {

        console.error(
            "❌ Palettenkapazität falsch:",
            truck.capacity.maxPallets
        );
    }


    // ========================================
    // 6. Test: 33 leichte Paletten
    // ========================================

    const thirtyThreePallets =
        truck.canLoad({

            weightKg:
                20000,

            volumeM3:
                60,

            pallets:
                33
        });


    console.log(
        "33 Paletten / 20 t:",
        thirtyThreePallets
            ? "✅ passt"
            : "❌ passt nicht"
    );


    // ========================================
    // 7. Test: 34 Paletten
    // ========================================

    const thirtyFourPallets =
        truck.canLoad({

            weightKg:
                20000,

            volumeM3:
                60,

            pallets:
                34
        });


    console.log(
        "34 Paletten:",
        !thirtyFourPallets
            ? "✅ korrekt abgelehnt"
            : "❌ FEHLER: angenommen"
    );


    // ========================================
    // 8. Test: Gewicht über Nutzlast
    // ========================================

    const overweight =
        truck.canLoad({

            weightKg:
                26000,

            volumeM3:
                50,

            pallets:
                20
        });


    console.log(
        "26 t Ladung:",
        !overweight
            ? "✅ korrekt abgelehnt"
            : "❌ FEHLER: angenommen"
    );


    // ========================================
    // 9. Testladung tatsächlich laden
    // ========================================

    const loadResult =
        truck.loadCargo({

            id:
                "testCargo",

            name:
                "Testladung",

            amount:
                33,

            unit:
                "Paletten",

            weightKg:
                20000,

            volumeM3:
                60,

            pallets:
                33
        });


    console.log(
        "Beladung:",
        loadResult.success
            ? "✅ erfolgreich"
            : "❌ fehlgeschlagen"
    );


    console.log(
        "Aktuelles Gesamtgewicht:",
        truck.getCurrentGrossWeightKg(),
        "kg"
    );


    // ========================================
    // 10. LKW entladen
    // ========================================

    const unloaded =
        truck.unloadAll();


    console.log(
        "Entladen:",
        unloaded
    );


    console.log(
        "Ladungsgewicht danach:",
        truck.cargo.weightKg,
        "kg"
    );


    // ========================================
    // 11. Baustellen-Materialeingang testen
    // ========================================

    const materialIds =
        Object.keys(
            construction.materials.required
        );


    if (
        materialIds.length > 0
    ) {

        const materialId =
            materialIds[0];


        const amount =
            construction.materials.required[
                materialId
            ];


        const added =
            construction.addMaterial(

                materialId,

                amount
            );


        console.log(
            "======================================"
        );


        console.log(
            "MATERIALTEST"
        );


        console.log(
            "Material:",
            materialId
        );


        console.log(
            "Menge:",
            amount
        );


        console.log(
            "Material hinzugefügt:",
            added
                ? "✅"
                : "❌"
        );


        console.log(
            "Auf Baustelle vorhanden:",
            construction.materials
                .available[
                    materialId
                ]
        );

    } else {

        console.warn(
            "⚠️ Gebäudetyp besitzt keinen Materialbedarf."
        );
    }


    // ========================================
    // Ergebnis
    // ========================================

    console.log(
        "======================================"
    );


    const success =

        payloadCorrect &&

        palletsCorrect &&

        thirtyThreePallets &&

        !thirtyFourPallets &&

        !overweight &&

        loadResult.success &&

        truck.cargo.weightKg ===
            0;


    if (success) {

        console.log(
            "✅ GRUNDTEST ERFOLGREICH"
        );

    } else {

        console.error(
            "❌ GRUNDTEST FEHLGESCHLAGEN"
        );
    }


    console.log(
        "======================================"
    );


    // ============================================
    // GIGA-/SCHWERLAST-ERKENNUNGSTEST
    // ============================================

    console.log(
        "======================================"
    );

    console.log(
        "GIGA-/SCHWERLAST-ERKENNUNGSTEST"
    );

    console.log(
        "======================================"
    );


    const testCompany = {

        coins:
            10,

        gigaTransportService:
            null
    };


    import("./GigaTransportService.js")
        .then(
            ({
                GigaTransportService
            }) => {

                testCompany.gigaTransportService =
                    new GigaTransportService(
                        testCompany
                    );


                // ====================================
                // 33 Paletten
                // ====================================

                const normalResult =
                    testCompany
                        .gigaTransportService
                        .evaluateTransport({

                            pallets:
                                33,

                            cargoWeightKg:
                                20000,

                            gigaEmptyWeightKg:
                                15000,

                            heavyEmptyWeightKg:
                                15000
                        });


                console.log(
                    "33 Paletten:",
                    normalResult.specialTransport
                        ? "❌ Spezialtransport angeboten"
                        : "✅ normaler LKW"
                );


                // ====================================
                // 34 Paletten
                // ====================================

                const giga34Result =
                    testCompany
                        .gigaTransportService
                        .evaluateTransport({

                            pallets:
                                34,

                            cargoWeightKg:
                                20000,

                            gigaEmptyWeightKg:
                                15000,

                            heavyEmptyWeightKg:
                                15000
                        });


                console.log(
                    "34 Paletten:",
                    giga34Result.service?.type ===
                        "giga"
                        ? "✅ Giga angeboten"
                        : "❌ Giga nicht erkannt"
                );


                // ====================================
                // 54 Paletten
                // ====================================

                const giga54Result =
                    testCompany
                        .gigaTransportService
                        .evaluateTransport({

                            pallets:
                                54,

                            cargoWeightKg:
                                24000,

                            gigaEmptyWeightKg:
                                15000,

                            heavyEmptyWeightKg:
                                15000
                        });


                console.log(
                    "54 Paletten:",
                    giga54Result.service?.type ===
                        "giga"
                        ? "✅ Giga angeboten"
                        : "❌ Giga nicht erkannt"
                );


                // ====================================
                // 55 Paletten
                // ====================================

                const giga55Result =
                    testCompany
                        .gigaTransportService
                        .evaluateTransport({

                            pallets:
                                55,

                            cargoWeightKg:
                                24000,

                            gigaEmptyWeightKg:
                                15000,

                            heavyEmptyWeightKg:
                                15000
                        });


                console.log(
                    "55 Paletten:",
                    giga55Result.specialTransport
                        ? "❌ Einzelfahrt fälschlich angeboten"
                        : "✅ keine einzelne Giga-Fahrt"
                );


                // ====================================
                // 45 t Gesamtgewicht
                // ====================================

                const heavyResult =
                    testCompany
                        .gigaTransportService
                        .evaluateTransport({

                            pallets:
                                20,

                            cargoWeightKg:
                                30000,

                            gigaEmptyWeightKg:
                                15000,

                            heavyEmptyWeightKg:
                                15000
                        });


                console.log(
                    "45 t Gesamtgewicht:",
                    heavyResult.service?.type ===
                        "heavy"
                        ? "✅ Schwerlast angeboten"
                        : "❌ Schwerlast nicht erkannt"
                );


                // ====================================
                // 60 t Gesamtgewicht
                // ====================================

                const heavy60Result =
                    testCompany
                        .gigaTransportService
                        .evaluateTransport({

                            pallets:
                                10,

                            cargoWeightKg:
                                45000,

                            gigaEmptyWeightKg:
                                15000,

                            heavyEmptyWeightKg:
                                15000
                        });


                console.log(
                    "60 t Gesamtgewicht:",
                    heavy60Result.service?.type ===
                        "heavy"
                        ? "✅ Schwerlast angeboten"
                        : "❌ Schwerlast nicht erkannt"
                );


                // ====================================
                // 61 t Gesamtgewicht
                // ====================================

                const heavy61Result =
                    testCompany
                        .gigaTransportService
                        .evaluateTransport({

                            pallets:
                                10,

                            cargoWeightKg:
                                46000,

                            gigaEmptyWeightKg:
                                15000,

                            heavyEmptyWeightKg:
                                15000
                        });


                console.log(
                    "61 t Gesamtgewicht:",
                    heavy61Result.specialTransport
                        ? "❌ Schwerlast fälschlich angeboten"
                        : "✅ über 60 t abgelehnt"
                );


                console.log(
                    "======================================"
                );
            }
        );


    // ======================================
    // GIGA-OPTIMIERUNG – 80 PALETTEN
    // ======================================

    console.log(
        "======================================"
    );

    console.log(
        "GIGA-OPTIMIERUNG – 80 PALETTEN"
    );

    console.log(
        "======================================"
    );


    const transportOptimization =
        new TransportOptimization();


    const giga80Test =
        transportOptimization.optimize({

            pallets:
                80,

            totalWeightKg:
                20000,

            costs: {

                fuelCost:
                    100,

                driverCost:
                    80,

                tollCost:
                    40,

                maintenanceCost:
                    0,

                vehicleCost:
                    0,

                loadingCost:
                    0,

                unloadingCost:
                    0,

                otherCost:
                    0
            }
        });


    console.log(
        "80 Paletten Ergebnis:",
        giga80Test
    );


    console.log(
        "Empfehlung:",
        transportOptimization
            .createRecommendationText(
                giga80Test
            )
    );


    console.log(
        "======================================"
    );


    // ============================================
    // ECHTER TRANSPORTJOB-TEST – 80 PALETTEN
    // ============================================

    console.log(
        "======================================"
    );

    console.log(
        "ECHTER TRANSPORTJOB-TEST – 80 PALETTEN"
    );

    console.log(
        "======================================"
    );


    import("./ConstructionMaterialOrder.js")
        .then(
            ({
                ConstructionMaterialOrder
            }) => {

                const testProposal = {

                    purchases: [

                        {
                            materialId:
                                "bricks",

                            name:
                                "Testziegel",

                            orderAmount:
                                24000,

                            unit:
                                "Stück",

                            supplierId:
                                "test-supplier",

                            supplierName:
                                "Testlieferant",

                            distanceKm:
                                100,

                            pricePerUnit:
                                0.50,

                            materialCost:
                                12000,

                            transportCost:
                                0,

                            weightKg:
                                20000,

                            offer: {

                                availableAmount:
                                    24000
                            }
                        }
                    ]
                };


                const testOrder =
                    new ConstructionMaterialOrder({

                        construction,

                        company:
                            testCompany,

                        proposal:
                            testProposal
                    });


                console.log(
                    "Testbestellung erzeugt:",
                    testOrder
                );


                const reservationResult =
                    testOrder.reserveMaterials();


                console.log(
                    "Reservierung:",
                    reservationResult.success
                        ? "✅ erfolgreich"
                        : "❌ fehlgeschlagen",
                    reservationResult
                );


                if (
                    !reservationResult.success
                ) {

                    console.error(
                        "❌ Test abgebrochen: Reservierung fehlgeschlagen."
                    );

                    return;
                }


                const planningResult =
                    testOrder.createTransportJobs(
                        truck
                    );


                console.log(
                    "Transportplanung:",
                    planningResult
                );


                if (
                    !planningResult.success
                ) {

                    console.error(
                        "❌ Transportplanung fehlgeschlagen:",
                        planningResult.reason
                    );

                    return;
                }


                const jobs =
                    planningResult.transportJobs;


                const gigaJobs =
                    jobs.filter(
                        job =>
                            job.transportType ===
                            "giga"
                    );


                const normalJobs =
                    jobs.filter(
                        job =>
                            job.transportType ===
                            "normal"
                    );


                const gigaPallets =
                    gigaJobs.reduce(
                        (
                            total,
                            job
                        ) =>
                            total +
                            job.pallets,
                        0
                    );


                const normalPallets =
                    normalJobs.reduce(
                        (
                            total,
                            job
                        ) =>
                            total +
                            job.pallets,
                        0
                    );


                const totalCoins =
                    jobs.reduce(
                        (
                            total,
                            job
                        ) =>
                            total +
                            (
                                job.coinCost ??
                                0
                            ),
                        0
                    );


                const jobCountCorrect =
                    jobs.length ===
                    2;


                const gigaCountCorrect =
                    gigaJobs.length ===
                    1;


                const normalCountCorrect =
                    normalJobs.length ===
                    1;


                const gigaPalletsCorrect =
                    gigaPallets ===
                    54;


                const normalPalletsCorrect =
                    normalPallets ===
                    26;


                const coinsCorrect =
                    totalCoins ===
                    1;


                const savedTripsCorrect =
                    planningResult.savedTrips ===
                    1;


                console.log(
                    "Anzahl Transportjobs:",
                    jobs.length,
                    jobCountCorrect
                        ? "✅"
                        : "❌"
                );


                console.log(
                    "Giga-Fahrten:",
                    gigaJobs.length,
                    gigaCountCorrect
                        ? "✅"
                        : "❌"
                );


                console.log(
                    "Normale Fahrten:",
                    normalJobs.length,
                    normalCountCorrect
                        ? "✅"
                        : "❌"
                );


                console.log(
                    "Paletten im Giga:",
                    gigaPallets,
                    gigaPalletsCorrect
                        ? "✅"
                        : "❌ SOLL: 54"
                );


                console.log(
                    "Paletten normal:",
                    normalPallets,
                    normalPalletsCorrect
                        ? "✅"
                        : "❌ SOLL: 26"
                );


                console.log(
                    "Benötigte Coins:",
                    totalCoins,
                    coinsCorrect
                        ? "✅"
                        : "❌ SOLL: 1"
                );


                console.log(
                    "Eingesparte Fahrten:",
                    planningResult.savedTrips,
                    savedTripsCorrect
                        ? "✅"
                        : "❌ SOLL: 1"
                );


                const realTransportTestSuccess =

                    jobCountCorrect &&

                    gigaCountCorrect &&

                    normalCountCorrect &&

                    gigaPalletsCorrect &&

                    normalPalletsCorrect &&

                    coinsCorrect &&

                    savedTripsCorrect;


                console.log(
                    "======================================"
                );


                if (
                    realTransportTestSuccess
                ) {

                    console.log(
                        "✅ ECHTER 80-PALETTEN-TRANSPORTTEST ERFOLGREICH"
                    );

                    console.log(
                        "🚛 54 Paletten Giga + 26 Paletten normal"
                    );

                    console.log(
                        "🪙 1 Coin erforderlich"
                    );

                    console.log(
                        "💰 1 normale Fahrt eingespart"
                    );
                }

                else {

                    console.error(
                        "❌ ECHTER 80-PALETTEN-TRANSPORTTEST FEHLGESCHLAGEN"
                    );


                    console.log(
                        "Transportjobs:",
                        jobs
                    );
                }


                console.log(
                    "======================================"
                );
            }
        )
        .catch(
            error => {

                console.error(
                    "❌ Fehler beim echten Transportjob-Test:",
                    error
                );
            }
        );


    // ============================================
    // COIN-BESTÄTIGUNGSTEST
    // ============================================

    console.log(
        "======================================"
    );

    console.log(
        "COIN-BESTÄTIGUNGSTEST"
    );

    console.log(
        "======================================"
    );


    import("./GigaTransportService.js")
        .then(
            ({
                GigaTransportService
            }) => {

                const companyNoCoins = {
                    coins:
                        0
                };


                const serviceNoCoins =
                    new GigaTransportService(
                        companyNoCoins
                    );


                const noCoinResult =
                    serviceNoCoins
                        .confirmSpecialTransport({

                            serviceType:
                                "giga",

                            numberOfTransports:
                                2
                        });


                console.log(
                    "0 Coins / 2 Gigas:",
                    noCoinResult
                );


                console.log(
                    "Coinangebot:",
                    (
                        noCoinResult
                            .reason ===
                            "insufficient_coins" &&

                        noCoinResult
                            .missingCoins ===
                            2 &&

                        noCoinResult
                            .minimumCoinPackage ===
                            50 &&

                        noCoinResult
                            .showCoinOffer ===
                            true
                    )

                        ? "✅ korrekt"

                        : "❌ fehlerhaft"
                );


                console.log(
                    "Coins nach fehlgeschlagener Bestätigung:",
                    companyNoCoins.coins ===
                        0
                        ? "✅ 0 Coins"
                        : "❌ Coins wurden verändert"
                );


                const companyWithCoins = {
                    coins:
                        10
                };


                const serviceWithCoins =
                    new GigaTransportService(
                        companyWithCoins
                    );


                const paidResult =
                    serviceWithCoins
                        .confirmSpecialTransport({

                            serviceType:
                                "giga",

                            numberOfTransports:
                                2
                        });


                console.log(
                    "10 Coins / 2 Gigas:",
                    paidResult
                );


                console.log(
                    "Coinabbuchung:",
                    (
                        paidResult
                            .success ===
                            true &&

                        paidResult
                            .coinsSpent ===
                            2 &&

                        companyWithCoins
                            .coins ===
                            8
                    )

                        ? "✅ 2 Coins abgebucht, 8 übrig"

                        : "❌ Abbuchung falsch"
                );


                console.log(
                    "======================================"
                );
            }
        )
        .catch(
            error => {

                console.error(
                    "❌ Fehler beim Coin-Bestätigungstest:",
                    error
                );
            }
        );


    // ============================================
    // ECHTER BESTÄTIGUNGSTEST AM TRANSPORTAUFTRAG
    // ============================================

    console.log(
        "======================================"
    );

    console.log(
        "ECHTER GIGA-BESTÄTIGUNGSTEST"
    );

    console.log(
        "======================================"
    );


    import("./ConstructionMaterialOrder.js")
        .then(
            ({
                ConstructionMaterialOrder
            }) => {

                const createTestProposal =
                    () => ({

                        purchases: [

                            {
                                materialId:
                                    "bricks",

                                name:
                                    "Testziegel",

                                orderAmount:
                                    24000,

                                unit:
                                    "Stück",

                                supplierId:
                                    "test-supplier",

                                supplierName:
                                    "Testlieferant",

                                distanceKm:
                                    100,

                                pricePerUnit:
                                    0.50,

                                materialCost:
                                    12000,

                                transportCost:
                                    0,

                                weightKg:
                                    20000,

                                offer: {

                                    availableAmount:
                                        24000
                                }
                            }
                        ]
                    });


                // ========================================
                // FALL A:
                // 10 Coins -> 1 Giga bestätigen
                // ========================================

                const companyTenCoins = {

                    coins:
                        10,

                    gigaTransportService:
                        null
                };


                const orderTenCoins =
                    new ConstructionMaterialOrder({

                        construction,

                        company:
                            companyTenCoins,

                        proposal:
                            createTestProposal()
                    });


                const reserveTen =
                    orderTenCoins
                        .reserveMaterials();


                const planTen =
                    reserveTen.success

                        ? orderTenCoins
                            .createTransportJobs(
                                truck
                            )

                        : {
                            success:
                                false
                        };


                const coinsBeforeTen =
                    companyTenCoins.coins;


                const confirmTen =
                    planTen.success

                        ? orderTenCoins
                            .confirmSpecialTransports()

                        : {
                            success:
                                false,

                            confirmed:
                                false
                        };


                const gigaJobTen =
                    orderTenCoins
                        .transportJobs
                        .find(
                            job =>
                                job.transportType ===
                                "giga"
                        );


                const tenCoinsTestSuccess =

                    reserveTen.success ===
                        true &&

                    planTen.success ===
                        true &&

                    planTen.gigaTrips ===
                        1 &&

                    coinsBeforeTen ===
                        10 &&

                    confirmTen.success ===
                        true &&

                    confirmTen.confirmed ===
                        true &&

                    confirmTen.coinsSpent ===
                        1 &&

                    companyTenCoins.coins ===
                        9 &&

                    gigaJobTen
                        ?.specialTransportConfirmed ===
                        true;


                console.log(
                    "10 Coins -> echter Auftrag:",
                    tenCoinsTestSuccess
                        ? "✅ 1 Coin abgebucht, 9 übrig, Giga freigegeben"
                        : "❌ Fehler",
                    {
                        reserveTen,

                        planTen,

                        confirmTen,

                        coinsBefore:
                            coinsBeforeTen,

                        coinsAfter:
                            companyTenCoins.coins,

                        gigaJob:
                            gigaJobTen
                    }
                );


                // ========================================
                // FALL B:
                // 0 Coins -> keine Abbuchung,
                // 50-Coin-Angebot
                // ========================================

                const companyZeroCoins = {

                    coins:
                        0,

                    gigaTransportService:
                        null
                };


                const orderZeroCoins =
                    new ConstructionMaterialOrder({

                        construction,

                        company:
                            companyZeroCoins,

                        proposal:
                            createTestProposal()
                    });


                const reserveZero =
                    orderZeroCoins
                        .reserveMaterials();


                const planZero =
                    reserveZero.success

                        ? orderZeroCoins
                            .createTransportJobs(
                                truck
                            )

                        : {
                            success:
                                false
                        };


                const confirmZero =
                    planZero.success

                        ? orderZeroCoins
                            .confirmSpecialTransports()

                        : {
                            success:
                                false,

                            confirmed:
                                false
                        };


                const gigaJobZero =
                    orderZeroCoins
                        .transportJobs
                        .find(
                            job =>
                                job.transportType ===
                                "giga"
                        );


                const zeroCoinsTestSuccess =

                    reserveZero.success ===
                        true &&

                    planZero.success ===
                        true &&

                    planZero.gigaTrips ===
                        1 &&

                    confirmZero.success ===
                        false &&

                    confirmZero.confirmed ===
                        false &&

                    confirmZero.reason ===
                        "insufficient_coins" &&

                    confirmZero.coinsRequired ===
                        1 &&

                    confirmZero.missingCoins ===
                        1 &&

                    confirmZero.minimumCoinPackage ===
                        50 &&

                    confirmZero.showCoinOffer ===
                        true &&

                    companyZeroCoins.coins ===
                        0 &&

                    gigaJobZero
                        ?.specialTransportConfirmed !==
                        true;


                console.log(
                    "0 Coins -> echter Auftrag:",
                    zeroCoinsTestSuccess
                        ? "✅ keine Abbuchung, 50-Coin-Angebot, Giga nicht freigegeben"
                        : "❌ Fehler",
                    {
                        reserveZero,

                        planZero,

                        confirmZero,

                        coinsAfter:
                            companyZeroCoins.coins,

                        gigaJob:
                            gigaJobZero
                    }
                );


                console.log(
                    "======================================"
                );


                if (
                    tenCoinsTestSuccess &&
                    zeroCoinsTestSuccess
                ) {

                    console.log(
                        "✅ ECHTER GIGA-BESTÄTIGUNGSTEST ERFOLGREICH"
                    );
                }

                else {

                    console.error(
                        "❌ ECHTER GIGA-BESTÄTIGUNGSTEST FEHLGESCHLAGEN"
                    );
                }


                console.log(
                    "======================================"
                );
            }
        )
        .catch(
            error => {

                console.error(
                    "❌ Fehler beim echten Giga-Bestätigungstest:",
                    error
                );
            }
        );

    // ============================================
    // TRANSPORTKOSTEN-TEST – 80 PALETTEN
    //
    // Normal:
    // 3 normale Sattelzüge
    //
    // Optimiert:
    // 1 Giga + 1 normaler Sattelzug
    //
    // Entfernung:
    // 100 km einfach
    //
    // Coinbedarf:
    // 1
    // ============================================

    console.log(
        "======================================"
    );

    console.log(
        "TRANSPORTKOSTEN-TEST – 80 PALETTEN"
    );

    console.log(
        "======================================"
    );


    const transportCostCalculator =
        new TransportCostCalculator();


    const transportCostComparison =
        transportCostCalculator
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
                    1,

                normalConsumptionPer100Km:
                    30
            });


    console.log(
        "Normale Variante:",
        transportCostComparison.normal
    );


    console.log(
        "Giga-Variante:",
        transportCostComparison.optimized
    );


    console.log(
        "Normale Transportkosten:",
        transportCostCalculator.formatMoney(
            transportCostComparison
                .normal
                .totalCost
        ),
        "€"
    );


    console.log(
        "Giga-Transportkosten:",
        transportCostCalculator.formatMoney(
            transportCostComparison
                .optimized
                .totalCost
        ),
        "€"
    );


    console.log(
        "Ersparnis:",
        transportCostCalculator.formatMoney(
            transportCostComparison
                .savings
        ),
        "€"
    );


    console.log(
        "Ersparnis in Prozent:",
        transportCostComparison
            .savingsPercent
            .toFixed(
                2
            ),
        "%"
    );


    console.log(
        "Eingesparte Fahrten:",
        transportCostComparison
            .savedTrips
    );


    console.log(
        "Coinbedarf:",
        transportCostComparison
            .coinsRequired
    );


    const transportCostTestSuccess =

        transportCostComparison
            .normal
            .trips ===
            3 &&

        transportCostComparison
            .optimized
            .gigaTrips ===
            1 &&

        transportCostComparison
            .optimized
            .normalTrips ===
            1 &&

        transportCostComparison
            .savedTrips ===
            1 &&

        transportCostComparison
            .coinsRequired ===
            1 &&

        transportCostComparison
            .savings >
            0;


    if (
        transportCostTestSuccess
    ) {

        console.log(
            "✅ TRANSPORTKOSTEN-TEST ERFOLGREICH"
        );
    }

    else {

        console.error(
            "❌ TRANSPORTKOSTEN-TEST FEHLGESCHLAGEN",
            transportCostComparison
        );
    }


    console.log(
        "======================================"
    );
    return {

        success,

        building,

        construction,

        truck
    };
}