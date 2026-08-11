// ============================================
// ConstructionTripDelivery.js
// WorldProject
//
// Verbindet einzelne Transportfahrten
// mit einer Baustelle.
//
// Wichtig:
//
// Jede einzelne Fahrt kann Material liefern.
//
// Beispiel:
// Bestellung: 60 t Stahl
//
// Fahrt 1: 25 t → angekommen → +25 t Baustelle
// Fahrt 2: 25 t → noch unterwegs
// Fahrt 3: 10 t → noch nicht gestartet
//
// Die Baustelle kann das bereits gelieferte
// Material sofort verwenden.
// ============================================

export class ConstructionTripDelivery {

    constructor({

        fleetScheduler,

        construction

    }) {

        // ========================================
        // ID
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        // ========================================
        // Transportplanung
        // ========================================

        this.fleetScheduler =
            fleetScheduler;


        // ========================================
        // Bauprojekt
        // ========================================

        this.construction =
            construction;


        // ========================================
        // Material-ID
        // ========================================

        this.materialId =

            fleetScheduler
                ?.transportOrder
                ?.cargoType ??

            null;


        // ========================================
        // Bereits gutgeschriebene Fahrten
        //
        // Verhindert doppelte Materialbuchung.
        // ========================================

        this.creditedTrips =
            new Set();


        // ========================================
        // Gesamtmenge, die bereits tatsächlich
        // auf der Baustelle angekommen ist.
        // ========================================

        this.totalCreditedAmount =
            0;


        // ========================================
        // Historie
        // ========================================

        this.deliveryHistory =
            [];


        // ========================================
        // Status
        // ========================================

        this.status =
            "waiting";


        // waiting
        // receiving
        // completed
        // failed
    }


    // ========================================
    // Grundprüfung
    // ========================================

    isValid() {

        if (
            !this.fleetScheduler
        ) {

            return false;
        }


        if (
            !this.construction
        ) {

            return false;
        }


        if (
            !this.materialId
        ) {

            return false;
        }


        return true;
    }


    // ========================================
    // Prüfen, ob eine Fahrt bereits
    // gutgeschrieben wurde
    // ========================================

    isTripCredited(
        tripNumber
    ) {

        return (
            this.creditedTrips
                .has(
                    tripNumber
                )
        );
    }


    // ========================================
    // Einzelne Fahrt auf Baustelle entladen
    // ========================================

    unloadTrip(
        tripNumber,
        deliveryDate = new Date()
    ) {

        if (
            !this.isValid()
        ) {

            this.status =
                "failed";


            return {

                success:
                    false,

                reason:
                    "Ungültige Lieferverbindung"
            };
        }


        // ------------------------------------
        // Fahrt suchen
        // ------------------------------------

        const trip =
            this.fleetScheduler
                .trips
                .find(

                    item =>
                        item.number ===
                        tripNumber
                );


        if (!trip) {

            return {

                success:
                    false,

                reason:
                    "Fahrt nicht gefunden"
            };
        }


        // ------------------------------------
        // Doppelte Gutschrift verhindern
        // ------------------------------------

        if (
            this.isTripCredited(
                tripNumber
            )
        ) {

            return {

                success:
                    false,

                reason:
                    "Fahrt wurde bereits gutgeschrieben"
            };
        }


        // ------------------------------------
        // Fahrt muss tatsächlich angekommen sein
        // ------------------------------------

        if (
            trip.status !==
            "arrived"
        ) {

            return {

                success:
                    false,

                reason:
                    "Fahrt ist noch nicht angekommen"
            };
        }


        // ------------------------------------
        // Journey muss ebenfalls angekommen sein
        // ------------------------------------

        if (
            trip.journey &&
            trip.journey.status !==
                "arrived"
        ) {

            return {

                success:
                    false,

                reason:
                    "Transportfahrt ist noch nicht am Ziel"
            };
        }


        // ========================================
        // Material auf Baustelle buchen
        // ========================================

        const added =
            this.construction
                .addMaterial(

                    this.materialId,

                    trip.amount
                );


        if (!added) {

            return {

                success:
                    false,

                reason:
                    "Material konnte der Baustelle nicht gutgeschrieben werden"
            };
        }


        // ========================================
        // Fahrt als geliefert markieren
        // ========================================

        const delivered =
            this.fleetScheduler
                .markTripDelivered(

                    tripNumber,

                    deliveryDate
                );


        if (!delivered) {

            // Material wurde bereits gebucht.
            //
            // Deshalb NICHT einfach nochmals
            // buchen.
            //
            // Dieser Zustand sollte später
            // über ein zentrales Transaktions-
            // system vollständig atomar werden.

            return {

                success:
                    false,

                reason:
                    "Fahrt konnte nicht als geliefert markiert werden"
            };
        }


        // ========================================
        // Gutschrift registrieren
        // ========================================

        this.creditedTrips.add(
            tripNumber
        );


        this.totalCreditedAmount +=
            trip.amount;


        // ========================================
        // Historie
        // ========================================

        this.deliveryHistory.push({

            tripNumber,

            materialId:
                this.materialId,

            amount:
                trip.amount,

            deliveredAt:
                new Date(
                    deliveryDate
                )
        });


        // ========================================
        // Fehlendes Material neu berechnen
        // ========================================

        if (
            typeof this.construction
                .updateMissingMaterials ===
                "function"
        ) {

            this.construction
                .updateMissingMaterials();
        }


        // ========================================
        // Prüfen, ob Baustelle wieder
        // weiterarbeiten kann
        // ========================================

        if (
            this.construction.status ===
            "paused_material"
        ) {

            if (
                typeof this.construction
                    .resumeAfterMaterials ===
                    "function"
            ) {

                this.construction
                    .resumeAfterMaterials();
            }
        }


        // ========================================
        // Lieferstatus aktualisieren
        // ========================================

        this.updateStatus();


        return {

            success:
                true,

            tripNumber,

            materialId:
                this.materialId,

            deliveredAmount:
                trip.amount,

            totalCreditedAmount:
                this.totalCreditedAmount,

            remainingAmount:
                this.getRemainingAmount(),

            constructionStatus:
                this.construction.status
        };
    }


    // ========================================
    // Alle angekommenen Fahrten automatisch
    // entladen
    //
    // Praktisch für späteren Spiel-Tick.
    // ========================================

    unloadAllArrivedTrips(
        deliveryDate = new Date()
    ) {

        const results =
            [];


        if (
            !this.isValid()
        ) {

            return results;
        }


        for (
            const trip
            of this.fleetScheduler.trips
        ) {

            // ------------------------------------
            // Noch nicht angekommen
            // ------------------------------------

            if (
                trip.status !==
                "arrived"
            ) {

                continue;
            }


            // ------------------------------------
            // Bereits gutgeschrieben
            // ------------------------------------

            if (
                this.isTripCredited(
                    trip.number
                )
            ) {

                continue;
            }


            const result =
                this.unloadTrip(

                    trip.number,

                    deliveryDate
                );


            results.push(
                result
            );
        }


        return results;
    }


    // ========================================
    // Bereits gelieferte Menge
    // ========================================

    getDeliveredAmount() {

        return (
            this.totalCreditedAmount
        );
    }


    // ========================================
    // Gesamte bestellte Menge
    // ========================================

    getTotalAmount() {

        return (

            this.fleetScheduler
                ?.transportOrder
                ?.amount ??

            0
        );
    }


    // ========================================
    // Noch ausstehende Menge
    // ========================================

    getRemainingAmount() {

        return Math.max(

            this.getTotalAmount() -
            this.getDeliveredAmount(),

            0
        );
    }


    // ========================================
    // Lieferfortschritt in Prozent
    // ========================================

    getDeliveryProgressPercent() {

        const total =
            this.getTotalAmount();


        if (
            total <= 0
        ) {

            return 0;
        }


        return Math.min(

            (
                this.getDeliveredAmount() /
                total
            ) * 100,

            100
        );
    }


    // ========================================
    // Status aktualisieren
    // ========================================

    updateStatus() {

        const total =
            this.getTotalAmount();


        const delivered =
            this.getDeliveredAmount();


        if (
            total <= 0
        ) {

            this.status =
                "failed";


            return;
        }


        if (
            delivered >= total
        ) {

            this.status =
                "completed";


            return;
        }


        if (
            delivered > 0
        ) {

            this.status =
                "receiving";


            return;
        }


        this.status =
            "waiting";
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
            !this.isValid()
        ) {

            this.status =
                "failed";


            return;
        }


        // ------------------------------------
        // Zuerst Transportfahrten aktualisieren
        // ------------------------------------

        this.fleetScheduler
            .update(
                currentDate
            );


        // ------------------------------------
        // Angekommene Fahrten entladen
        // ------------------------------------

        this.unloadAllArrivedTrips(
            currentDate
        );


        // ------------------------------------
        // Status aktualisieren
        // ------------------------------------

        this.updateStatus();
    }


    // ========================================
    // Übersicht
    // ========================================

    getInfo() {

        return {

            id:
                this.id,

            materialId:
                this.materialId,

            status:
                this.status,

            totalAmount:
                this.getTotalAmount(),

            deliveredAmount:
                this.getDeliveredAmount(),

            remainingAmount:
                this.getRemainingAmount(),

            progressPercent:
                this.getDeliveryProgressPercent(),

            creditedTrips:
                Array.from(
                    this.creditedTrips
                ),

            deliveryHistory:
                this.deliveryHistory
        };
    }
}