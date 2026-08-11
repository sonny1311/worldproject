// ============================================
// ConstructionSupervisor.js
// WorldProject
//
// Bauleiter für ein konkretes Bauprojekt.
//
// Aufgaben:
// - täglichen Materialbedarf prüfen
// - Lieferantenangebote vergleichen
// - Transportkosten berücksichtigen
// - Lieferzeit berücksichtigen
// - regionale Lieferanten bevorzugen,
//   wenn wirtschaftlich sinnvoll
// - Baustillstand möglichst verhindern
// - Einkauf NUR vorschlagen
//
// Der Spieler muss jeden Einkauf bestätigen.
// ============================================

export class ConstructionSupervisor {

    constructor({

        construction,

        materialSchedule,

        manager = null

    }) {

        // ========================================
        // Zugehöriges Bauprojekt
        // ========================================

        this.construction =
            construction;


        // ========================================
        // Tages-Materialplanung
        // ========================================

        this.materialSchedule =
            materialSchedule;


        // ========================================
        // Gemieteter Manager-Vertrag
        //
        // Kann später unser Manager-Objekt sein.
        // ========================================

        this.manager =
            manager;


        // ========================================
        // Letzter Einkaufsvorschlag
        // ========================================

        this.lastProposal =
            null;


        // ========================================
        // Historie
        // ========================================

        this.proposals =
            [];


        // ========================================
        // Einstellungen
        // ========================================

        this.settings = {

            // ------------------------------------
            // Lieferanten im Nahbereich
            //
            // Wird später je Region/Land
            // angepasst.
            // ------------------------------------

            localDistanceKm:
                100,


            // ------------------------------------
            // Sehr großer Zeitaufschlag,
            // wenn das Material nicht rechtzeitig
            // ankommen würde.
            //
            // Dadurch wird ein billiges,
            // aber zu spätes Angebot fast immer
            // schlechter bewertet.
            // ------------------------------------

            lateDeliveryPenalty:
                1000000,


            // ------------------------------------
            // Kleine Bevorzugung regionaler
            // Lieferanten.
            //
            // KEIN harter Zwang.
            // Ein deutlich günstigeres Angebot
            // darf trotzdem weiter entfernt sein.
            // ------------------------------------

            localSupplierBonusPercent:
                1
        };
    }


    // ========================================
    // Ist der Bauleiter aktiv?
    // ========================================

    isActive() {

        // Falls später ein Managervertrag
        // zugewiesen wurde.

        if (
            this.manager &&
            typeof this.manager.isActive ===
                "function"
        ) {

            return (
                this.manager.isActive()
            );
        }


        // Für Entwicklungs-/Testzwecke
        // funktioniert das System auch
        // ohne Managerobjekt.

        return true;
    }


    // ========================================
    // Tagesbedarf holen
    // ========================================

    getDailyRequirement() {

        if (
            !this.materialSchedule
        ) {

            return {};
        }


        return (
            this.materialSchedule
                .getDailyMaterialRequirement()
        );
    }


    // ========================================
    // Fehlenden Tagesbedarf holen
    // ========================================

    getMissingForNextDay() {

        if (
            !this.materialSchedule
        ) {

            return {};
        }


        return (
            this.materialSchedule
                .getMissingForNextDay()
        );
    }


    // ========================================
    // Prüfen, ob Einkauf nötig ist
    // ========================================

    needsPurchase() {

        return (
            Object.keys(
                this.getMissingForNextDay()
            ).length > 0
        );
    }


    // ========================================
    // Einzelnes Lieferantenangebot bewerten
    //
    // Wichtig:
    //
    // Bewertet wird NICHT nur der Warenpreis.
    //
    // Berücksichtigt werden:
    // - Preis frei Baustelle
    // - Transport
    // - Entfernung
    // - Lieferzeit
    // - drohender Baustillstand
    // ========================================

    evaluateOffer({

        offer,

        amount,

        neededWithinHours = 24,

        transportSettings = {},

        transportOptions = {}

    }) {

        if (
            !offer
        ) {

            return null;
        }


        // ------------------------------------
        // Komplettes Angebot kalkulieren
        // ------------------------------------

        const calculation =
            offer.calculateTotalOffer(

                amount,

                transportSettings,

                transportOptions
            );


        if (
            !calculation ||
            calculation.success !== true
        ) {

            return {

                valid:
                    false,

                offer,

                calculation
            };
        }


        // ------------------------------------
        // Geschätzte Lieferzeit
        // ------------------------------------

        const deliveryHours =
            calculation
                .estimatedTransportHours ??
            0;


        // ------------------------------------
        // Kommt Lieferung rechtzeitig?
        // ------------------------------------

        const onTime =
            deliveryHours <=
            neededWithinHours;


        // ------------------------------------
        // Nahbereich?
        // ------------------------------------

        const local =
            offer.distanceKm <=
            this.settings
                .localDistanceKm;


        // ------------------------------------
        // Grundwert:
        // tatsächliche Gesamtkosten
        // ------------------------------------

        let score =
            calculation.totalCost;


        // ------------------------------------
        // Regionalen Lieferanten leicht
        // bevorzugen.
        // ------------------------------------

        if (local) {

            score *=
                (
                    1 -
                    (
                        this.settings
                            .localSupplierBonusPercent /
                        100
                    )
                );
        }


        // ------------------------------------
        // Lieferung kommt zu spät.
        //
        // Sehr hoher Aufschlag, da sonst
        // Baustillstand droht.
        // ------------------------------------

        if (!onTime) {

            const lateHours =
                deliveryHours -
                neededWithinHours;


            score +=

                this.settings
                    .lateDeliveryPenalty

                +

                (
                    lateHours *
                    1000
                );
        }


        return {

            valid:
                true,

            offer,

            calculation,

            score,

            onTime,

            local,

            deliveryHours,

            neededWithinHours,

            wouldDelayConstruction:
                !onTime
        };
    }


    // ========================================
    // Bestes Angebot für EIN Material finden
    // ========================================

    findBestOfferForMaterial({

        materialId,

        amount,

        offers,

        neededWithinHours = 24,

        transportSettings = {},

        transportOptions = {}

    }) {

        if (
            !Array.isArray(
                offers
            )
        ) {

            return null;
        }


        const candidates =
            [];


        for (
            const offer
            of offers
        ) {

            // ------------------------------------
            // Nur das passende Material
            // ------------------------------------

            if (
                offer.materialId !==
                materialId
            ) {

                continue;
            }


            // ------------------------------------
            // Angebot bewerten
            // ------------------------------------

            const evaluation =
                this.evaluateOffer({

                    offer,

                    amount,

                    neededWithinHours,

                    transportSettings,

                    transportOptions
                });


            if (
                !evaluation ||
                evaluation.valid !== true
            ) {

                continue;
            }


            candidates.push(
                evaluation
            );
        }


        if (
            candidates.length === 0
        ) {

            return null;
        }


        // ------------------------------------
        // Bester Score zuerst
        // ------------------------------------

        candidates.sort(
            (a, b) =>
                a.score -
                b.score
        );


        return {

            best:
                candidates[0],

            alternatives:
                candidates.slice(
                    1
                )
        };
    }


    // ========================================
    // Einkaufsvorschlag für den nächsten
    // Bautag erstellen
    // ========================================

    createDailyPurchaseProposal({

        offersByMaterial = {},

        neededWithinHours = 24,

        transportSettings = {},

        transportOptions = {}

    } = {}) {

        // ------------------------------------
        // Bauleiter muss aktiv sein
        // ------------------------------------

        if (
            !this.isActive()
        ) {

            return {

                success:
                    false,

                reason:
                    "Bauleiter nicht aktiv"
            };
        }


        // ------------------------------------
        // Fehlendes Material
        // ------------------------------------

        const missing =
            this.getMissingForNextDay();


        // ------------------------------------
        // Nichts fehlt
        // ------------------------------------

        if (
            Object.keys(
                missing
            ).length === 0
        ) {

            return {

                success:
                    true,

                purchaseRequired:
                    false,

                message:
                    "Für den nächsten Bautag ist ausreichend Material vorhanden.",

                items:
                    [],

                totalCost:
                    0
            };
        }


        const proposalItems =
            [];


        let totalCost =
            0;


        let allMaterialsAvailable =
            true;


        // ========================================
        // Jedes fehlende Material bearbeiten
        // ========================================

        for (
            const materialId
            in missing
        ) {

            const amount =
                missing[
                    materialId
                ];


            const offers =
                offersByMaterial[
                    materialId
                ] ?? [];


            const result =
                this.findBestOfferForMaterial({

                    materialId,

                    amount,

                    offers,

                    neededWithinHours,

                    transportSettings,

                    transportOptions
                });


            // ------------------------------------
            // Kein passendes Angebot
            // ------------------------------------

            if (!result) {

                allMaterialsAvailable =
                    false;


                proposalItems.push({

                    materialId,

                    amount,

                    found:
                        false,

                    message:
                        "Kein geeignetes Lieferantenangebot gefunden."
                });


                continue;
            }


            const best =
                result.best;


            totalCost +=
                best.calculation
                    .totalCost;


            proposalItems.push({

                materialId,

                amount,

                found:
                    true,

                supplier:
                    best.calculation
                        .supplier,

                distanceKm:
                    best.offer
                        .distanceKm,

                goodsCost:
                    best.calculation
                        .goodsCost,

                transportCost:
                    best.calculation
                        .transportCost,

                totalCost:
                    best.calculation
                        .totalCost,

                deliveredUnitCost:
                    best.calculation
                        .deliveredUnitCost,

                requiredTrips:
                    best.calculation
                        .requiredTrips,

                deliveryHours:
                    best.deliveryHours,

                local:
                    best.local,

                onTime:
                    best.onTime,

                wouldDelayConstruction:
                    best.wouldDelayConstruction,

                selectedOffer:
                    best.offer,

                transportOrder:
                    best.calculation
                        .transportOrder,

                alternatives:
                    result.alternatives
            });
        }


        // ========================================
        // Gesamtvorschlag
        // ========================================

        const proposal = {

            id:
                Date.now() +
                Math.random(),

            createdAt:
                new Date(),

            success:
                true,

            purchaseRequired:
                true,

            allMaterialsAvailable,

            items:
                proposalItems,

            totalCost,

            // ------------------------------------
            // WICHTIG:
            //
            // Noch NICHT gekauft.
            //
            // Spieler muss bestätigen.
            // ------------------------------------

            confirmed:
                false,

            status:
                "waiting_for_player"
        };


        this.lastProposal =
            proposal;


        this.proposals.push(
            proposal
        );


        return proposal;
    }


    // ========================================
    // Spieler bestätigt den Vorschlag
    //
    // Hier wird NOCH KEIN Geld abgezogen.
    //
    // Später übernimmt ein Einkaufs-/Finanz-
    // system die eigentliche Bestellung.
    // ========================================

    confirmProposal(
        proposal
    ) {

        if (
            !proposal
        ) {

            return false;
        }


        if (
            proposal.status !==
            "waiting_for_player"
        ) {

            return false;
        }


        if (
            proposal.allMaterialsAvailable !==
            true
        ) {

            return false;
        }


        proposal.confirmed =
            true;


        proposal.status =
            "confirmed";


        proposal.confirmedAt =
            new Date();


        return true;
    }


    // ========================================
    // Spieler lehnt Vorschlag ab
    // ========================================

    rejectProposal(
        proposal
    ) {

        if (
            !proposal
        ) {

            return false;
        }


        if (
            proposal.status !==
            "waiting_for_player"
        ) {

            return false;
        }


        proposal.confirmed =
            false;


        proposal.status =
            "rejected";


        proposal.rejectedAt =
            new Date();


        return true;
    }
}