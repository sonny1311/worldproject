// ============================================
// ConstructionMaterialOrder.js
// WorldProject
//
// Materialbestellung für Bauprojekte.
//
// Ablauf:
//
// Bauleiter bestätigt Einkauf
// ↓
// Bestellung wird erstellt
// ↓
// Material wird reserviert
// ↓
// Transportfahrten werden geplant
// ↓
// Material wird transportiert
// ↓
// Material kommt an der Baustelle an
// ↓
// ERST DANN ist es für den Bau verfügbar
//
// WICHTIG:
//
// - Material wird nicht teleportiert.
// - Bestellt = noch nicht verfügbar.
// - Unterwegs = noch nicht verfügbar.
// - Erst Lieferung = Baustellenbestand.
// - LKW-Nutzlast wird berücksichtigt.
// ============================================

import {
    CargoTypes
} from "./CargoTypes.js";
import {
    TransportOptimization
} from "./TransportOptimization.js";
import {
    GigaTransportService
} from "./GigaTransportService.js";
export class ConstructionMaterialOrder {

    constructor({

        construction,

        company,

        proposal,

        transportSystem = null,

        settings = {}

    }) {

        // ========================================
        // Grunddaten
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        this.construction =
            construction;


        this.company =
            company;


        this.proposal =
            proposal;


        this.transportSystem =
            transportSystem;
// ========================================
// Transportoptimierung
// ========================================

this.transportOptimization =
    new TransportOptimization();


        // ========================================
        // Einstellungen
        // ========================================

        this.settings = {

            // Standardwert nur dann,
            // wenn noch kein konkreter LKW
            // zugeordnet wurde.

            defaultTruckPayloadKg:
                settings.defaultTruckPayloadKg ??
                25000,


            // 100 = gesamte technisch mögliche
            // Nutzlast darf verwendet werden.

            payloadSafetyPercent:
                settings.payloadSafetyPercent ??
                100
        };


        // ========================================
        // Status
        // ========================================

        this.status =
            "created";


        // Mögliche Status:
        //
        // created
        // reserved
        // awaiting_transport
        // transport_planned
        // in_transit
        // partially_delivered
        // delivered
        // cancelled
        // failed


        // ========================================
        // Bestellpositionen
        // ========================================

        this.items =
            [];


        // ========================================
        // Transportaufträge
        // ========================================

        this.transportJobs =
            [];


        // ========================================
        // Kosten
        // ========================================

        this.materialCost =
            0;


        this.transportCost =
            0;


        this.totalCost =
            0;


        // ========================================
        // Gewicht
        // ========================================

        this.totalWeightKg =
            0;


        this.deliveredWeightKg =
            0;


        // ========================================
        // Zeiten
        // ========================================

        this.createdAt =
            new Date();


        this.reservedAt =
            null;


        this.transportPlannedAt =
            null;


        this.startedAt =
            null;


        this.completedAt =
            null;


        // ========================================
        // Historie
        // ========================================

        this.history =
            [];


        // ========================================
        // Positionen aus Bauleiter-Vorschlag
        // übernehmen
        // ========================================

        this.createItemsFromProposal();
    }


    // ========================================
    // Historie
    // ========================================

    addHistory(
        type,
        details = {}
    ) {

        this.history.push({

            type,

            date:
                new Date(),

            ...details
        });
    }


    // ========================================
    // Bestellpositionen erzeugen
    // ========================================

    createItemsFromProposal() {

        const purchases =
            this.proposal
                ?.purchases;


        if (
            !Array.isArray(
                purchases
            )
        ) {

            return;
        }


        for (
            const purchase
            of purchases
        ) {

            if (!purchase) {

                continue;
            }


            const amount =
                Math.max(

                    purchase.orderAmount ??
                    0,

                    0
                );


            if (
                amount <= 0
            ) {

                continue;
            }


            const weightKg =
                this.calculateItemWeightKg(

                    purchase,

                    amount
                );


            const item = {

                id:
                    Date.now() +
                    Math.random(),


                // =================================
                // Material
                // =================================

                materialId:
                    purchase.materialId,


                name:
                    purchase.name ??
                    purchase.materialId,


                amount,


                unit:
                    purchase.unit ??
                    null,


                // =================================
                // Lieferant
                // =================================

                supplierId:
                    purchase.supplierId ??
                    null,


                supplierName:
                    purchase.supplierName ??
                    "Lieferant",


                // =================================
                // Entfernung
                // =================================

                distanceKm:
                    Math.max(

                        purchase.distanceKm ??
                        0,

                        0
                    ),


                // =================================
                // Kosten
                // =================================

                pricePerUnit:
                    purchase.pricePerUnit ??
                    0,


                materialCost:
                    purchase.materialCost ??
                    0,


                estimatedTransportCost:
                    purchase.transportCost ??
                    0,


                // =================================
                // Gewicht
                // =================================

                weightKg,


                // =================================
                // Lieferstatus
                // =================================

                deliveredAmount:
                    0,


                deliveredWeightKg:
                    0,


                reserved:
                    false,


                fullyDelivered:
                    false,


                // =================================
                // Ursprüngliches Marktangebot
                // =================================

                offer:
                    purchase.offer ??
                    null
            };


            this.items.push(
                item
            );


            this.materialCost +=
                item.materialCost;


            this.transportCost +=
                item.estimatedTransportCost;


            this.totalWeightKg +=
                item.weightKg;
        }


        this.totalCost =

            this.materialCost +
            this.transportCost;
    }


    // ========================================
    // Gewicht einer Position bestimmen
    // ========================================

    calculateItemWeightKg(
        purchase,
        amount
    ) {

        // ========================================
        // Gesamtgewicht direkt angegeben
        // ========================================

        if (
            typeof purchase.weightKg ===
                "number" &&
            purchase.weightKg > 0
        ) {

            return purchase.weightKg;
        }


        // ========================================
        // Gewicht pro Einheit
        // ========================================

        if (
            typeof purchase.weightPerUnitKg ===
                "number" &&
            purchase.weightPerUnitKg > 0
        ) {

            return (

                purchase.weightPerUnitKg *
                amount
            );
        }


        // ========================================
        // Gewicht eventuell im Angebot
        // ========================================

        if (
            typeof purchase.offer
                ?.weightPerUnitKg ===
                "number" &&
            purchase.offer
                .weightPerUnitKg > 0
        ) {

            return (

                purchase.offer
                    .weightPerUnitKg *

                amount
            );
        }


        // ========================================
        // Tonnen
        // ========================================

        const unit =
            String(
                purchase.unit ??
                ""
            ).toLowerCase();


        if (
            unit === "t" ||
            unit === "ton" ||
            unit === "tons" ||
            unit === "tonne" ||
            unit === "tonnen"
        ) {

            return (
                amount *
                1000
            );
        }


        // ========================================
        // Kilogramm
        // ========================================

        if (
            unit === "kg" ||
            unit === "kilogramm"
        ) {

            return amount;
        }


        // ========================================
        // Kubikmeter
        //
        // Hier muss die Dichte bekannt sein.
        // ========================================

        if (
            unit === "m3" ||
            unit === "m³"
        ) {

            const density =

                purchase.densityKgPerM3 ??

                purchase.offer
                    ?.densityKgPerM3 ??

                0;


            if (
                density <= 0
            ) {

                return 0;
            }


            return (
                amount *
                density
            );
        }


        // ========================================
        // Stück
        // ========================================

        if (
            unit === "piece" ||
            unit === "pcs" ||
            unit === "stück" ||
            unit === "stueck"
        ) {

            const pieceWeight =

                purchase.weightPerUnitKg ??

                purchase.offer
                    ?.weightPerUnitKg ??

                0;


            if (
                pieceWeight <= 0
            ) {

                return 0;
            }


            return (
                amount *
                pieceWeight
            );
        }


        // ========================================
        // Gewicht unbekannt
        //
        // Nicht einfach erfinden.
        // ========================================

        return 0;
    }


    // ========================================
    // Material reservieren
    // ========================================

    reserveMaterials() {

        if (
            this.status !==
            "created"
        ) {

            return {

                success:
                    false,

                reason:
                    "Bestellung kann in diesem Zustand nicht reserviert werden"
            };
        }


        if (
            this.items.length ===
            0
        ) {

            this.status =
                "failed";


            return {

                success:
                    false,

                reason:
                    "Die Bestellung enthält keine Materialpositionen"
            };
        }


        const unavailable =
            [];


        // ========================================
        // Alle Positionen prüfen
        // ========================================

        for (
            const item
            of this.items
        ) {
const gigaOptimization =
    this.calculateGigaOptimization(
        item
    );

item.gigaOptimization =
    gigaOptimization;
if (
    gigaOptimization
) {

    console.log(
        "🚛 GIGA-OPTIMIERUNG:",
        {
            material:
                item.materialId,

            pallets:
                gigaOptimization.pallets,

            weightKg:
                gigaOptimization.totalWeightKg,

            normalCapacity:
                gigaOptimization.effectiveNormalCapacity,

            gigaCapacity:
                gigaOptimization.effectiveGigaCapacity,

            normalTrips:
                gigaOptimization.normalTrips,

            gigaTrips:
                gigaOptimization.gigaTrips,

            remainingNormalTrips:
                gigaOptimization.optimizedNormalTrips,

            totalOptimizedTrips:
                gigaOptimization.optimizedTotalTrips,

            savedTrips:
                gigaOptimization.savedTrips,

            coins:
                gigaOptimization.coinsRequired,

            recommended:
                gigaOptimization.recommended,

            reason:
                gigaOptimization.reason
        }
    );
}
            const offer =
                item.offer;


            if (
                offer &&
                typeof offer.availableAmount ===
                    "number" &&
                offer.availableAmount <
                    item.amount
            ) {

                unavailable.push({

                    materialId:
                        item.materialId,

                    name:
                        item.name,

                    required:
                        item.amount,

                    available:
                        offer.availableAmount
                });


                continue;
            }
        }


        // ========================================
        // Falls etwas fehlt:
        // gesamte Reservierung ablehnen
        // ========================================

        if (
            unavailable.length > 0
        ) {

            this.status =
                "failed";


            this.addHistory(

                "reservation_failed",

                {
                    unavailable
                }
            );


            return {

                success:
                    false,

                reason:
                    "Nicht alle Baumaterialien sind beim Lieferanten verfügbar",

                unavailable
            };
        }


        // ========================================
        // Alles reservieren
        // ========================================

        for (
            const item
            of this.items
        ) {

            item.reserved =
                true;
        }


        this.status =
            "reserved";


        this.reservedAt =
            new Date();


        this.addHistory(

            "materials_reserved",

            {
                items:
                    this.items.length,

                totalWeightKg:
                    this.totalWeightKg
            }
        );


        return {

            success:
                true,

            items:
                this.items
        };
    }


    // ========================================
    // Nutzlast aus Fahrzeugdaten berechnen
    //
    // Beispiel:
    //
    // zul. Gesamtgewicht: 40.000 kg
    // Leergewicht:        15.000 kg
    //
    // Nutzlast:           25.000 kg
    // ========================================

    calculateTruckPayloadFromWeight(
        truck
    ) {

        if (!truck) {

            return 0;
        }


        const grossWeight =

            truck.grossWeightKg ??

            truck.maxGrossWeightKg ??

            0;


        const emptyWeight =

            truck.emptyWeightKg ??

            truck.tareWeightKg ??

            0;


        if (
            grossWeight <= 0 ||
            emptyWeight < 0 ||
            emptyWeight >= grossWeight
        ) {

            return 0;
        }


        return Math.max(

            grossWeight -
            emptyWeight,

            0
        );
    }


    // ========================================
    // Tatsächliche Nutzlast bestimmen
    // ========================================

    resolveTruckPayloadKg(
        truck = null
    ) {

        let payload =
            0;


        // ========================================
        // Fahrzeuggewichte bevorzugen
        // ========================================

        if (truck) {

            payload =
                this.calculateTruckPayloadFromWeight(
                    truck
                );
        }


        // ========================================
        // Falls Gewichte fehlen:
        // hinterlegte Nutzlast verwenden
        // ========================================

        if (
            payload <= 0 &&
            truck
        ) {

            payload =

                truck.payloadKg ??

                truck.maxPayloadKg ??

                0;
        }


        // ========================================
        // Noch kein konkreter LKW vorhanden
        // ========================================

        if (
            payload <= 0
        ) {

            payload =
                this.settings
                    .defaultTruckPayloadKg;
        }


        // ========================================
        // Sicherheitsfaktor
        // ========================================

        payload *=

            this.settings
                .payloadSafetyPercent /
            100;


        return Math.max(
            payload,
            0
        );
    }


    // ========================================
    // Benötigte Fahrten
    // ========================================

    calculateRequiredTrips(
        weightKg,
        truck = null
    ) {

        if (
            weightKg <= 0
        ) {

            return 0;
        }


        const payload =
            this.resolveTruckPayloadKg(
                truck
            );


        if (
            payload <= 0
        ) {

            return 0;
        }


        return Math.ceil(

            weightKg /
            payload
        );
    }


    // ========================================
    // Transportaufträge erzeugen
    // ========================================
// ========================================
// Giga-Optimierung für Materialposition
// ========================================

calculateGigaOptimization(
    item,
    costs = {}
) {

    if (!item) {

        return null;
    }


    const cargoDefinition =
        CargoTypes[
            item.materialId
        ];


    // ========================================
    // Nur Palettenware
    // ========================================

    if (
        !cargoDefinition ||
        cargoDefinition.palletized !==
            true
    ) {

        return null;
    }


    const unitsPerPallet =
        cargoDefinition
            .unitsPerPallet ??
        0;


    if (
        unitsPerPallet <= 0
    ) {

        return null;
    }


    const pallets =
        Math.ceil(

            item.amount /
            unitsPerPallet
        );


    if (
        pallets <= 0
    ) {

        return null;
    }


    return this
        .transportOptimization
        .optimize({

            pallets,

            totalWeightKg:
                item.weightKg,

            costs
        });
}
   createTransportJobs(
    truck = null
) {

    // ========================================
    // Status prüfen
    // ========================================

    if (
        this.status !== "reserved" &&
        this.status !== "awaiting_transport"
    ) {

        return {

            success:
                false,

            reason:
                "Material ist noch nicht transportbereit"
        };
    }


    // ========================================
    // Normalen LKW bestimmen
    // ========================================

    const payloadKg =
        this.resolveTruckPayloadKg(
            truck
        );


    if (
        payloadKg <= 0
    ) {

        return {

            success:
                false,

            reason:
                "Keine gültige LKW-Nutzlast verfügbar"
        };
    }


    // ========================================
    // Palettenplätze normaler Sattelzug
    // ========================================

    const normalMaxPallets =

        truck
            ?.capacity
            ?.maxPallets

        ??

        truck
            ?.maxPallets

        ??

        33;


    // ========================================
    // Giga-Daten
    //
    // Giga:
    // - 54 Paletten
    // - max. 40 t Gesamtgewicht
    // - derzeit 15 t Leergewicht
    // - also 25 t Nutzlast
    // ========================================

    const gigaMaxPallets =
        54;


    const gigaPayloadKg =
        this.transportOptimization
            .getGigaPayloadKg();


    // ========================================
    // Alte Planung löschen
    // ========================================

    this.transportJobs =
        [];


    const materialsWithoutWeight =
        [];


    // ========================================
    // Gesamtstatistik Spezialtransporte
    // ========================================

    let totalGigaTrips =
        0;


    let totalNormalTrips =
        0;


    let totalCoinsRequired =
        0;


    let totalSavedTrips =
        0;


    // ========================================
    // Hilfsfunktion:
    // gemeinsamen Transportjob erzeugen
    // ========================================

    const createJob = ({

        item,

        tripNumber,

        transportType,

        loadAmount,

        loadWeightKg,

        pallets,

        jobPayloadKg

    }) => {

        const isGiga =
            transportType ===
            "giga";


        const transportJob = {

            id:
                Date.now() +
                Math.random(),


            orderId:
                this.id,


            itemId:
                item.id,


            materialId:
                item.materialId,


            materialName:
                item.name,


            tripNumber,


            // =================================
            // Transportart
            // =================================

            transportType,

            specialTransport:
                isGiga,

            requiresSpecialVehicle:
                isGiga,


            // =================================
            // Coins
            //
            // Einzelbuchung:
            // 1 Giga-Fahrt = 1 Coin
            // =================================

            coinCost:
                isGiga
                    ? 1
                    : 0,


            // =================================
            // Lieferant
            // =================================

            supplierId:
                item.supplierId,


            supplierName:
                item.supplierName,


            // =================================
            // Baustelle
            // =================================

            constructionId:

                this.construction
                    ?.id ??

                null,


            // =================================
            // Entfernung
            // =================================

            distanceKm:
                item.distanceKm,


            // =================================
            // Ladung
            // =================================

            amount:
                loadAmount,


            unit:
                item.unit,


            loadWeightKg,

            pallets,

            payloadKg:
                jobPayloadKg,


            utilizationPercent:

                jobPayloadKg > 0

                    ? (
                        loadWeightKg /
                        jobPayloadKg
                    ) * 100

                    : 0,


            // =================================
            // Fahrzeug
            //
            // Beim Giga wird noch KEIN normaler
            // Sattelzug eingetragen.
            //
            // Der echte Giga-Service wird im
            // nächsten Schritt angeschlossen.
            // =================================

            truckId:

                isGiga

                    ? null

                    : (
                        truck
                            ?.id ??
                        null
                    ),


            truck:

                isGiga

                    ? null

                    : (
                        truck ??
                        null
                    ),


            // =================================
            // Status
            // =================================

            status:
                "planned",


            createdAt:
                new Date(),


            startedAt:
                null,


            deliveredAt:
                null
        };


        this.transportJobs.push(
            transportJob
        );


        return transportJob;
    };


    // ========================================
    // Jede Materialposition planen
    // ========================================

    for (
        const item
        of this.items
    ) {

        // ====================================
        // Gewicht muss bekannt sein
        // ====================================

        if (
            item.weightKg <= 0
        ) {

            materialsWithoutWeight.push({

                materialId:
                    item.materialId,

                name:
                    item.name,

                unit:
                    item.unit
            });


            continue;
        }


        const cargoDefinition =
            CargoTypes[
                item.materialId
            ];


        // ====================================
        // PALETTENWARE
        // ====================================

        if (
            cargoDefinition
                ?.palletized ===
                true &&
            (
                cargoDefinition
                    .unitsPerPallet ??
                0
            ) > 0
        ) {

            const unitsPerPallet =
                cargoDefinition
                    .unitsPerPallet;


            const totalPallets =
                Math.ceil(

                    item.amount /
                    unitsPerPallet
                );


            // =================================
            // Durchschnittliches Gewicht
            // einer Palette
            // =================================

            const weightPerPalletKg =

                totalPallets > 0

                    ? (
                        item.weightKg /
                        totalPallets
                    )

                    : 0;


            // =================================
            // Effektive Kapazität normal
            //
            // Begrenzung:
            // - Palettenplätze
            // - Gewicht
            // =================================

            let normalCapacity =
                normalMaxPallets;


            if (
                weightPerPalletKg > 0
            ) {

                const byWeight =
                    Math.floor(

                        payloadKg /
                        weightPerPalletKg
                    );


                normalCapacity =
                    Math.min(

                        normalMaxPallets,

                        byWeight
                    );
            }


            normalCapacity =
                Math.max(
                    normalCapacity,
                    0
                );


            // =================================
            // Effektive Kapazität Giga
            // =================================

            let gigaCapacity =
                gigaMaxPallets;


            if (
                weightPerPalletKg > 0
            ) {

                const byWeight =
                    Math.floor(

                        gigaPayloadKg /
                        weightPerPalletKg
                    );


                gigaCapacity =
                    Math.min(

                        gigaMaxPallets,

                        byWeight
                    );
            }


            gigaCapacity =
                Math.max(
                    gigaCapacity,
                    0
                );


            // =================================
            // Ladung selbst für normalen LKW
            // zu schwer?
            // =================================

            if (
                normalCapacity <= 0
            ) {

                materialsWithoutWeight.push({

                    materialId:
                        item.materialId,

                    name:
                        item.name,

                    unit:
                        item.unit,

                    reason:
                        "Eine einzelne Palette überschreitet die normale Nutzlast"
                });


                continue;
            }


            // =================================
            // Nur normale Sattelzüge
            // =================================

            const normalTripsWithoutGiga =
                Math.ceil(

                    totalPallets /
                    normalCapacity
                );


            // =================================
            // Beste Kombination suchen
            //
            // Ziel:
            // 1. möglichst wenige Fahrten
            // 2. bei gleicher Fahrtenzahl
            //    möglichst wenige Gigas/Coins
            //
            // Beispiel 80 Paletten:
            //
            // normal:
            // 33 + 33 + 14 = 3
            //
            // 1 Giga:
            // 54 + 26 = 2
            //
            // 2 Gigas:
            // ebenfalls 2
            //
            // → deshalb 1 Giga
            // =================================

            let bestGigaTrips =
                0;


            let bestNormalTrips =
                normalTripsWithoutGiga;


            let bestTotalTrips =
                normalTripsWithoutGiga;


            if (
                gigaCapacity >
                normalCapacity
            ) {

                const maxPossibleGigaTrips =
                    Math.ceil(

                        totalPallets /
                        gigaCapacity
                    );


                for (
                    let gigaTrips = 1;
                    gigaTrips <=
                        maxPossibleGigaTrips;
                    gigaTrips++
                ) {

                    const palletsAfterGiga =

                        Math.max(

                            totalPallets -
                            (
                                gigaTrips *
                                gigaCapacity
                            ),

                            0
                        );


                    const normalTrips =

                        palletsAfterGiga > 0

                            ? Math.ceil(

                                palletsAfterGiga /
                                normalCapacity
                            )

                            : 0;


                    const totalTrips =

                        gigaTrips +
                        normalTrips;


                    // =========================
                    // Weniger Fahrten gewinnt
                    // =========================

                    if (
                        totalTrips <
                        bestTotalTrips
                    ) {

                        bestGigaTrips =
                            gigaTrips;

                        bestNormalTrips =
                            normalTrips;

                        bestTotalTrips =
                            totalTrips;

                        continue;
                    }


                    // =========================
                    // Gleiche Fahrtenzahl:
                    // weniger Coins gewinnt
                    // =========================

                    if (
                        totalTrips ===
                            bestTotalTrips &&
                        gigaTrips <
                            bestGigaTrips
                    ) {

                        bestGigaTrips =
                            gigaTrips;

                        bestNormalTrips =
                            normalTrips;
                    }
                }
            }


            // =================================
            // Giga nur dann verwenden,
            // wenn wirklich mindestens
            // eine Fahrt gespart wird.
            // =================================

            const savedTrips =

                normalTripsWithoutGiga -
                bestTotalTrips;


            if (
                savedTrips <= 0
            ) {

                bestGigaTrips =
                    0;

                bestNormalTrips =
                    normalTripsWithoutGiga;

                bestTotalTrips =
                    normalTripsWithoutGiga;
            }


            // =================================
            // Ergebnis am Material speichern
            // =================================

            item.gigaOptimization = {

                recommended:
                    bestGigaTrips > 0,


                pallets:
                    totalPallets,


                totalWeightKg:
                    item.weightKg,


                weightPerPalletKg,


                effectiveNormalCapacity:
                    normalCapacity,


                effectiveGigaCapacity:
                    gigaCapacity,


                normalTrips:
                    normalTripsWithoutGiga,


                gigaTrips:
                    bestGigaTrips,


                optimizedNormalTrips:
                    bestNormalTrips,


                optimizedTotalTrips:
                    bestTotalTrips,


                savedTrips:
                    Math.max(
                        savedTrips,
                        0
                    ),


                coinsRequired:
                    bestGigaTrips
            };


            // =================================
            // Giga-Statistik
            // =================================

            totalGigaTrips +=
                bestGigaTrips;


            totalCoinsRequired +=
                bestGigaTrips;


            totalSavedTrips +=
                Math.max(
                    savedTrips,
                    0
                );


            // =================================
            // Jetzt echte Jobs erzeugen
            // =================================

            let remainingAmount =
                item.amount;


            let remainingWeight =
                item.weightKg;


            let remainingPallets =
                totalPallets;


            let tripNumber =
                1;


            // =================================
            // ZUERST GIGA-FAHRTEN
            // =================================

            for (
                let gigaIndex = 0;
                gigaIndex <
                    bestGigaTrips;
                gigaIndex++
            ) {

                if (
                    remainingAmount <=
                        0.000001 ||
                    remainingPallets <=
                        0
                ) {

                    break;
                }


                const plannedPallets =
                    Math.min(

                        gigaCapacity,

                        remainingPallets
                    );


                // =============================
                // Wenn noch mehr Paletten
                // folgen, exakt volle
                // Palettenmengen verwenden.
                //
                // Bei der letzten Teilpalette
                // wird der komplette Mengenrest
                // verwendet.
                // =============================

                let loadAmount;


                if (
                    remainingPallets <=
                    plannedPallets
                ) {

                    loadAmount =
                        remainingAmount;
                }

                else {

                    loadAmount =
                        Math.min(

                            plannedPallets *
                            unitsPerPallet,

                            remainingAmount
                        );
                }


                const amountRatio =

                    item.amount > 0

                        ? (
                            loadAmount /
                            item.amount
                        )

                        : 0;


                let loadWeightKg =

                    item.weightKg *
                    amountRatio;


                // Sicherheitsbegrenzung
                loadWeightKg =
                    Math.min(

                        loadWeightKg,

                        gigaPayloadKg,

                        remainingWeight
                    );


                const actualPallets =
                    Math.ceil(

                        loadAmount /
                        unitsPerPallet
                    );


                createJob({

                    item,

                    tripNumber,

                    transportType:
                        "giga",

                    loadAmount,

                    loadWeightKg,

                    pallets:
                        actualPallets,

                    jobPayloadKg:
                        gigaPayloadKg
                });


                remainingAmount -=
                    loadAmount;


                remainingWeight -=
                    loadWeightKg;


                remainingPallets -=
                    actualPallets;


                remainingAmount =
                    Math.max(
                        remainingAmount,
                        0
                    );


                remainingWeight =
                    Math.max(
                        remainingWeight,
                        0
                    );


                remainingPallets =
                    Math.max(
                        remainingPallets,
                        0
                    );


                tripNumber++;
            }


            // =================================
            // REST MIT NORMALEN SATTELZÜGEN
            // =================================

            while (
                remainingAmount >
                    0.000001 &&
                remainingPallets >
                    0
            ) {

                const plannedPallets =
                    Math.min(

                        normalCapacity,

                        remainingPallets
                    );


                let loadAmount;


                if (
                    remainingPallets <=
                    plannedPallets
                ) {

                    loadAmount =
                        remainingAmount;
                }

                else {

                    loadAmount =
                        Math.min(

                            plannedPallets *
                            unitsPerPallet,

                            remainingAmount
                        );
                }


                const amountRatio =

                    item.amount > 0

                        ? (
                            loadAmount /
                            item.amount
                        )

                        : 0;


                let loadWeightKg =

                    item.weightKg *
                    amountRatio;


                loadWeightKg =
                    Math.min(

                        loadWeightKg,

                        payloadKg,

                        remainingWeight
                    );


                const actualPallets =
                    Math.ceil(

                        loadAmount /
                        unitsPerPallet
                    );


                createJob({

                    item,

                    tripNumber,

                    transportType:
                        "normal",

                    loadAmount,

                    loadWeightKg,

                    pallets:
                        actualPallets,

                    jobPayloadKg:
                        payloadKg
                });


                totalNormalTrips++;


                remainingAmount -=
                    loadAmount;


                remainingWeight -=
                    loadWeightKg;


                remainingPallets -=
                    actualPallets;


                remainingAmount =
                    Math.max(
                        remainingAmount,
                        0
                    );


                remainingWeight =
                    Math.max(
                        remainingWeight,
                        0
                    );


                remainingPallets =
                    Math.max(
                        remainingPallets,
                        0
                    );


                tripNumber++;
            }


            // Diese Materialposition ist fertig.
            continue;
        }


        // ====================================
        // NICHT PALETTIERTE WARE
        //
        // Hier bleibt unsere bisherige
        // Gewichtslogik erhalten.
        //
        // Beton, Stahl, Asphalt usw.
        // bekommen später eigene Spezial-
        // fahrzeuge wie Mischer/Kipper/Tanker.
        // ====================================

        let remainingWeight =
            item.weightKg;


        let remainingAmount =
            item.amount;


        let tripNumber =
            1;


        while (
            remainingWeight >
            0.000001
        ) {

            const loadWeightKg =
                Math.min(

                    remainingWeight,

                    payloadKg
                );


            let loadAmount;


            if (
                remainingWeight <=
                payloadKg
            ) {

                loadAmount =
                    remainingAmount;
            }

            else {

                loadAmount =

                    item.amount *

                    (
                        loadWeightKg /
                        item.weightKg
                    );
            }


            createJob({

                item,

                tripNumber,

                transportType:
                    "normal",

                loadAmount,

                loadWeightKg,

                pallets:
                    0,

                jobPayloadKg:
                    payloadKg
            });


            totalNormalTrips++;


            remainingWeight -=
                loadWeightKg;


            remainingAmount -=
                loadAmount;


            remainingWeight =
                Math.max(
                    remainingWeight,
                    0
                );


            remainingAmount =
                Math.max(
                    remainingAmount,
                    0
                );


            tripNumber++;
        }
    }


    // ========================================
    // Fehlende Gewichtsdaten
    // ========================================

    if (
        materialsWithoutWeight.length >
        0
    ) {

        this.status =
            "awaiting_transport";


        this.addHistory(

            "transport_weight_missing",

            {
                materials:
                    materialsWithoutWeight
            }
        );


        return {

            success:
                false,

            reason:
                "Für mindestens ein Baumaterial fehlen Gewichtsdaten",

            materialsWithoutWeight,

            plannedJobs:
                this.transportJobs
        };
    }


    // ========================================
    // Keine Transporte erzeugt
    // ========================================

    if (
        this.transportJobs.length ===
        0
    ) {

        this.status =
            "awaiting_transport";


        return {

            success:
                false,

            reason:
                "Es konnten keine Transporte geplant werden"
        };
    }


    // ========================================
    // Transportplanung fertig
    // ========================================

    this.status =
        "transport_planned";


    this.transportPlannedAt =
        new Date();


    this.addHistory(

        "transport_jobs_created",

        {
            jobs:
                this.transportJobs.length,

            totalWeightKg:
                this.totalWeightKg,

            payloadKg,

            normalTrips:
                totalNormalTrips,

            gigaTrips:
                totalGigaTrips,

            coinsRequired:
                totalCoinsRequired,

            savedTrips:
                totalSavedTrips
        }
    );


    // ========================================
    // Ergebnis
    // ========================================

    return {

        success:
            true,


        transportJobs:
            this.transportJobs,


        numberOfTrips:
            this.transportJobs.length,


        normalTrips:
            totalNormalTrips,


        gigaTrips:
            totalGigaTrips,


        coinsRequired:
            totalCoinsRequired,


        savedTrips:
            totalSavedTrips,


        totalWeightKg:
            this.totalWeightKg,


        payloadKg
    };

}
// ========================================
// Normalen Transport wählen
//
// Verwirft eine noch nicht gestartete
// Giga-Planung und plant die Bestellung
// ausschließlich mit normalen Fahrzeugen.
//
// Beispiel:
// 80 Paletten
// → 33 + 33 + 14
// → 3 normale Fahrten
//
// Coin-Kosten:
// 0
// ========================================

chooseNormalTransport(
    truck = null
) {

    // ========================================
    // Es muss bereits eine Transportplanung
    // vorhanden sein.
    // ========================================

    if (
        !Array.isArray(
            this.transportJobs
        ) ||
        this.transportJobs.length ===
            0
    ) {

        return {

            success:
                false,

            choice:
                "normal",

            reason:
                "no_transport_jobs",

            message:
                "Es wurden noch keine Transporte geplant"
        };
    }


    // ========================================
    // Bereits gestartete Transporte dürfen
    // nicht mehr umgeplant werden.
    // ========================================

    const alreadyStarted =
        this.transportJobs.some(

            job =>

                job.startedAt !==
                    null ||

                (
                    job.status !==
                        "planned" &&

                    job.status !==
                        "assigned"
                )
        );


    if (
        alreadyStarted
    ) {

        return {

            success:
                false,

            choice:
                "normal",

            reason:
                "transport_already_started",

            message:
                "Der Transport wurde bereits begonnen und kann nicht mehr umgeplant werden"
        };
    }


    // ========================================
    // Normalen LKW bestimmen
    //
    // Falls kein LKW direkt übergeben wurde,
    // nehmen wir einen aus der bestehenden
    // normalen Planung.
    // ========================================

    let normalTruck =
        truck;


    if (
        !normalTruck
    ) {

        const existingNormalJob =
            this.transportJobs.find(

                job =>
                    job.transportType ===
                        "normal" &&
                    job.truck
            );


        normalTruck =
            existingNormalJob
                ?.truck ??
            null;
    }


    if (
        !normalTruck
    ) {

        return {

            success:
                false,

            choice:
                "normal",

            reason:
                "normal_truck_missing",

            message:
                "Für die normale Transportplanung ist kein Sattelzug verfügbar"
        };
    }


    // ========================================
    // Nutzlast bestimmen
    // ========================================

    const payloadKg =
        this.resolveTruckPayloadKg(
            normalTruck
        );


    if (
        payloadKg <= 0
    ) {

        return {

            success:
                false,

            choice:
                "normal",

            reason:
                "invalid_payload",

            message:
                "Der normale LKW besitzt keine gültige Nutzlast"
        };
    }


    // ========================================
    // Palettenkapazität bestimmen
    // ========================================

    const normalMaxPallets =

        normalTruck
            ?.capacity
            ?.maxPallets

        ??

        normalTruck
            ?.maxPallets

        ??

        33;


    if (
        normalMaxPallets <= 0
    ) {

        return {

            success:
                false,

            choice:
                "normal",

            reason:
                "invalid_pallet_capacity",

            message:
                "Der normale LKW besitzt keine gültige Palettenkapazität"
        };
    }


    // ========================================
    // Alte Planung merken
    // ========================================

    const previousJobs =
        this.transportJobs;


    const previousGigaTrips =
        previousJobs.filter(

            job =>
                job.transportType ===
                "giga"
        ).length;


    const previousNormalTrips =
        previousJobs.filter(

            job =>
                job.transportType ===
                "normal"
        ).length;


    const previousTotalTrips =
        previousJobs.length;


    const previousCoinsRequired =
        previousJobs.reduce(

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


    // ========================================
    // Neue normale Jobs
    // ========================================

    const newJobs =
        [];


    const errors =
        [];


    // ========================================
    // Hilfsfunktion:
    // normalen Job erzeugen
    // ========================================

    const createNormalJob = ({

        item,

        tripNumber,

        loadAmount,

        loadWeightKg,

        pallets

    }) => {

        const job = {

            id:
                Date.now() +
                Math.random(),

            orderId:
                this.id,

            itemId:
                item.id,

            materialId:
                item.materialId,

            materialName:
                item.name,

            tripNumber,


            // =================================
            // Transportart
            // =================================

            transportType:
                "normal",

            specialTransport:
                false,

            requiresSpecialVehicle:
                false,


            // =================================
            // Keine Coins
            // =================================

            coinCost:
                0,


            // =================================
            // Lieferant
            // =================================

            supplierId:
                item.supplierId,

            supplierName:
                item.supplierName,


            // =================================
            // Baustelle
            // =================================

            constructionId:

                this.construction
                    ?.id ??

                null,


            // =================================
            // Entfernung
            // =================================

            distanceKm:
                item.distanceKm,


            // =================================
            // Ladung
            // =================================

            amount:
                loadAmount,

            unit:
                item.unit,

            loadWeightKg,

            pallets,

            payloadKg,


            utilizationPercent:

                payloadKg > 0

                    ? (
                        loadWeightKg /
                        payloadKg
                    ) * 100

                    : 0,


            // =================================
            // Fahrzeug
            // =================================

            truckId:

                normalTruck
                    ?.id ??

                null,

            truck:
                normalTruck,


            // =================================
            // Keine Spezialfreigabe
            // =================================

            specialTransportConfirmed:
                false,

            specialTransportConfirmedAt:
                null,

            coinPaymentConfirmed:
                false,

            packageCovered:
                false,


            // =================================
            // Status
            // =================================

            status:
                "planned",

            createdAt:
                new Date(),

            startedAt:
                null,

            deliveredAt:
                null
        };


        newJobs.push(
            job
        );


        return job;
    };


    // ========================================
    // Alle Materialpositionen neu planen
    // ========================================

    for (
        const item
        of this.items
    ) {

        // ====================================
        // Gewicht muss bekannt sein
        // ====================================

        if (
            item.weightKg <= 0
        ) {

            errors.push({

                materialId:
                    item.materialId,

                name:
                    item.name,

                reason:
                    "Gewicht unbekannt"
            });


            continue;
        }


        const cargoDefinition =
            CargoTypes[
                item.materialId
            ];


        // ====================================
        // PALETTENWARE
        // ====================================

        if (
            cargoDefinition
                ?.palletized ===
                true &&
            (
                cargoDefinition
                    .unitsPerPallet ??
                0
            ) > 0
        ) {

            const unitsPerPallet =
                cargoDefinition
                    .unitsPerPallet;


            const totalPallets =
                Math.ceil(

                    item.amount /
                    unitsPerPallet
                );


            const weightPerPalletKg =

                totalPallets > 0

                    ? (
                        item.weightKg /
                        totalPallets
                    )

                    : 0;


            // =================================
            // Effektive Kapazität normal
            // =================================

            let normalCapacity =
                normalMaxPallets;


            if (
                weightPerPalletKg > 0
            ) {

                const capacityByWeight =
                    Math.floor(

                        payloadKg /
                        weightPerPalletKg
                    );


                normalCapacity =
                    Math.min(

                        normalMaxPallets,

                        capacityByWeight
                    );
            }


            if (
                normalCapacity <= 0
            ) {

                errors.push({

                    materialId:
                        item.materialId,

                    name:
                        item.name,

                    reason:
                        "Eine einzelne Palette überschreitet die normale Nutzlast"
                });


                continue;
            }


            // =================================
            // Menge verteilen
            // =================================

            let remainingAmount =
                item.amount;


            let remainingWeight =
                item.weightKg;


            let remainingPallets =
                totalPallets;


            let tripNumber =
                1;


            while (
                remainingAmount >
                    0.000001 &&
                remainingPallets >
                    0
            ) {

                const plannedPallets =
                    Math.min(

                        normalCapacity,

                        remainingPallets
                    );


                let loadAmount;


                if (
                    remainingPallets <=
                    plannedPallets
                ) {

                    loadAmount =
                        remainingAmount;
                }

                else {

                    loadAmount =
                        Math.min(

                            plannedPallets *
                            unitsPerPallet,

                            remainingAmount
                        );
                }


                const amountRatio =

                    item.amount > 0

                        ? (
                            loadAmount /
                            item.amount
                        )

                        : 0;


                let loadWeightKg =

                    item.weightKg *
                    amountRatio;


                loadWeightKg =
                    Math.min(

                        loadWeightKg,

                        payloadKg,

                        remainingWeight
                    );


                const actualPallets =
                    Math.ceil(

                        loadAmount /
                        unitsPerPallet
                    );


                createNormalJob({

                    item,

                    tripNumber,

                    loadAmount,

                    loadWeightKg,

                    pallets:
                        actualPallets
                });


                remainingAmount -=
                    loadAmount;


                remainingWeight -=
                    loadWeightKg;


                remainingPallets -=
                    actualPallets;


                remainingAmount =
                    Math.max(
                        remainingAmount,
                        0
                    );


                remainingWeight =
                    Math.max(
                        remainingWeight,
                        0
                    );


                remainingPallets =
                    Math.max(
                        remainingPallets,
                        0
                    );


                tripNumber++;
            }


            // =================================
            // Entscheidung am Item merken
            // =================================

            if (
                item.gigaOptimization
            ) {

                item.gigaOptimization.playerChoice =
                    "normal";


                item.gigaOptimization.accepted =
                    false;
            }


            continue;
        }


        // ====================================
        // NICHT PALETTIERTE WARE
        // ====================================

        let remainingWeight =
            item.weightKg;


        let remainingAmount =
            item.amount;


        let tripNumber =
            1;


        while (
            remainingWeight >
            0.000001
        ) {

            const loadWeightKg =
                Math.min(

                    remainingWeight,

                    payloadKg
                );


            let loadAmount;


            if (
                remainingWeight <=
                payloadKg
            ) {

                loadAmount =
                    remainingAmount;
            }

            else {

                loadAmount =

                    item.amount *

                    (
                        loadWeightKg /
                        item.weightKg
                    );
            }


            createNormalJob({

                item,

                tripNumber,

                loadAmount,

                loadWeightKg,

                pallets:
                    0
            });


            remainingWeight -=
                loadWeightKg;


            remainingAmount -=
                loadAmount;


            remainingWeight =
                Math.max(
                    remainingWeight,
                    0
                );


            remainingAmount =
                Math.max(
                    remainingAmount,
                    0
                );


            tripNumber++;
        }
    }


    // ========================================
    // Falls irgendeine Position nicht
    // geplant werden konnte:
    // alte Planung behalten.
    // ========================================

    if (
        errors.length >
        0
    ) {

        return {

            success:
                false,

            choice:
                "normal",

            reason:
                "normal_transport_not_possible",

            message:
                "Mindestens ein Material konnte nicht normal geplant werden",

            errors,

            transportJobs:
                previousJobs
        };
    }


    if (
        newJobs.length ===
        0
    ) {

        return {

            success:
                false,

            choice:
                "normal",

            reason:
                "no_normal_jobs",

            message:
                "Es konnten keine normalen Transportfahrten erzeugt werden",

            transportJobs:
                previousJobs
        };
    }


    // ========================================
    // Neue Planung übernehmen
    // ========================================

    this.transportJobs =
        newJobs;


    this.status =
        "transport_planned";


    this.transportPlannedAt =
        new Date();


    const normalTrips =
        newJobs.length;


    // ========================================
    // Historie
    // ========================================

    this.addHistory(

        "giga_transport_declined",

        {

            previousGigaTrips,

            previousNormalTrips,

            previousTotalTrips,

            previousCoinsRequired,

            newNormalTrips:
                normalTrips,

            newCoinsRequired:
                0
        }
    );


    // ========================================
    // Ergebnis
    // ========================================

    return {

        success:
            true,

        choice:
            "normal",

        gigaDeclined:
            true,


        previousGigaTrips,

        previousNormalTrips,

        previousTotalTrips,

        previousCoinsRequired,


        gigaTrips:
            0,

        normalTrips,

        numberOfTrips:
            normalTrips,

        coinsRequired:
            0,

        coinsSpent:
            0,

        transportJobs:
            this.transportJobs
    };
}

// ========================================
// Spezialtransporte bestätigen
//
// Wird ERST aufgerufen, wenn der Spieler
// die vorgeschlagene Giga-Lösung
// ausdrücklich bestätigt.
//
// Ablauf:
//
// 1. geplante Giga-Jobs zählen
// 2. aktives Zeitpaket prüfen
// 3. sonst Coinbedarf prüfen
// 4. bei zu wenig Coins Kaufangebot
// 5. erst nach Erfolg Giga-Jobs freigeben
//
// WICHTIG:
// Die Transportplanung selbst zieht
// weiterhin KEINE Coins ab.
// ========================================

confirmSpecialTransports(
    currentDate = new Date()
) {

    // ========================================
    // Es muss bereits eine Planung geben
    // ========================================

    if (
        !Array.isArray(
            this.transportJobs
        ) ||
        this.transportJobs.length ===
            0
    ) {

        return {

            success:
                false,

            confirmed:
                false,

            reason:
                "no_transport_jobs",

            message:
                "Es wurden noch keine Transporte geplant"
        };
    }


    // ========================================
    // Geplante Giga-Jobs suchen
    // ========================================

    const gigaJobs =
        this.transportJobs.filter(

            job =>
                job.transportType ===
                "giga" &&

                job.status ===
                "planned"
        );


    // ========================================
    // Kein Giga nötig
    // ========================================

    if (
        gigaJobs.length ===
        0
    ) {

        return {

            success:
                true,

            confirmed:
                true,

            specialTransport:
                false,

            message:
                "Für diese Bestellung ist kein Giga-Transport erforderlich",

            gigaTrips:
                0,

            coinsSpent:
                0
        };
    }


    // ========================================
    // GigaTransportService sicherstellen
    //
    // Wichtig:
    // Service am Unternehmen speichern,
    // damit aktive Zeitpakete erhalten bleiben.
    // ========================================

    if (
        !this.company
    ) {

        return {

            success:
                false,

            confirmed:
                false,

            reason:
                "company_missing",

            message:
                "Unternehmen nicht verfügbar"
        };
    }


    if (
        !this.company
            .gigaTransportService
    ) {

        this.company
            .gigaTransportService =
                new GigaTransportService(
                    this.company
                );
    }


    const service =
        this.company
            .gigaTransportService;


    // ========================================
    // Spielerbestätigung durchführen
    //
    // Anzahl Giga-Jobs =
    // Anzahl benötigter Einzeltransporte
    //
    // Beispiel:
    // 1 Giga = 1 Coin
    // 2 Gigas = 2 Coins
    // ========================================

    const confirmation =
        service
            .confirmSpecialTransport({

                serviceType:
                    "giga",

                numberOfTransports:
                    gigaJobs.length,

                currentDate
            });


    // ========================================
    // Zu wenig Coins / nicht bestätigt
    //
    // Jobs bleiben unverändert "planned".
    //
    // Das Ergebnis enthält bereits:
    // - benötigte Coins
    // - vorhandene Coins
    // - fehlende Coins
    // - 50er-Coin-Angebot
    // ========================================

    if (
        !confirmation ||
        confirmation.success !==
            true ||
        confirmation.confirmed !==
            true
    ) {

        this.addHistory(

            "giga_confirmation_failed",

            {
                gigaTrips:
                    gigaJobs.length,

                reason:
                    confirmation
                        ?.reason ??
                    "unknown",

                coinsRequired:
                    confirmation
                        ?.coinsRequired ??
                    gigaJobs.length,

                availableCoins:
                    confirmation
                        ?.availableCoins ??
                    this.company
                        ?.coins ??
                    0
            }
        );


        return {

            ...confirmation,

            gigaTrips:
                gigaJobs.length,

            transportJobs:
                this.transportJobs
        };
    }


    // ========================================
    // Bestätigung erfolgreich
    //
    // Giga-Jobs jetzt verbindlich freigeben.
    // ========================================

    for (
        const job
        of gigaJobs
    ) {

        job.specialTransportConfirmed =
            true;


        job.specialTransportConfirmedAt =
            new Date(
                currentDate
            );


        job.coinPaymentConfirmed =
            confirmation.coinsSpent >
            0;


        job.packageCovered =
            confirmation.packageActive ===
            true;


        // Job bleibt noch "planned".
        //
        // Er wurde jetzt bezahlt/freigegeben,
        // aber die eigentliche Fahrt hat
        // noch nicht begonnen.
    }


    // ========================================
    // Historie
    // ========================================

    this.addHistory(

        "giga_transport_confirmed",

        {
            gigaTrips:
                gigaJobs.length,

            coinsRequired:
                confirmation
                    .coinsRequired ??
                0,

            coinsSpent:
                confirmation
                    .coinsSpent ??
                0,

            packageActive:
                confirmation
                    .packageActive ===
                true,

            remainingCoins:
                confirmation
                    .remainingCoins ??
                this.company
                    ?.coins ??
                0
        }
    );


    // ========================================
    // Erfolgreiches Ergebnis
    // ========================================

    return {

        success:
            true,

        confirmed:
            true,

        serviceType:
            "giga",

        gigaTrips:
            gigaJobs.length,

        coinsRequired:
            confirmation
                .coinsRequired ??
            0,

        coinsSpent:
            confirmation
                .coinsSpent ??
            0,

        remainingCoins:
            confirmation
                .remainingCoins ??
            this.company
                ?.coins ??
            0,

        packageActive:
            confirmation
                .packageActive ===
            true,

        transportJobs:
            this.transportJobs
    };
}
    // ========================================
    // Einzelnen Transport starten
    // ========================================

    startTransportJob(
        jobId,
        date = new Date()
    ) {

        const job =
            this.transportJobs.find(

                item =>
                    item.id ===
                    jobId
            );


        if (!job) {

            return false;
        }


        if (
            job.status !==
                "planned" &&
            job.status !==
                "assigned"
        ) {

            return false;
        }


        job.status =
            "driving_to_supplier";


        job.startedAt =
            new Date(
                date
            );


        if (
            !this.startedAt
        ) {

            this.startedAt =
                new Date(
                    date
                );
        }


        this.status =
            "in_transit";


        this.addHistory(

            "transport_started",

            {
                jobId:
                    job.id,

                materialId:
                    job.materialId,

                amount:
                    job.amount,

                loadWeightKg:
                    job.loadWeightKg
            }
        );


        return true;
    }


    // ========================================
    // Transportstatus ändern
    // ========================================

    setTransportJobStatus(
        jobId,
        status
    ) {

        const job =
            this.transportJobs.find(

                item =>
                    item.id ===
                    jobId
            );


        if (!job) {

            return false;
        }


        const allowedStatuses = [

            "planned",

            "assigned",

            "driving_to_supplier",

            "loading",

            "driving_to_construction",

            "unloading",

            "delivered"
        ];


        if (
            !allowedStatuses.includes(
                status
            )
        ) {

            return false;
        }


        if (
            job.status ===
            "delivered"
        ) {

            return false;
        }


        job.status =
            status;


        return true;
    }


    // ========================================
    // Material auf Baustelle buchen
    // ========================================

    addMaterialToConstruction(
        materialId,
        amount
    ) {

        if (
            !this.construction ||
            amount <= 0
        ) {

            return false;
        }


        // ========================================
        // Bevorzugte Construction-Schnittstelle
        // ========================================

        if (
            typeof this.construction
                .addMaterial ===
            "function"
        ) {

            return (
                this.construction
                    .addMaterial(

                        materialId,

                        amount
                    )
            );
        }


        // ========================================
        // Fallback
        // ========================================

        if (
            !this.construction.materials
        ) {

            this.construction.materials =
                {};
        }


        if (
            !this.construction
                .materials
                .available
        ) {

            this.construction
                .materials
                .available =
                    {};
        }


        const available =
            this.construction
                .materials
                .available;


        if (
            typeof available !==
                "object" ||
            Array.isArray(
                available
            )
        ) {

            return false;
        }


        available[
            materialId
        ] =

            (
                available[
                    materialId
                ] ??
                0
            )

            +

            amount;


        return true;
    }


    // ========================================
    // Transport abschließen
    //
    // ERST HIER wird Material tatsächlich
    // Baustellenbestand.
    // ========================================

    completeTransportJob(
        jobId,
        date = new Date()
    ) {

        const job =
            this.transportJobs.find(

                item =>
                    item.id ===
                    jobId
            );


        if (!job) {

            return {

                success:
                    false,

                reason:
                    "Transportauftrag nicht gefunden"
            };
        }


        if (
            job.status ===
            "delivered"
        ) {

            return {

                success:
                    false,

                reason:
                    "Transport wurde bereits geliefert"
            };
        }


        // ========================================
        // Material auf Baustelle buchen
        // ========================================

        const added =
            this.addMaterialToConstruction(

                job.materialId,

                job.amount
            );


        if (!added) {

            return {

                success:
                    false,

                reason:
                    "Material konnte nicht auf die Baustelle gebucht werden"
            };
        }


        // ========================================
        // Bestellposition aktualisieren
        // ========================================

        const item =
            this.items.find(

                entry =>
                    entry.id ===
                    job.itemId
            );


        if (item) {

            item.deliveredAmount +=
                job.amount;


            item.deliveredWeightKg +=
                job.loadWeightKg;


            if (
                item.deliveredAmount >=
                item.amount -
                0.000001
            ) {

                item.deliveredAmount =
                    item.amount;


                item.deliveredWeightKg =
                    item.weightKg;


                item.fullyDelivered =
                    true;
            }
        }


        // ========================================
        // Transport abschließen
        // ========================================

        job.status =
            "delivered";


        job.deliveredAt =
            new Date(
                date
            );


        this.deliveredWeightKg +=
            job.loadWeightKg;


        this.deliveredWeightKg =
            Math.min(

                this.deliveredWeightKg,

                this.totalWeightKg
            );


        this.addHistory(

            "transport_delivered",

            {
                jobId:
                    job.id,

                materialId:
                    job.materialId,

                amount:
                    job.amount,

                weightKg:
                    job.loadWeightKg
            }
        );


        // ========================================
        // Sind alle Transporte angekommen?
        // ========================================

        const allDelivered =
            this.transportJobs.length >
                0 &&
            this.transportJobs.every(

                transport =>
                    transport.status ===
                    "delivered"
            );


        if (
            allDelivered
        ) {

            this.status =
                "delivered";


            this.completedAt =
                new Date(
                    date
                );


            this.addHistory(

                "order_delivered",

                {
                    totalWeightKg:
                        this.totalWeightKg,

                    transports:
                        this.transportJobs
                            .length
                }
            );
        }

        else {

            this.status =
                "partially_delivered";
        }


        return {

            success:
                true,

            orderStatus:
                this.status,

            deliveredWeightKg:
                this.deliveredWeightKg,

            totalWeightKg:
                this.totalWeightKg,

            remainingWeightKg:
                this.getRemainingWeightKg()
        };
    }


    // ========================================
    // Restgewicht
    // ========================================

    getRemainingWeightKg() {

        return Math.max(

            this.totalWeightKg -
            this.deliveredWeightKg,

            0
        );
    }


    // ========================================
    // Offene Transporte
    // ========================================

    getOpenTransportJobs() {

        return this.transportJobs.filter(

            job =>
                job.status !==
                "delivered"
        );
    }


    // ========================================
    // Gelieferte Transporte
    // ========================================

    getDeliveredTransportJobs() {

        return this.transportJobs.filter(

            job =>
                job.status ===
                "delivered"
        );
    }


    // ========================================
    // Bestellung vollständig geliefert?
    // ========================================

    isDelivered() {

        return (
            this.status ===
            "delivered"
        );
    }


    // ========================================
    // Bestellung stornieren
    //
    // Nur solange noch kein Transport
    // tatsächlich begonnen wurde.
    // ========================================

    cancel() {

        if (
            this.status ===
                "in_transit" ||
            this.status ===
                "partially_delivered" ||
            this.status ===
                "delivered"
        ) {

            return {

                success:
                    false,

                reason:
                    "Bestellung kann nach Transportbeginn nicht mehr vollständig storniert werden"
            };
        }


        const startedTransport =
            this.transportJobs.some(

                job =>
                    job.startedAt !==
                    null
            );


        if (
            startedTransport
        ) {

            return {

                success:
                    false,

                reason:
                    "Mindestens ein Transport wurde bereits gestartet"
            };
        }


        this.status =
            "cancelled";


        this.addHistory(
            "order_cancelled"
        );


        return {

            success:
                true
        };
    }


    // ========================================
    // Bestellübersicht
    // ========================================

    getInfo() {

        return {

            id:
                this.id,

            constructionId:
                this.construction
                    ?.id ??
                null,

            status:
                this.status,

            items:
                this.items,

            materialCost:
                this.materialCost,

            transportCost:
                this.transportCost,

            totalCost:
                this.totalCost,

            totalWeightKg:
                this.totalWeightKg,

            deliveredWeightKg:
                this.deliveredWeightKg,

            remainingWeightKg:
                this.getRemainingWeightKg(),

            transportJobs:
                this.transportJobs,

            openTransportJobs:
                this.getOpenTransportJobs()
                    .length,

            deliveredTransportJobs:
                this.getDeliveredTransportJobs()
                    .length,

            createdAt:
                this.createdAt,

            reservedAt:
                this.reservedAt,

            transportPlannedAt:
                this.transportPlannedAt,

            startedAt:
                this.startedAt,

            completedAt:
                this.completedAt,

            history:
                this.history
        };
    }
}