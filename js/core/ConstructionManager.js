// ============================================
// ConstructionManager.js
// WorldProject
//
// Bauleiter für aktive Bauprojekte.
//
// Aufgaben:
// - täglichen Baustoffbedarf prüfen
// - fehlende Materialien erkennen
// - Lieferantenangebote suchen
// - Warenpreis + Transportkosten vergleichen
// - Entfernung und Lieferzeit berücksichtigen
// - Nahbereich bevorzugen
// - Einkaufsvorschlag erstellen
//
// WICHTIG:
//
// Der Bauleiter gibt NICHT automatisch Geld aus.
//
// Spieler muss den Einkauf bestätigen.
// ============================================

export class ConstructionManager {

    constructor({

        construction,

        market = null,

        company = null,

        settings = {}

    }) {

        // ========================================
        // ID
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        // ========================================
        // Bauprojekt
        // ========================================

        this.construction =
            construction;


        // ========================================
        // Markt
        // ========================================

        this.market =
            market;


        // ========================================
        // Unternehmen
        // ========================================

        this.company =
            company;


        // ========================================
        // Einstellungen
        // ========================================

        this.settings = {

            // Nahbereich bevorzugen

            preferredLocalRadiusKm:
                settings.preferredLocalRadiusKm ??
                100,


            // Erweiterter Suchbereich

            extendedRadiusKm:
                settings.extendedRadiusKm ??
                300,


            // Maximale Suche

            maximumSearchRadiusKm:
                settings.maximumSearchRadiusKm ??
                1000,


            // Gewichtungen

            priceWeight:
                settings.priceWeight ??
                1.0,

            transportWeight:
                settings.transportWeight ??
                1.0,

            distanceWeight:
                settings.distanceWeight ??
                0.15,

            deliveryTimeWeight:
                settings.deliveryTimeWeight ??
                0.25
        };


        // ========================================
        // Status
        // ========================================

        this.status =
            "idle";


        // ========================================
        // Tagesbedarf
        // ========================================

        this.dailyRequirements =
            [];


        // ========================================
        // Fehlendes Material
        // ========================================

        this.missingMaterials =
            [];


        // ========================================
        // Einkaufsvorschlag
        // ========================================

        this.currentProposal =
            null;


        // ========================================
        // Historie
        // ========================================

        this.history =
            [];
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
    // Tagesbedarf von Construction holen
    // ========================================

    getDailyRequirements() {

        if (
            !this.construction
        ) {

            return [];
        }


        if (
            typeof this.construction
                .getDailyMaterialRequirements ===
            "function"
        ) {

            const requirements =
                this.construction
                    .getDailyMaterialRequirements();


            return (
                Array.isArray(
                    requirements
                )
                    ? requirements
                    : []
            );
        }


        return [];
    }


    // ========================================
    // Materialbestand Baustelle
    // ========================================

    getAvailableMaterialAmount(
        materialId
    ) {

        if (
            !this.construction
        ) {

            return 0;
        }


        if (
            typeof this.construction
                .getMaterialAmount ===
            "function"
        ) {

            return (
                this.construction
                    .getMaterialAmount(
                        materialId
                    ) ?? 0
            );
        }


        return (
            this.construction
                .materials
                ?.available
                ?.[materialId] ??
            0
        );
    }


    // ========================================
    // Bereits bestelltes Material
    // ========================================

    getOrderedMaterialAmount(
        materialId
    ) {

        if (
            typeof this.construction
                ?.getOrderedMaterialAmount ===
            "function"
        ) {

            return (
                this.construction
                    .getOrderedMaterialAmount(
                        materialId
                    ) ?? 0
            );
        }


        return (
            this.construction
                ?.materials
                ?.ordered
                ?.[materialId] ??
            0
        );
    }


    // ========================================
    // Material unterwegs
    // ========================================

    getInTransitMaterialAmount(
        materialId
    ) {

        if (
            typeof this.construction
                ?.getInTransitMaterialAmount ===
            "function"
        ) {

            return (
                this.construction
                    .getInTransitMaterialAmount(
                        materialId
                    ) ?? 0
            );
        }


        return (
            this.construction
                ?.materials
                ?.inTransit
                ?.[materialId] ??
            0
        );
    }


    // ========================================
    // Fehlenden Tagesbedarf berechnen
    //
    // Wichtig:
    //
    // Verfügbar zählt als wirklich da.
    //
    // Bestellt / unterwegs wird separat
    // angezeigt, aber gilt NICHT als
    // Baustellenbestand.
    // ========================================

    calculateMissingMaterials() {

        this.status =
            "checking";


        this.dailyRequirements =
            this.getDailyRequirements();


        this.missingMaterials =
            [];


        for (
            const requirement
            of this.dailyRequirements
        ) {

            if (!requirement) {

                continue;
            }


            const materialId =

                requirement.materialId ??
                requirement.id;


            const requiredAmount =

                requirement.amount ??
                requirement.requiredAmount ??
                0;


            if (
                !materialId ||
                requiredAmount <= 0
            ) {

                continue;
            }


            const availableAmount =
                this.getAvailableMaterialAmount(
                    materialId
                );


            const orderedAmount =
                this.getOrderedMaterialAmount(
                    materialId
                );


            const inTransitAmount =
                this.getInTransitMaterialAmount(
                    materialId
                );


            const missingAmount =
                Math.max(

                    requiredAmount -
                    availableAmount,

                    0
                );


            if (
                missingAmount <= 0
            ) {

                continue;
            }


            this.missingMaterials.push({

                materialId,

                name:
                    requirement.name ??
                    materialId,

                unit:
                    requirement.unit ??
                    null,

                requiredAmount,

                availableAmount,

                orderedAmount,

                inTransitAmount,

                missingAmount
            });
        }


        return this.missingMaterials;
    }


    // ========================================
    // Marktangebote suchen
    // ========================================

    getMarketOffers(
        materialId,
        amount
    ) {

        if (
            !this.market
        ) {

            return [];
        }


        if (
            typeof this.market
                .findMaterialOffers ===
            "function"
        ) {

            const offers =
                this.market
                    .findMaterialOffers({

                        materialId,

                        amount,

                        maximumDistanceKm:
                            this.settings
                                .maximumSearchRadiusKm
                    });


            return (
                Array.isArray(
                    offers
                )
                    ? offers
                    : []
            );
        }


        if (
            typeof this.market
                .findOffers ===
            "function"
        ) {

            const offers =
                this.market
                    .findOffers({

                        productId:
                            materialId,

                        amount
                    });


            return (
                Array.isArray(
                    offers
                )
                    ? offers
                    : []
            );
        }


        return [];
    }


    // ========================================
    // Warenpreis
    // ========================================

    calculateMaterialPrice(
        offer,
        amount
    ) {

        if (!offer) {

            return Infinity;
        }


        const pricePerUnit =

            offer.pricePerUnit ??
            offer.unitPrice ??
            offer.price ??
            0;


        return (
            pricePerUnit *
            amount
        );
    }


    // ========================================
    // Transportkosten
    // ========================================

    getTransportCost(
        offer
    ) {

        return Math.max(

            offer
                ?.transportCost ??
            0,

            0
        );
    }


    // ========================================
    // Entfernung
    // ========================================

    getDistance(
        offer
    ) {

        return Math.max(

            offer
                ?.distanceKm ??
            0,

            0
        );
    }


    // ========================================
    // Lieferzeit
    // ========================================

    getDeliveryHours(
        offer
    ) {

        return Math.max(

            offer
                ?.deliveryHours ??
            0,

            0
        );
    }


    // ========================================
    // Angebot bewerten
    //
    // Niedriger = besser
    // ========================================

    calculateOfferScore(
        offer,
        amount
    ) {

        const materialPrice =
            this.calculateMaterialPrice(
                offer,
                amount
            );


        const transportCost =
            this.getTransportCost(
                offer
            );


        const distanceKm =
            this.getDistance(
                offer
            );


        const deliveryHours =
            this.getDeliveryHours(
                offer
            );


        let score =

            materialPrice *
            this.settings
                .priceWeight

            +

            transportCost *
            this.settings
                .transportWeight

            +

            distanceKm *
            this.settings
                .distanceWeight

            +

            deliveryHours *
            this.settings
                .deliveryTimeWeight;


        // ========================================
        // Nahbereich bevorzugen
        // ========================================

        if (
            distanceKm <=
            this.settings
                .preferredLocalRadiusKm
        ) {

            score *=
                0.90;
        }

        else if (
            distanceKm >
            this.settings
                .extendedRadiusKm
        ) {

            score *=
                1.10;
        }


        return score;
    }


    // ========================================
    // Bestes Angebot suchen
    // ========================================

    findBestOffer(
        material
    ) {

        const offers =
            this.getMarketOffers(

                material.materialId,

                material.missingAmount
            );


        if (
            offers.length === 0
        ) {

            return null;
        }


        const evaluated =
            [];


        for (
            const offer
            of offers
        ) {

            const availableAmount =
                offer.availableAmount ??
                material.missingAmount;


            const amount =
                Math.min(

                    availableAmount,

                    material.missingAmount
                );


            if (
                amount <= 0
            ) {

                continue;
            }


            const materialPrice =
                this.calculateMaterialPrice(
                    offer,
                    amount
                );


            const transportCost =
                this.getTransportCost(
                    offer
                );


            evaluated.push({

                offer,

                amount,

                materialPrice,

                transportCost,

                totalCost:
                    materialPrice +
                    transportCost,

                distanceKm:
                    this.getDistance(
                        offer
                    ),

                deliveryHours:
                    this.getDeliveryHours(
                        offer
                    ),

                score:
                    this.calculateOfferScore(
                        offer,
                        amount
                    )
            });
        }


        if (
            evaluated.length === 0
        ) {

            return null;
        }


        evaluated.sort(

            (
                a,
                b
            ) =>

                a.score -
                b.score
        );


        return evaluated[0];
    }


    // ========================================
    // Einkaufsvorschlag erzeugen
    // ========================================

    createDailyPurchaseProposal() {

        const missing =
            this.calculateMissingMaterials();


        // ========================================
        // Alles vorhanden
        // ========================================

        if (
            missing.length === 0
        ) {

            this.status =
                "idle";


            this.currentProposal =
                null;


            return {

                success:
                    true,

                required:
                    false,

                message:
                    "Für den nächsten Bautag ist ausreichend Material vorhanden."
            };
        }


        const purchases =
            [];


        const unavailable =
            [];


        let totalMaterialCost =
            0;


        let totalTransportCost =
            0;


        // ========================================
        // Fehlende Materialien
        // ========================================

        for (
            const material
            of missing
        ) {

            // ------------------------------------
            // Wenn bereits genug bestellt oder
            // unterwegs ist, nicht doppelt kaufen.
            // ------------------------------------

            const alreadyIncoming =

                material.orderedAmount +

                material.inTransitAmount;


            const amountStillToOrder =
                Math.max(

                    material.missingAmount -
                    alreadyIncoming,

                    0
                );


            if (
                amountStillToOrder <= 0
            ) {

                continue;
            }


            const materialForSearch = {

                ...material,

                missingAmount:
                    amountStillToOrder
            };


            const bestOffer =
                this.findBestOffer(
                    materialForSearch
                );


            if (!bestOffer) {

                unavailable.push({

                    ...material,

                    amountStillToOrder
                });


                continue;
            }


            const purchase = {

                materialId:
                    material.materialId,

                name:
                    material.name,

                requiredAmount:
                    material.requiredAmount,

                availableAmount:
                    material.availableAmount,

                orderedAmount:
                    material.orderedAmount,

                inTransitAmount:
                    material.inTransitAmount,

                missingAmount:
                    material.missingAmount,

                orderAmount:
                    bestOffer.amount,

                unit:
                    material.unit,

                supplierId:
                    bestOffer
                        .offer
                        .supplierId ??
                    null,

                supplierName:
                    bestOffer
                        .offer
                        .supplierName ??
                    "Lieferant",

                pricePerUnit:
                    bestOffer
                        .offer
                        .pricePerUnit ??
                    bestOffer
                        .offer
                        .unitPrice ??
                    bestOffer
                        .offer
                        .price ??
                    0,

                materialCost:
                    bestOffer
                        .materialPrice,

                transportCost:
                    bestOffer
                        .transportCost,

                totalCost:
                    bestOffer
                        .totalCost,

                distanceKm:
                    bestOffer
                        .distanceKm,

                deliveryHours:
                    bestOffer
                        .deliveryHours,

                // --------------------------------
                // Gewichtsdaten für späteren
                // Transport
                // --------------------------------

                weightKg:
                    bestOffer
                        .offer
                        .weightKg ??
                    null,

                weightPerUnitKg:
                    bestOffer
                        .offer
                        .weightPerUnitKg ??
                    null,

                densityKgPerM3:
                    bestOffer
                        .offer
                        .densityKgPerM3 ??
                    null,

                offer:
                    bestOffer
                        .offer
            };


            purchases.push(
                purchase
            );


            totalMaterialCost +=
                purchase.materialCost;


            totalTransportCost +=
                purchase.transportCost;
        }


        // ========================================
        // Vorschlag speichern
        // ========================================

        this.currentProposal = {

            id:
                Date.now() +
                Math.random(),

            createdAt:
                new Date(),

            constructionId:
                this.construction
                    ?.id ??
                null,

            purchases,

            unavailable,

            totalMaterialCost,

            totalTransportCost,

            totalCost:

                totalMaterialCost +
                totalTransportCost,

            confirmed:
                false,

            rejected:
                false
        };


        this.status =
            "waiting_confirmation";


        this.addHistory(

            "purchase_proposal_created",

            {
                proposalId:
                    this.currentProposal.id,

                totalCost:
                    this.currentProposal
                        .totalCost,

                purchases:
                    purchases.length,

                unavailable:
                    unavailable.length
            }
        );


        return {

            success:
                true,

            required:
                true,

            proposal:
                this.currentProposal
        };
    }


    // ========================================
    // Einkauf bestätigen
    // ========================================

    confirmProposal() {

        if (
            !this.currentProposal
        ) {

            return {

                success:
                    false,

                reason:
                    "Kein Einkaufsvorschlag vorhanden"
            };
        }


        if (
            this.currentProposal
                .confirmed
        ) {

            return {

                success:
                    false,

                reason:
                    "Einkauf wurde bereits bestätigt"
            };
        }


        if (
            this.currentProposal
                .rejected
        ) {

            return {

                success:
                    false,

                reason:
                    "Einkauf wurde bereits abgelehnt"
            };
        }


        const totalCost =
            this.currentProposal
                .totalCost;


        // ========================================
        // Liquidität prüfen
        // ========================================

        if (
            this.company &&
            typeof this.company.money ===
                "number" &&
            this.company.money <
                totalCost
        ) {

            return {

                success:
                    false,

                reason:
                    "Nicht genügend Liquidität",

                required:
                    totalCost,

                available:
                    this.company.money
            };
        }


        // ========================================
        // Material als bestellt markieren
        //
        // Noch NICHT als vorhanden!
        // ========================================

        for (
            const purchase
            of this.currentProposal
                .purchases
        ) {

            if (
                typeof this.construction
                    ?.markMaterialOrdered ===
                "function"
            ) {

                this.construction
                    .markMaterialOrdered(

                        purchase.materialId,

                        purchase.orderAmount
                    );
            }
        }


        this.currentProposal
            .confirmed =
                true;


        this.currentProposal
            .confirmedAt =
                new Date();


        this.status =
            "ordered";


        this.addHistory(

            "purchase_proposal_confirmed",

            {
                proposalId:
                    this.currentProposal.id,

                totalCost
            }
        );


        return {

            success:
                true,

            proposal:
                this.currentProposal,

            message:
                "Einkauf bestätigt. Material ist bestellt, aber noch nicht auf der Baustelle."
        };
    }


    // ========================================
    // Einkauf ablehnen
    // ========================================

    rejectProposal() {

        if (
            !this.currentProposal
        ) {

            return false;
        }


        if (
            this.currentProposal
                .confirmed
        ) {

            return false;
        }


        this.currentProposal
            .rejected =
                true;


        this.currentProposal
            .rejectedAt =
                new Date();


        this.status =
            "idle";


        this.addHistory(

            "purchase_proposal_rejected",

            {
                proposalId:
                    this.currentProposal.id
            }
        );


        return true;
    }


    // ========================================
    // Tagesmeldung
    // ========================================

    getDailyMessage() {

        if (
            !this.currentProposal
        ) {

            return {

                title:
                    "Baustelle",

                message:
                    "Aktuell ist kein Materialeinkauf erforderlich."
            };
        }


        const proposal =
            this.currentProposal;


        return {

            title:
                "Bauleiter – Materialeinkauf",

            message:
                "Für den nächsten Bautag wird Baumaterial benötigt.",

            totalMaterialCost:
                proposal.totalMaterialCost,

            totalTransportCost:
                proposal.totalTransportCost,

            totalCost:
                proposal.totalCost,

            purchases:
                proposal.purchases,

            unavailable:
                proposal.unavailable,

            requiresConfirmation:

                !proposal.confirmed &&
                !proposal.rejected
        };
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

            dailyRequirements:
                this.dailyRequirements,

            missingMaterials:
                this.missingMaterials,

            currentProposal:
                this.currentProposal,

            history:
                this.history
        };
    }
}