// ============================================
// ConstructionMaterialTransport.js
// WorldProject
//
// Brücke zwischen:
//
// ConstructionMaterialOrder
// und
// echtem Transportsystem.
//
// Aufgaben:
// - Materialtransport mit echtem LKW
// - Kapazität prüfen
// - LKW reservieren
// - Ladung laden
// - Fahrt durchführen
// - Fahrzeugstatus verwalten
// - Material erst nach Ankunft gutschreiben
//
// Fahrzeugstatus:
//
// available
// loading
// driving
// waiting
// unloading
// maintenance
// ============================================

import {
    TransportOrder
} from "./TransportOrder.js";

import {
    TransportJourney
} from "./TransportJourney.js";


export class ConstructionMaterialTransport {

    constructor({

        materialOrder,

        transportJob,

        truck,

        timingSettings = {}

    }) {

        // ========================================
        // Identität
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        // ========================================
        // Verknüpfungen
        // ========================================

        this.materialOrder =
            materialOrder;

        this.transportJob =
            transportJob;

        this.truck =
            truck;


        // ========================================
        // Zeit-Einstellungen
        // ========================================

        this.timingSettings =
            timingSettings;


        // ========================================
        // Echte Transportobjekte
        // ========================================

        this.transportOrder =
            null;

        this.journey =
            null;


        // ========================================
        // Status
        // ========================================

        this.status =
            "created";


        // created
        // planned
        // loading
        // driving
        // delayed
        // arrived
        // unloading
        // delivered
        // failed


        // ========================================
        // Zeiten
        // ========================================

        this.createdAt =
            new Date();

        this.startedAt =
            null;

        this.arrivedAt =
            null;

        this.deliveredAt =
            null;


        // ========================================
        // Fehler
        // ========================================

        this.error =
            null;
    }


    // ========================================
    // Fahrzeugstatus setzen
    // ========================================

    setTruckStatus(
        status
    ) {

        if (!this.truck) {

            return false;
        }


        if (
            typeof this.truck.setStatus ===
            "function"
        ) {

            this.truck.setStatus(
                status
            );

            return true;
        }


        // Fallback

        this.truck.status =
            status;


        return true;
    }


    // ========================================
    // Grundprüfung
    // ========================================

    isValid() {

        return Boolean(

            this.materialOrder &&
            this.transportJob &&
            this.truck
        );
    }


    // ========================================
    // Prüfen, ob LKW verfügbar ist
    // ========================================

    isTruckAvailable() {

        if (!this.truck) {

            return false;
        }


        if (
            typeof this.truck.isAvailable ===
            "function"
        ) {

            return (
                this.truck.isAvailable()
            );
        }


        return (
            this.truck.status ===
            "available"
        );
    }


    // ========================================
    // Prüfen, ob LKW die Ladung tragen kann
    // ========================================

    canTruckCarryJob() {

        if (
            !this.truck ||
            !this.transportJob
        ) {

            return false;
        }


        if (
            typeof this.truck.canLoad !==
            "function"
        ) {

            return false;
        }


        return this.truck.canLoad({

            weightKg:
                this.transportJob
                    .loadWeightKg ??
                0,

            volumeM3:
                this.transportJob
                    .volumeM3 ??
                0,

            pallets:
                this.transportJob
                    .pallets ??
                0
        });
    }


    // ========================================
    // TransportOrder erzeugen
    // ========================================

    createTransportOrder() {

        if (
            !this.isValid()
        ) {

            return this.fail(
                "Transportdaten unvollständig"
            );
        }


        if (
            !this.canTruckCarryJob()
        ) {

            return this.fail(
                "LKW kann diese Ladung nicht transportieren"
            );
        }


        try {

            this.transportOrder =
                new TransportOrder({

                    cargoType:
                        this.transportJob
                            .materialId,

                    amount:
                        this.transportJob
                            .amount,

                    truck:
                        this.truck,

                    supplier: {

                        id:
                            this.transportJob
                                .supplierId ??
                            null,

                        name:
                            this.transportJob
                                .supplierName ??
                            "Lieferant"
                    },

                    destination: {

                        type:
                            "construction",

                        id:
                            this.materialOrder
                                .construction
                                ?.id ??
                            null
                    },

distanceKm:
    this.transportJob
        .distanceKm ??
    0,

company:
    this.materialOrder
        .company ??
    null});

        }

        catch (error) {

            this.fail(

                "TransportOrder konnte nicht erstellt werden: " +
                error.message
            );


            return null;
        }


        // ========================================
        // Dieser Job entspricht bereits genau
        // einer einzelnen LKW-Fahrt.
        // ========================================

        this.transportOrder.requiredTrips =
            1;


        this.status =
            "planned";


        return (
            this.transportOrder
        );
    }


    // ========================================
    // TransportJourney erzeugen
    // ========================================

    createJourney() {

        if (
            !this.transportOrder
        ) {

            const transportOrder =
                this.createTransportOrder();


            if (!transportOrder) {

                return null;
            }
        }


        try {

            this.journey =
                new TransportJourney({

                    transportOrder:
                        this.transportOrder,

                    timingSettings:
                        this.timingSettings
                });

        }

        catch (error) {

            this.fail(

                "TransportJourney konnte nicht erstellt werden: " +
                error.message
            );


            return null;
        }


        return (
            this.journey
        );
    }


    // ========================================
    // Fahrt planen
    // ========================================

    plan(
        startDate = new Date()
    ) {

        if (
            !this.journey
        ) {

            const journey =
                this.createJourney();


            if (!journey) {

                return false;
            }
        }


        if (
            typeof this.journey.plan !==
            "function"
        ) {

            return this.fail(
                "TransportJourney besitzt keine plan()-Funktion"
            );
        }


        const planned =
            this.journey.plan(
                startDate
            );


        if (!planned) {

            return this.fail(
                "Transport konnte nicht geplant werden"
            );
        }


        this.status =
            "planned";


        return true;
    }


    // ========================================
    // LKW beladen
    // ========================================

    loadTruck() {

        if (
            !this.truck ||
            !this.transportJob
        ) {

            return false;
        }


        if (
            typeof this.truck.loadCargo !==
            "function"
        ) {

            return this.fail(
                "Fahrzeug unterstützt keine Ladungsaufnahme"
            );
        }


        // ========================================
        // Ab jetzt ist der LKW NICHT mehr
        // verfügbar.
        // ========================================

        this.setTruckStatus(
            "loading"
        );


        this.status =
            "loading";


        this.transportJob.status =
            "loading";


        const result =
            this.truck.loadCargo({

                id:
                    this.transportJob
                        .materialId,

                name:
                    this.transportJob
                        .materialName ??
                    this.transportJob
                        .materialId,

                amount:
                    this.transportJob
                        .amount,

                unit:
                    this.transportJob
                        .unit,

                weightKg:
                    this.transportJob
                        .loadWeightKg ??
                    0,

                volumeM3:
                    this.transportJob
                        .volumeM3 ??
                    0,

                pallets:
                    this.transportJob
                        .pallets ??
                    0
            });


        // ========================================
        // Beladung fehlgeschlagen
        // ========================================

        if (
            !result ||
            result.success !==
            true
        ) {

            // LKW wieder freigeben,
            // da nichts geladen wurde.

            this.setTruckStatus(
                "available"
            );


            return this.fail(
                "LKW konnte nicht beladen werden"
            );
        }


        return true;
    }


    // ========================================
    // Fahrt starten
    // ========================================

    start(
        startDate = new Date()
    ) {

        if (
            !this.isValid()
        ) {

            return this.fail(
                "Transportdaten unvollständig"
            );
        }


        // ========================================
        // Ganz wichtig:
        //
        // Der LKW darf nicht bereits für einen
        // anderen Auftrag unterwegs sein.
        // ========================================

        if (
            !this.isTruckAvailable()
        ) {

            return this.fail(
                "LKW ist momentan nicht verfügbar"
            );
        }


        // ========================================
        // Kapazität prüfen
        // ========================================

        if (
            !this.canTruckCarryJob()
        ) {

            return this.fail(
                "LKW kann diese Ladung nicht transportieren"
            );
        }


        // ========================================
        // Fahrt planen
        // ========================================

        if (
            !this.plan(
                startDate
            )
        ) {

            return false;
        }


        // ========================================
        // Beladen
        // ========================================

        if (
            !this.loadTruck()
        ) {

            return false;
        }


        // ========================================
        // Journey starten
        // ========================================

        if (
            !this.journey ||
            typeof this.journey.startDriving !==
            "function"
        ) {

            // Ladung wieder entfernen

            if (
                typeof this.truck.unloadAll ===
                "function"
            ) {

                this.truck.unloadAll();
            }


            this.setTruckStatus(
                "available"
            );


            return this.fail(
                "TransportJourney kann nicht gestartet werden"
            );
        }


        const started =
            this.journey.startDriving(
                startDate
            );


        if (!started) {

            // ====================================
            // Fahrt startet nicht:
            // Ladung entfernen und LKW freigeben.
            // ====================================

            if (
                typeof this.truck.unloadAll ===
                "function"
            ) {

                this.truck.unloadAll();
            }


            this.setTruckStatus(
                "available"
            );


            return this.fail(
                "Transportfahrt konnte nicht gestartet werden"
            );
        }


        // ========================================
        // LKW fährt jetzt.
        // ========================================

        this.setTruckStatus(
            "driving"
        );


        this.transportJob.status =
            "driving_to_construction";


        this.transportJob.startedAt =
            new Date(
                startDate
            );


        this.status =
            "driving";


        this.startedAt =
            new Date(
                startDate
            );


        // ========================================
        // Baustelle:
        // Material ist jetzt unterwegs.
        // ========================================

        const construction =
            this.materialOrder
                .construction;


        if (
            construction &&
            typeof construction
                .markMaterialInTransit ===
            "function"
        ) {

            construction.markMaterialInTransit(

                this.transportJob
                    .materialId,

                this.transportJob
                    .amount
            );
        }


        if (
            this.materialOrder.status !==
            "delivered"
        ) {

            this.materialOrder.status =
                "in_transit";
        }


        return true;
    }


    // ========================================
    // Verzögerung
    // ========================================

    addDelay(
        hours,
        reason = "Transportverzögerung"
    ) {

        if (
            !this.journey ||
            typeof this.journey.addDelay !==
            "function"
        ) {

            return false;
        }


        const result =
            this.journey.addDelay(

                hours,

                reason
            );


        if (!result) {

            return false;
        }


        // ========================================
        // LKW bleibt belegt.
        // ========================================

        this.setTruckStatus(
            "waiting"
        );


        this.status =
            "delayed";


        return true;
    }


    // ========================================
    // Nach Verzögerung weiterfahren
    // ========================================

    resume() {

        if (
            !this.journey ||
            typeof this.journey.resumeDriving !==
            "function"
        ) {

            return false;
        }


        const resumed =
            this.journey.resumeDriving();


        if (!resumed) {

            return false;
        }


        this.setTruckStatus(
            "driving"
        );


        this.status =
            "driving";


        return true;
    }


    // ========================================
    // Spiel-Tick
    // ========================================

    update(
        currentDate = new Date()
    ) {

        if (!this.journey) {

            return;
        }


        if (
            this.status !==
                "driving" &&
            this.status !==
                "delayed"
        ) {

            return;
        }


        if (
            typeof this.journey.update !==
            "function"
        ) {

            return;
        }


        this.journey.update(
            currentDate
        );


        // ========================================
        // Ziel erreicht
        // ========================================

        if (
            this.journey.status ===
            "arrived"
        ) {

            this.markArrived(
                currentDate
            );
        }
    }


    // ========================================
    // Ankunft an Baustelle
    // ========================================

    markArrived(
        arrivalDate = new Date()
    ) {

        if (!this.journey) {

            return false;
        }


        if (
            this.journey.status !==
            "arrived"
        ) {

            return false;
        }


        // ========================================
        // LKW ist angekommen, aber noch belegt.
        // ========================================

        this.setTruckStatus(
            "unloading"
        );


        this.status =
            "arrived";


        this.transportJob.status =
            "unloading";


        this.arrivedAt =
            new Date(
                arrivalDate
            );


        return true;
    }


    // ========================================
    // Entladen
    // ========================================

    unload(
        date = new Date()
    ) {

        if (
            this.status !==
                "arrived" &&
            this.status !==
                "unloading"
        ) {

            return {

                success:
                    false,

                reason:
                    "Transport ist noch nicht an der Baustelle angekommen"
            };
        }


        this.status =
            "unloading";


        this.setTruckStatus(
            "unloading"
        );


        // ========================================
        // MaterialOrder schreibt das Material
        // tatsächlich dem Baustellenlager gut.
        // ========================================

        const result =
            this.materialOrder
                .completeTransportJob(

                    this.transportJob.id,

                    date
                );


        if (
            !result ||
            result.success !==
            true
        ) {

            // ====================================
            // Bei Entladefehler bleibt der LKW
            // belegt.
            //
            // Das Material darf nicht verschwinden
            // und der LKW darf nicht für einen
            // anderen Auftrag verwendet werden.
            // ====================================

            this.setTruckStatus(
                "waiting"
            );


            this.status =
                "arrived";


            this.error =
                result?.reason ??
                "Entladung fehlgeschlagen";


            return (
                result ??
                {
                    success:
                        false,

                    reason:
                        this.error
                }
            );
        }


        // ========================================
        // Ladung physisch vom LKW entfernen
        // ========================================

        if (
            typeof this.truck.unloadAll ===
            "function"
        ) {

            this.truck.unloadAll();
        }


        // ========================================
        // Journey abschließen
        // ========================================

        if (
            this.journey &&
            typeof this.journey.complete ===
            "function"
        ) {

            this.journey.complete(
                date
            );
        }


        // ========================================
        // Transport abgeschlossen
        // ========================================

        this.transportJob.status =
            "delivered";


        this.status =
            "delivered";


        this.deliveredAt =
            new Date(
                date
            );


        // ========================================
        // Erst JETZT ist der LKW wieder frei.
        // ========================================

        this.setTruckStatus(
            "available"
        );


        return {

            success:
                true,

            materialId:
                this.transportJob
                    .materialId,

            amount:
                this.transportJob
                    .amount,

            weightKg:
                this.transportJob
                    .loadWeightKg,

            orderStatus:
                this.materialOrder
                    .status,

            truckStatus:
                this.truck
                    .status
        };
    }


    // ========================================
    // Fehler
    // ========================================

    fail(
        reason
    ) {

        this.status =
            "failed";


        this.error =
            reason;


        return false;
    }


    // ========================================
    // Restzeit
    // ========================================

    getRemainingTimeText() {

        if (!this.journey) {

            return "Nicht geplant";
        }


        if (
            typeof this.journey
                .getRemainingTimeText ===
            "function"
        ) {

            return (
                this.journey
                    .getRemainingTimeText()
            );
        }


        return "Unbekannt";
    }


    // ========================================
    // Fortschritt
    // ========================================

    getProgressPercent() {

        return (

            this.journey
                ?.progressPercent ??
            0
        );
    }


    // ========================================
    // Ist abgeschlossen?
    // ========================================

    isDelivered() {

        return (
            this.status ===
            "delivered"
        );
    }


    // ========================================
    // Ist aktiv?
    // ========================================

    isActive() {

        return (

            this.status !==
                "delivered" &&

            this.status !==
                "failed"
        );
    }


    // ========================================
    // Übersicht
    // ========================================

    getInfo() {

        return {

            id:
                this.id,

            status:
                this.status,

            error:
                this.error,

            materialOrderId:
                this.materialOrder
                    ?.id ??
                null,

            transportJobId:
                this.transportJob
                    ?.id ??
                null,

            truckId:
                this.truck
                    ?.id ??
                null,

            truckStatus:
                this.truck
                    ?.status ??
                null,

            materialId:
                this.transportJob
                    ?.materialId ??
                null,

            amount:
                this.transportJob
                    ?.amount ??
                0,

            weightKg:
                this.transportJob
                    ?.loadWeightKg ??
                0,

            distanceKm:
                this.transportJob
                    ?.distanceKm ??
                0,

            progressPercent:
                this.getProgressPercent(),

            remainingTimeText:
                this.getRemainingTimeText(),

            startedAt:
                this.startedAt,

            arrivedAt:
                this.arrivedAt,

            deliveredAt:
                this.deliveredAt
        };
    }
}