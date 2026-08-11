// ============================================
// TransportFleetScheduler.js
// WorldProject
//
// Zerlegt einen Transportauftrag in echte,
// einzelne Fahrten.
//
// Beispiel:
//
// 60 t Stahl
// LKW-Nutzlast: 25 t
//
// Fahrt 1 = 25 t
// Fahrt 2 = 25 t
// Fahrt 3 = 10 t
//
// Jede Fahrt besitzt:
// - eigene Menge
// - eigenes Gewicht
// - eigene Palettenzahl
// - eigenen Status
// - eigenen TransportJourney
//
// Dadurch können Teillieferungen bereits
// auf der Baustelle ankommen.
// ============================================

import {
    TransportJourney
} from "./TransportJourney.js";


export class TransportFleetScheduler {

    constructor({

        transportOrder,

        timingSettings = {}

    }) {

        // ========================================
        // Grunddaten
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        this.transportOrder =
            transportOrder;


        this.truck =
            transportOrder
                ?.truck ??
            null;


        this.timingSettings =
            timingSettings;


        // ========================================
        // Einzelne Fahrten
        // ========================================

        this.trips =
            [];


        // ========================================
        // Status
        // ========================================

        this.status =
            "created";


        // created
        // planned
        // running
        // completed
        // failed
    }


    // ========================================
    // Grundprüfung
    // ========================================

    isValid() {

        if (
            !this.transportOrder
        ) {

            return false;
        }


        if (
            !this.truck
        ) {

            return false;
        }


        if (
            !this.transportOrder
                .cargo
        ) {

            return false;
        }


        return true;
    }


    // ========================================
    // Maximale Menge pro Fahrt berechnen
    //
    // Entscheidend ist die zuerst erreichte
    // Kapazitätsgrenze:
    //
    // - Gewicht
    // - Volumen
    // - Paletten
    // ========================================

    calculateMaximumAmountPerTrip() {

        if (
            !this.isValid()
        ) {

            return 0;
        }


        const order =
            this.transportOrder;


        const truck =
            this.truck;


        const totalAmount =
            order.amount;


        if (
            totalAmount <= 0
        ) {

            return 0;
        }


        const limits =
            [];


        // ========================================
        // Gewichtslimit
        // ========================================

        if (
            order.cargo.weightKg > 0
        ) {

            const weightPerUnit =

                order.cargo.weightKg /
                totalAmount;


            if (
                weightPerUnit > 0
            ) {

                const amountByWeight =

                    truck
                        .capacity
                        .getMaxPayloadKg()

                    /

                    weightPerUnit;


                limits.push(
                    amountByWeight
                );
            }
        }


        // ========================================
        // Volumenlimit
        // ========================================

        if (
            order.cargo.volumeM3 > 0 &&
            truck.capacity.maxVolumeM3 !==
                null &&
            truck.capacity.maxVolumeM3 > 0
        ) {

            const volumePerUnit =

                order.cargo.volumeM3 /
                totalAmount;


            if (
                volumePerUnit > 0
            ) {

                const amountByVolume =

                    truck.capacity
                        .maxVolumeM3

                    /

                    volumePerUnit;


                limits.push(
                    amountByVolume
                );
            }
        }


        // ========================================
        // Palettenlimit
        // ========================================

        if (
            order.cargo.pallets > 0 &&
            truck.capacity.maxPallets !==
                null &&
            truck.capacity.maxPallets > 0
        ) {

            const unitsPerPallet =

                totalAmount /
                order.cargo.pallets;


            const amountByPallets =

                unitsPerPallet *

                truck.capacity
                    .maxPallets;


            limits.push(
                amountByPallets
            );
        }


        // ========================================
        // Keine Grenze gefunden
        // ========================================

        if (
            limits.length === 0
        ) {

            return totalAmount;
        }


        // ========================================
        // Kleinste Grenze entscheidet
        // ========================================

        return Math.min(
            ...limits
        );
    }


    // ========================================
    // Transport in einzelne Fahrten zerlegen
    // ========================================

    createTrips() {

        if (
            !this.isValid()
        ) {

            this.status =
                "failed";


            return false;
        }


        // Alte Planung löschen

        this.trips =
            [];


        const totalAmount =
            this.transportOrder
                .amount;


        const maxAmountPerTrip =
            this.calculateMaximumAmountPerTrip();


        if (
            maxAmountPerTrip <= 0
        ) {

            this.status =
                "failed";


            return false;
        }


        let remainingAmount =
            totalAmount;


        let tripNumber =
            1;


        // ========================================
        // Einzelne Fahrten erzeugen
        // ========================================

        while (
            remainingAmount > 0
        ) {

            const tripAmount =
                Math.min(

                    remainingAmount,

                    maxAmountPerTrip
                );


            const fraction =

                tripAmount /
                totalAmount;


            // ------------------------------------
            // Gewicht dieser Fahrt
            // ------------------------------------

            const weightKg =

                this.transportOrder
                    .cargo.weightKg *

                fraction;


            // ------------------------------------
            // Volumen dieser Fahrt
            // ------------------------------------

            const volumeM3 =

                this.transportOrder
                    .cargo.volumeM3 *

                fraction;


            // ------------------------------------
            // Paletten dieser Fahrt
            //
            // Ganze Paletten erforderlich.
            // ------------------------------------

            let pallets =
                0;


            if (
                this.transportOrder
                    .cargo.pallets > 0
            ) {

                pallets =
                    Math.ceil(

                        this.transportOrder
                            .cargo.pallets *

                        fraction
                    );
            }


            // ====================================
            // Fahrtobjekt
            // ====================================

            const trip = {

                id:
                    this.id +
                    "-trip-" +
                    tripNumber,

                number:
                    tripNumber,

                amount:
                    tripAmount,

                weightKg,

                volumeM3,

                pallets,

                status:
                    "planned",

                journey:
                    null,

                delivered:
                    false,

                deliveredAmount:
                    0,

                createdAt:
                    new Date(),

                startedAt:
                    null,

                deliveredAt:
                    null
            };


            this.trips.push(
                trip
            );


            remainingAmount -=
                tripAmount;


            tripNumber++;
        }


        this.status =
            "planned";


        return this.trips;
    }


    // ========================================
    // Journey für eine einzelne Fahrt erzeugen
    // ========================================

    createJourneyForTrip(
        trip
    ) {

        if (
            !trip
        ) {

            return null;
        }


        // ------------------------------------
        // TransportOrder-kompatibles
        // Teilobjekt erzeugen
        // ------------------------------------

        const tripTransportOrder = {

            truck:
                this.truck,

            distanceKm:
                this.transportOrder
                    .distanceKm,

            requiredTrips:
                1,

            status:
                "planned",

            setStatus(status) {

                this.status =
                    status;
            },

            getTotalDrivingKm: () => {

                return (
                    this.transportOrder
                        .distanceKm *
                    2
                );
            }
        };


        const journey =
            new TransportJourney({

                transportOrder:
                    tripTransportOrder,

                timingSettings:
                    this.timingSettings
            });


        trip.journey =
            journey;


        return journey;
    }


    // ========================================
    // Bestimmte Fahrt starten
    // ========================================

    startTrip(
        tripNumber,
        startDate = new Date()
    ) {

        const trip =
            this.trips.find(

                item =>
                    item.number ===
                    tripNumber
            );


        if (!trip) {

            return false;
        }


        if (
            trip.status !==
            "planned"
        ) {

            return false;
        }


        // ------------------------------------
        // Derselbe LKW kann nicht gleichzeitig
        // mehrere Fahrten durchführen.
        // ------------------------------------

        if (
            !this.truck.isAvailable()
        ) {

            return false;
        }


        let journey =
            trip.journey;


        if (!journey) {

            journey =
                this.createJourneyForTrip(
                    trip
                );
        }


        if (!journey) {

            return false;
        }


        // ------------------------------------
        // Fahrt planen
        // ------------------------------------

        const planned =
            journey.plan(
                startDate
            );


        if (!planned) {

            return false;
        }


        // ------------------------------------
        // Beladung
        // ------------------------------------

        journey.startLoading();


        // ------------------------------------
        // Fahrt starten
        // ------------------------------------

        const started =
            journey.startDriving(
                startDate
            );


        if (!started) {

            return false;
        }


        trip.status =
            "driving";


        trip.startedAt =
            new Date(
                startDate
            );


        this.status =
            "running";


        return true;
    }


    // ========================================
    // Einzelne Fahrt als geliefert markieren
    // ========================================

    markTripDelivered(
        tripNumber,
        deliveryDate = new Date()
    ) {

        const trip =
            this.trips.find(

                item =>
                    item.number ===
                    tripNumber
            );


        if (!trip) {

            return false;
        }


        if (
            trip.delivered
        ) {

            return false;
        }


        // ------------------------------------
        // Journey muss angekommen sein
        // ------------------------------------

        if (
            trip.journey &&
            trip.journey.status !==
                "arrived" &&
            trip.journey.status !==
                "unloading"
        ) {

            return false;
        }


        trip.delivered =
            true;


        trip.deliveredAmount =
            trip.amount;


        trip.deliveredAt =
            new Date(
                deliveryDate
            );


        trip.status =
            "delivered";


        // ------------------------------------
        // Journey abschließen
        // ------------------------------------

        if (
            trip.journey
        ) {

            trip.journey.complete(
                deliveryDate
            );
        }


        // ------------------------------------
        // Prüfen, ob alle Fahrten fertig sind
        // ------------------------------------

        this.updateCompletionStatus();


        return true;
    }


    // ========================================
    // Gesamte bereits gelieferte Menge
    // ========================================

    getDeliveredAmount() {

        return this.trips.reduce(

            (
                total,
                trip
            ) => {

                return (
                    total +
                    trip.deliveredAmount
                );

            },

            0
        );
    }


    // ========================================
    // Noch offene Menge
    // ========================================

    getRemainingAmount() {

        return Math.max(

            this.transportOrder.amount -
            this.getDeliveredAmount(),

            0
        );
    }


    // ========================================
    // Anzahl abgeschlossener Fahrten
    // ========================================

    getCompletedTripCount() {

        return this.trips.filter(

            trip =>
                trip.delivered ===
                true

        ).length;
    }


    // ========================================
    // Prüfen, ob alles geliefert wurde
    // ========================================

    updateCompletionStatus() {

        if (
            this.trips.length === 0
        ) {

            return false;
        }


        const allDelivered =
            this.trips.every(

                trip =>
                    trip.delivered ===
                    true
            );


        if (
            allDelivered
        ) {

            this.status =
                "completed";


            return true;
        }


        return false;
    }


    // ========================================
    // Regelmäßiges Update aller Fahrten
    // ========================================

    update(
        currentDate = new Date()
    ) {

        for (
            const trip
            of this.trips
        ) {

            if (
                !trip.journey
            ) {

                continue;
            }


            trip.journey.update(
                currentDate
            );


            if (
                trip.journey.status ===
                "arrived"
            ) {

                trip.status =
                    "arrived";
            }
        }
    }


    // ========================================
    // Nächste noch nicht gestartete Fahrt
    // ========================================

    getNextPlannedTrip() {

        return (
            this.trips.find(

                trip =>
                    trip.status ===
                    "planned"

            ) ?? null
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

            totalTrips:
                this.trips.length,

            completedTrips:
                this.getCompletedTripCount(),

            totalAmount:
                this.transportOrder
                    ?.amount ??
                0,

            deliveredAmount:
                this.getDeliveredAmount(),

            remainingAmount:
                this.getRemainingAmount(),

            trips:
                this.trips.map(

                    trip => ({

                        number:
                            trip.number,

                        amount:
                            trip.amount,

                        weightKg:
                            trip.weightKg,

                        volumeM3:
                            trip.volumeM3,

                        pallets:
                            trip.pallets,

                        status:
                            trip.status,

                        delivered:
                            trip.delivered,

                        deliveredAmount:
                            trip.deliveredAmount,

                        startedAt:
                            trip.startedAt,

                        deliveredAt:
                            trip.deliveredAt
                    })
                )
        };
    }
}