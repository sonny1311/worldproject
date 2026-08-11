// ============================================
// PurchaseOrder.js
// WorldProject
//
// Allgemeine Bestellung
//
// Verbindet:
// - Lieferantenangebot
// - Spielerbestätigung
// - Warenkosten
// - Transportauftrag
// - Zahlungsstatus
// - Lieferstatus
// ============================================

export class PurchaseOrder {

    constructor({

        offer,

        amount,

        company,

        transportOrder = null

    }) {

        // ========================================
        // ID
        // ========================================

        this.id =
            Date.now() +
            Math.random();


        // ========================================
        // Angebot
        // ========================================

        this.offer =
            offer;


        // ========================================
        // Bestellmenge
        // ========================================

        this.amount =
            amount;


        // ========================================
        // Unternehmen
        // ========================================

        this.company =
            company;


        // ========================================
        // Transport
        // ========================================

        this.transportOrder =
            transportOrder;


        // ========================================
        // Kosten
        // ========================================

        this.costs = {

            goods:
                0,

            transport:
                0,

            total:
                0
        };


        // ========================================
        // Status
        // ========================================

        this.status =
            "created";


        // created
        // awaiting_confirmation
        // confirmed
        // paid
        // transport_pending
        // in_transit
        // delivered
        // cancelled
        // failed


        // ========================================
        // Zahlung
        // ========================================

        this.payment = {

            reserved:
                false,

            paid:
                false,

            amount:
                0
        };


        // ========================================
        // Lieferung
        // ========================================

        this.delivery = {

            started:
                false,

            delivered:
                false,

            startedAt:
                null,

            deliveredAt:
                null
        };


        // ========================================
        // Zeitstempel
        // ========================================

        this.createdAt =
            new Date();


        this.confirmedAt =
            null;


        this.calculateCosts();
    }


    // ========================================
    // Kosten berechnen
    // ========================================

    calculateCosts() {

        if (
            !this.offer
        ) {

            return false;
        }


        const goodsCost =
            this.offer
                .calculateGoodsCost(
                    this.amount
                );


        let transportCost =
            0;


        if (
            this.offer
                .lastCalculation
        ) {

            transportCost =
                this.offer
                    .lastCalculation
                    .transportCost ??
                0;
        }


        this.costs.goods =
            goodsCost;


        this.costs.transport =
            transportCost;


        this.costs.total =
            goodsCost +
            transportCost;


        this.payment.amount =
            this.costs.total;


        return true;
    }


    // ========================================
    // Kann Unternehmen bezahlen?
    // ========================================

    canCompanyPay() {

        if (
            !this.company
        ) {

            return false;
        }


        if (
            typeof this.company.money !==
            "number"
        ) {

            return false;
        }


        return (
            this.company.money >=
            this.costs.total
        );
    }


    // ========================================
    // Bestellung bestätigen
    // ========================================

    confirm() {

        if (
            this.status !==
            "created" &&
            this.status !==
            "awaiting_confirmation"
        ) {

            return false;
        }


        if (
            !this.canCompanyPay()
        ) {

            this.status =
                "failed";


            return false;
        }


        this.status =
            "confirmed";


        this.confirmedAt =
            new Date();


        return true;
    }


    // ========================================
    // Geld abbuchen
    // ========================================

    pay() {

        if (
            this.status !==
            "confirmed"
        ) {

            return false;
        }


        if (
            !this.canCompanyPay()
        ) {

            this.status =
                "failed";


            return false;
        }


        this.company.money -=
            this.costs.total;


        this.payment.paid =
            true;


        this.status =
            "paid";


        return true;
    }


    // ========================================
    // Transport starten
    // ========================================

    startTransport() {

        if (
            this.status !==
            "paid"
        ) {

            return false;
        }


        if (
            !this.transportOrder
        ) {

            this.status =
                "failed";


            return false;
        }


        this.transportOrder
            .setStatus(
                "driving"
            );


        this.delivery.started =
            true;


        this.delivery.startedAt =
            new Date();


        this.status =
            "in_transit";


        return true;
    }


    // ========================================
    // Lieferung abschließen
    // ========================================

    markDelivered() {

        if (
            this.status !==
            "in_transit"
        ) {

            return false;
        }


        this.delivery.delivered =
            true;


        this.delivery.deliveredAt =
            new Date();


        this.status =
            "delivered";


        if (
            this.transportOrder
        ) {

            this.transportOrder
                .setStatus(
                    "completed"
                );
        }


        return true;
    }


    // ========================================
    // Bestellung abbrechen
    // ========================================

    cancel() {

        if (
            this.status ===
            "delivered"
        ) {

            return false;
        }


        this.status =
            "cancelled";


        return true;
    }


    // ========================================
    // Übersicht
    // ========================================

    getInfo() {

        return {

            id:
                this.id,

            materialId:
                this.offer
                    ?.materialId,

            amount:
                this.amount,

            goodsCost:
                this.costs.goods,

            transportCost:
                this.costs.transport,

            totalCost:
                this.costs.total,

            status:
                this.status,

            paid:
                this.payment.paid,

            transportStarted:
                this.delivery.started,

            delivered:
                this.delivery.delivered,

            createdAt:
                this.createdAt,

            confirmedAt:
                this.confirmedAt,

            deliveredAt:
                this.delivery.deliveredAt
        };
    }
}