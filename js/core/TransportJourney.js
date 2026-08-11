// ============================================
// TransportJourney.js
// WorldProject
//
// Laufende Transportfahrt.
//
// Verbindet:
// - Transportauftrag
// - LKW
// - Fahrzeit
// - Abfahrt
// - geplante Ankunft
// - Verzögerungen
// - tatsächliche Ankunft
//
// Status:
// planned
// loading
// driving
// delayed
// arrived
// unloading
// completed
// cancelled
// ============================================

import {
    TransportTiming
} from "./TransportTiming.js";


export class TransportJourney {

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


        // ========================================
        // Zeitberechnung
        // ========================================

        this.timing =
            new TransportTiming(
                timingSettings
            );


        // ========================================
        // Status
        // ========================================

        this.status =
            "planned";


        // ========================================
        // Zeitpunkte
        // ========================================

        this.plannedStartAt =
            null;


        this.actualStartAt =
            null;


        this.plannedArrivalAt =
            null;


        this.currentArrivalAt =
            null;


        this.actualArrivalAt =
            null;


        this.completedAt =
            null;


        // ========================================
        // Verzögerungen
        // ========================================

        this.totalDelayHours =
            0;


        this.delays =
            [];


        // ========================================
        // Fortschritt
        // ========================================

        this.progressPercent =
            0;


        // ========================================
        // Kilometer
        // ========================================

        this.totalDistanceKm =
            this.calculateTotalDistance();


        this.drivenDistanceKm =
            0;
    }


    // ========================================
    // Gesamtdistanz
    //
    // TransportOrder berücksichtigt bereits
    // Anzahl der Fahrten sowie Rückfahrten.
    // ========================================

    calculateTotalDistance() {

        if (
            !this.transportOrder
        ) {

            return 0;
        }


        return (
            this.transportOrder
                .getTotalDrivingKm()
        );
    }


    // ========================================
    // Fahrt planen
    // ========================================

    plan(
        startDate = new Date()
    ) {

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


        const trips =
            this.transportOrder
                .requiredTrips;


        if (
            trips === null ||
            trips <= 0
        ) {

            return false;
        }


        this.plannedStartAt =
            new Date(
                startDate
            );


        this.plannedArrivalAt =
            this.timing
                .calculateArrivalDate({

                    startDate:
                        this.plannedStartAt,

                    distanceKm:
                        this.transportOrder
                            .distanceKm,

                    trips
                });


        this.currentArrivalAt =
            new Date(
                this.plannedArrivalAt
            );


        this.status =
            "planned";


        return true;
    }


    // ========================================
    // Beladung beginnen
    // ========================================

    startLoading() {

        if (
            this.status !==
            "planned"
        ) {

            return false;
        }


        if (
            !this.truck
        ) {

            return false;
        }


        this.status =
            "loading";


        this.truck.setStatus(
            "loading"
        );


        return true;
    }


    // ========================================
    // Fahrt starten
    // ========================================

    startDriving(
        startDate = new Date()
    ) {

        if (
            this.status !==
            "planned" &&
            this.status !==
            "loading"
        ) {

            return false;
        }


        if (
            !this.plannedArrivalAt
        ) {

            const planned =
                this.plan(
                    startDate
                );


            if (!planned) {

                return false;
            }
        }


        this.actualStartAt =
            new Date(
                startDate
            );


        // Falls tatsächliche Abfahrt später
        // erfolgt als geplant, verschiebt sich
        // die Ankunft entsprechend.

        if (
            this.plannedStartAt
        ) {

            const differenceMs =

                this.actualStartAt.getTime() -

                this.plannedStartAt.getTime();


            if (
                differenceMs > 0
            ) {

                const delayHours =

                    differenceMs /

                    (
                        60 *
                        60 *
                        1000
                    );


                this.addDelay(
                    delayHours,
                    "Verspätete Abfahrt"
                );
            }
        }


        this.status =
            "driving";


        this.truck.setStatus(
            "driving"
        );


        this.transportOrder
            .setStatus(
                "driving"
            );


        return true;
    }


    // ========================================
    // Verzögerung hinzufügen
    //
    // Später mögliche Gründe:
    //
    // - Stau
    // - Unfall
    // - Straßensperrung
    // - Wetter
    // - Lenkzeit
    // - Fahrzeugdefekt
    // - Wartezeit Lieferant
    // ========================================

    addDelay(
        hours,
        reason = "Verzögerung"
    ) {

        if (
            typeof hours !==
            "number" ||
            hours <= 0
        ) {

            return false;
        }


        this.totalDelayHours +=
            hours;


        this.delays.push({

            reason,

            hours,

            createdAt:
                new Date()
        });


        if (
            this.currentArrivalAt
        ) {

            this.currentArrivalAt =
                this.timing
                    .addDelay(

                        this.currentArrivalAt,

                        hours
                    );
        }


        if (
            this.status ===
            "driving"
        ) {

            this.status =
                "delayed";


            this.transportOrder
                .setStatus(
                    "delayed"
                );
        }


        return true;
    }


    // ========================================
    // Nach Verzögerung weiterfahren
    // ========================================

    resumeDriving() {

        if (
            this.status !==
            "delayed"
        ) {

            return false;
        }


        this.status =
            "driving";


        this.transportOrder
            .setStatus(
                "driving"
            );


        if (
            this.truck
        ) {

            this.truck.setStatus(
                "driving"
            );
        }


        return true;
    }


    // ========================================
    // Fortschritt anhand der Zeit berechnen
    // ========================================

    updateProgress(
        currentDate = new Date()
    ) {

        if (
            !this.actualStartAt ||
            !this.currentArrivalAt
        ) {

            return 0;
        }


        const start =
            this.actualStartAt
                .getTime();


        const end =
            this.currentArrivalAt
                .getTime();


        const now =
            currentDate
                .getTime();


        const totalDuration =
            end -
            start;


        if (
            totalDuration <= 0
        ) {

            this.progressPercent =
                100;


            this.drivenDistanceKm =
                this.totalDistanceKm;


            return 100;
        }


        const elapsed =
            now -
            start;


        const progress =

            elapsed /
            totalDuration *
            100;


        this.progressPercent =
            Math.max(

                0,

                Math.min(
                    100,
                    progress
                )
            );


        this.drivenDistanceKm =

            this.totalDistanceKm *

            (
                this.progressPercent /
                100
            );


        return (
            this.progressPercent
        );
    }


    // ========================================
    // Regelmäßiges Update
    //
    // Wird später vom Spiel-Tick aufgerufen.
    // ========================================

    update(
        currentDate = new Date()
    ) {

        if (
            this.status !==
            "driving" &&
            this.status !==
            "delayed"
        ) {

            return;
        }


        this.updateProgress(
            currentDate
        );


        // ------------------------------------
        // Ankunft erreicht?
        // ------------------------------------

        if (
            this.currentArrivalAt &&
            currentDate.getTime() >=
            this.currentArrivalAt.getTime()
        ) {

            this.markArrived(
                currentDate
            );
        }
    }


    // ========================================
    // Ankunft
    // ========================================

    markArrived(
        arrivalDate = new Date()
    ) {

        if (
            this.status !==
            "driving" &&
            this.status !==
            "delayed"
        ) {

            return false;
        }


        this.actualArrivalAt =
            new Date(
                arrivalDate
            );


        this.progressPercent =
            100;


        this.drivenDistanceKm =
            this.totalDistanceKm;


        this.status =
            "arrived";


        this.transportOrder
            .setStatus(
                "unloading"
            );


        if (
            this.truck
        ) {

            // Kilometer tatsächlich
            // auf den LKW buchen.

            this.truck.addKilometers(
                this.totalDistanceKm
            );


            this.truck.setStatus(
                "unloading"
            );
        }


        return true;
    }


    // ========================================
    // Entladung starten
    // ========================================

    startUnloading() {

        if (
            this.status !==
            "arrived"
        ) {

            return false;
        }


        this.status =
            "unloading";


        if (
            this.truck
        ) {

            this.truck.setStatus(
                "unloading"
            );
        }


        return true;
    }


    // ========================================
    // Transport vollständig abschließen
    // ========================================

    complete(
        completionDate = new Date()
    ) {

        if (
            this.status !==
            "arrived" &&
            this.status !==
            "unloading"
        ) {

            return false;
        }


        this.completedAt =
            new Date(
                completionDate
            );


        this.status =
            "completed";


        this.transportOrder
            .setStatus(
                "completed"
            );


        if (
            this.truck
        ) {

            this.truck.setStatus(
                "available"
            );
        }


        return true;
    }


    // ========================================
    // Fahrt abbrechen
    // ========================================

    cancel() {

        if (
            this.status ===
            "completed"
        ) {

            return false;
        }


        this.status =
            "cancelled";


        this.transportOrder
            ?.setStatus(
                "cancelled"
            );


        if (
            this.truck
        ) {

            this.truck.setStatus(
                "available"
            );
        }


        return true;
    }


    // ========================================
    // Restzeit
    // ========================================

    getRemainingHours() {

        if (
            !this.currentArrivalAt
        ) {

            return 0;
        }


        return (
            this.timing
                .getRemainingHours(
                    this.currentArrivalAt
                )
        );
    }


    // ========================================
    // Restzeit als Text
    // ========================================

    getRemainingTimeText() {

        if (
            !this.currentArrivalAt
        ) {

            return "Nicht geplant";
        }


        return (
            this.timing
                .getRemainingTimeText(
                    this.currentArrivalAt
                )
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

            truckId:
                this.truck
                    ?.id ??
                null,

            totalDistanceKm:
                this.totalDistanceKm,

            drivenDistanceKm:
                this.drivenDistanceKm,

            progressPercent:
                this.progressPercent,

            plannedStartAt:
                this.plannedStartAt,

            actualStartAt:
                this.actualStartAt,

            plannedArrivalAt:
                this.plannedArrivalAt,

            currentArrivalAt:
                this.currentArrivalAt,

            actualArrivalAt:
                this.actualArrivalAt,

            totalDelayHours:
                this.totalDelayHours,

            delays:
                this.delays,

            remainingHours:
                this.getRemainingHours(),

            remainingTimeText:
                this.getRemainingTimeText()
        };
    }
}